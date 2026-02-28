/**
 * Home Data Queries
 * ==================
 * Orchestrates all data fetching for the dynamic homepage. Combines Supabase
 * queries with context engines (festival, time, day, location) to produce a
 * single `HomePageData` object consumed by the server component.
 *
 * Design principles:
 *   - All DB queries run via `Promise.all` for max parallelism
 *   - Graceful degradation: if a new table doesn't exist yet, fallback to
 *     empty arrays (migration may not have run)
 *   - Typed return values for strict component contracts
 */

import {
  getActiveFestival,
  getUpcomingFestival,
  type FestivalContext,
} from "@/lib/festivals";
import {
  getTimeContext,
  getDayContext,
  getSeasonContext,
  type ContextSuggestion,
  type SeasonContext,
} from "@/lib/context-engine";
import {
  getUserLocation,
  getServiceAreas,
  findNearestServiceArea,
  haversineDistance,
  type UserLocation,
  type ServiceArea,
  type NearestServiceArea,
} from "@/lib/location";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type BannerRow = Database["public"]["Tables"]["banners"]["Row"];
type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type CategoryLite = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name"
>;

export type CampaignWithProducts = CampaignRow & {
  products: ProductRow[];
};

export type CollectionWithProducts = CollectionRow & {
  products: ProductRow[];
};

export type HomePageData = {
  // Core
  categories: CategoryLite[];
  featured: ProductRow[];

  // Dynamic sections
  activeCampaign: CampaignWithProducts | null;
  banners: BannerRow[];
  bestSellers: ProductRow[];
  deals: ProductRow[];
  collections: CollectionWithProducts[];

  // Context engines
  festival: FestivalContext | null;
  upcomingFestival: FestivalContext | null;
  festivalProducts: ProductRow[];
  timeContext: ContextSuggestion;
  dayContext: ContextSuggestion;
  seasonContext: SeasonContext;

  // Location
  userLocation: UserLocation;
  serviceAreas: ServiceArea[];
  nearestServiceArea: NearestServiceArea | null;
  deliveryEta: number | null;
  deliveryDistanceKm: number | null;
};

// ---------------------------------------------------------------------------
// Safe query wrappers (graceful fallback if table doesn't exist)
// ---------------------------------------------------------------------------

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Main Query
// ---------------------------------------------------------------------------

export async function getEnhancedHomeData(
  userId?: string | null,
): Promise<HomePageData> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  // Run context engines (synchronous — no awaits needed)
  const festival = getActiveFestival();
  const upcomingFestival = getUpcomingFestival();
  const timeContext = getTimeContext();
  const dayContext = getDayContext();
  const seasonContext = getSeasonContext();

  // Run all DB queries in parallel
  const [
    categoriesResult,
    featuredResult,
    bannersResult,
    campaignResult,
    bestSellersResult,
    dealsResult,
    collectionsResult,
    festivalProductsResult,
    userLocation,
    serviceAreas,
  ] = await Promise.all([
    // 1. Categories
    supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true }),

    // 2. Featured / newest products
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(8),

    // 3. Active banners (geo-filtered when coordinates available)
    safeQuery(async () => {
      // We'll use the geo RPC after we have the user location.
      // For now, fetch all active banners — geo filtering happens below.
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .order("sort_order", { ascending: true });
      return data;
    }, null),

    // 4. Active campaign with products
    safeQuery(async () => {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .order("priority", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!campaign) return null;

      const { data: campaignProducts } = await supabase
        .from("campaign_products")
        .select("product_id, sort_order")
        .eq("campaign_id", campaign.id)
        .order("sort_order", { ascending: true });

      if (!campaignProducts || campaignProducts.length === 0) {
        return { ...campaign, products: [] } as CampaignWithProducts;
      }

      const productIds = campaignProducts.map((cp) => cp.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .eq("is_active", true)
        .gt("stock", 0);

      // Preserve sort order from campaign_products
      const sorted = productIds
        .map((id) => (products ?? []).find((p) => p.id === id))
        .filter(Boolean) as ProductRow[];

      return { ...campaign, products: sorted } as CampaignWithProducts;
    }, null),

    // 5. Best sellers
    safeQuery(async () => {
      const { data } = await supabase.rpc("get_best_sellers", {
        days_back: 30,
        result_limit: 8,
      });
      return data;
    }, null),

    // 6. Active deals
    safeQuery(async () => {
      const { data } = await supabase.rpc("get_active_deals", {
        result_limit: 8,
      });
      return data;
    }, null),

    // 7. Collections with products
    safeQuery(async () => {
      const { data: collections } = await supabase
        .from("collections")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(4);

      if (!collections || collections.length === 0) return [];

      const withProducts = await Promise.all(
        collections.map(async (collection) => {
          const { data: collectionProducts } = await supabase
            .from("collection_products")
            .select("product_id, sort_order")
            .eq("collection_id", collection.id)
            .order("sort_order", { ascending: true })
            .limit(8);

          if (!collectionProducts || collectionProducts.length === 0) {
            return { ...collection, products: [] } as CollectionWithProducts;
          }

          const productIds = collectionProducts.map((cp) => cp.product_id);
          const { data: products } = await supabase
            .from("products")
            .select("*")
            .in("id", productIds)
            .eq("is_active", true)
            .gt("stock", 0);

          const sorted = productIds
            .map((id) => (products ?? []).find((p) => p.id === id))
            .filter(Boolean) as ProductRow[];

          return { ...collection, products: sorted } as CollectionWithProducts;
        }),
      );

      return withProducts;
    }, []),

    // 8. Festival-tagged products
    safeQuery(async () => {
      if (!festival) return [];

      const { data: taggedEntries } = await supabase
        .from("product_tags")
        .select("product_id")
        .in("tag", festival.tags)
        .limit(20);

      if (!taggedEntries || taggedEntries.length === 0) return [];

      const uniqueIds = [...new Set(taggedEntries.map((t) => t.product_id))];
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .in("id", uniqueIds)
        .eq("is_active", true)
        .gt("stock", 0)
        .limit(8);

      return products ?? [];
    }, []),

    // 9. User location
    getUserLocation(userId),

    // 10. Service areas
    getServiceAreas(),
  ]);

  // Geo-filter banners: only show banners where user is within target radius
  // (banners without geo-targeting are global and always shown)
  const filteredBanners = (bannersResult ?? []).filter((b) => {
    // No geo target → global banner
    if (!b.target_lat || !b.target_lng) return true;
    // No user coords → fall back to text-based location_area match
    if (!userLocation.latitude || !userLocation.longitude) {
      return (
        !b.location_area ||
        b.location_area.toLowerCase() === userLocation.area.toLowerCase()
      );
    }
    // Geo check via haversine (PostGIS RPC runs server-side for exact match)
    const dist = haversineDistance(
      userLocation.latitude,
      userLocation.longitude,
      b.target_lat,
      b.target_lng,
    );
    return dist <= (b.target_radius_km ?? 5);
  });

  // Geo-filter active campaign
  let filteredCampaign = campaignResult;
  if (filteredCampaign?.target_lat && filteredCampaign?.target_lng) {
    if (userLocation.latitude && userLocation.longitude) {
      const dist = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        filteredCampaign.target_lat,
        filteredCampaign.target_lng,
      );
      if (dist > (filteredCampaign.target_radius_km ?? 10)) {
        filteredCampaign = null;
      }
    }
  }

  // Resolve delivery ETA — prefer geo-based nearest service area
  let nearestServiceArea: NearestServiceArea | null = null;
  if (userLocation.latitude && userLocation.longitude) {
    nearestServiceArea = await findNearestServiceArea(
      userLocation.latitude,
      userLocation.longitude,
    );
  }

  // Fallback: text-based service area match
  const areaMatch =
    nearestServiceArea ??
    serviceAreas.find(
      (sa) => sa.area_name.toLowerCase() === userLocation.area.toLowerCase(),
    );

  return {
    categories: categoriesResult.data ?? [],
    featured: featuredResult.data ?? [],
    activeCampaign: filteredCampaign,
    banners: filteredBanners,
    bestSellers: bestSellersResult ?? [],
    deals: dealsResult ?? [],
    collections: collectionsResult,
    festival,
    upcomingFestival,
    festivalProducts: festivalProductsResult,
    timeContext,
    dayContext,
    seasonContext,
    userLocation,
    serviceAreas,
    nearestServiceArea,
    deliveryEta: areaMatch?.delivery_eta_minutes ?? null,
    deliveryDistanceKm: nearestServiceArea?.distance_km ?? null,
  };
}
