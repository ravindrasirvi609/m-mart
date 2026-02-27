-- ============================================================================
-- Migration: Dynamic Campaigns, Banners, Collections & Location System
-- Date: 2026-02-28
-- Description: Adds festival/seasonal campaign management, promotional banners,
--              curated product collections, product tagging, view tracking,
--              and user location preferences for location-aware content.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Campaigns — Admin-created seasonal / festival promotions
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  campaign_type text not null check (
    campaign_type in ('festival', 'seasonal', 'flash_sale', 'weekly', 'custom')
  ),
  hero_title text not null,
  hero_subtitle text,
  hero_image_url text,
  hero_bg_gradient text,
  badge_text text,
  discount_label text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  constraint valid_campaign_dates check (ends_at > starts_at)
);

create index if not exists idx_campaigns_active_dates
  on public.campaigns (is_active, starts_at, ends_at);
create index if not exists idx_campaigns_slug
  on public.campaigns (slug);

-- ---------------------------------------------------------------------------
-- 2. Campaign Products — Many-to-many link between campaigns and products
-- ---------------------------------------------------------------------------
create table if not exists public.campaign_products (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (campaign_id, product_id)
);

create index if not exists idx_campaign_products_campaign
  on public.campaign_products (campaign_id);

-- ---------------------------------------------------------------------------
-- 3. Banners — Rotating promotional banners on the homepage
-- ---------------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text,
  bg_color text,
  location_area text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default '2099-12-31'::timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint valid_banner_dates check (ends_at > starts_at)
);

create index if not exists idx_banners_active_dates
  on public.banners (is_active, starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- 4. Product Tags — For smart filtering (festival, seasonal, time-of-day)
-- ---------------------------------------------------------------------------
create table if not exists public.product_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tag text not null,
  unique (product_id, tag)
);

create index if not exists idx_product_tags_tag
  on public.product_tags (tag);
create index if not exists idx_product_tags_product
  on public.product_tags (product_id);

-- ---------------------------------------------------------------------------
-- 5. Curated Collections — Themed groupings like "Morning Essentials"
-- ---------------------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon_name text,
  bg_color text default '#fff4ef',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

create index if not exists idx_collections_active
  on public.collections (is_active, sort_order);
create index if not exists idx_collection_products_collection
  on public.collection_products (collection_id);

-- ---------------------------------------------------------------------------
-- 6. User Locations — Store user's delivery area for location-aware content
-- ---------------------------------------------------------------------------
create table if not exists public.user_locations (
  user_id uuid primary key references public.users(id) on delete cascade,
  area text not null,
  city text not null default 'Pune',
  pincode text,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_locations_area
  on public.user_locations (area);
create index if not exists idx_user_locations_city
  on public.user_locations (city);

-- ---------------------------------------------------------------------------
-- 7. Service Areas — Define deliverable areas with metadata
-- ---------------------------------------------------------------------------
create table if not exists public.service_areas (
  id uuid primary key default gen_random_uuid(),
  area_name text not null unique,
  city text not null default 'Pune',
  pincode text,
  is_active boolean not null default true,
  delivery_eta_minutes integer not null default 45,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_service_areas_active
  on public.service_areas (is_active, area_name);

-- ---------------------------------------------------------------------------
-- 8. Best Sellers RPC — Most ordered products in a time window
-- ---------------------------------------------------------------------------
create or replace function public.get_best_sellers(
  days_back integer default 30,
  result_limit integer default 8
)
returns setof public.products
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.products p
  inner join (
    select oi.product_id, sum(oi.quantity) as total_sold
    from public.order_items oi
    inner join public.orders o on o.id = oi.order_id
    where o.created_at > now() - make_interval(days => days_back)
      and o.payment_status = 'paid'
    group by oi.product_id
    order by total_sold desc
    limit result_limit
  ) top_products on top_products.product_id = p.id
  where p.is_active = true
    and p.stock > 0
  order by top_products.total_sold desc;
$$;

grant execute on function public.get_best_sellers(integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Deals RPC — Products with active discounts sorted by discount %
-- ---------------------------------------------------------------------------
create or replace function public.get_active_deals(result_limit integer default 8)
returns setof public.products
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.products
  where is_active = true
    and stock > 0
    and discount_price is not null
    and discount_price < price
  order by ((price - discount_price) / price) desc
  limit result_limit;
$$;

grant execute on function public.get_active_deals(integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. Row Level Security
-- ---------------------------------------------------------------------------

-- Campaigns
alter table public.campaigns enable row level security;

drop policy if exists "Campaigns are publicly readable" on public.campaigns;
create policy "Campaigns are publicly readable"
  on public.campaigns for select
  using (is_active = true or public.is_admin());

drop policy if exists "Only admins can manage campaigns" on public.campaigns;
create policy "Only admins can manage campaigns"
  on public.campaigns for all
  using (public.is_admin())
  with check (public.is_admin());

-- Campaign Products
alter table public.campaign_products enable row level security;

drop policy if exists "Campaign products are publicly readable" on public.campaign_products;
create policy "Campaign products are publicly readable"
  on public.campaign_products for select
  using (true);

drop policy if exists "Only admins can manage campaign products" on public.campaign_products;
create policy "Only admins can manage campaign products"
  on public.campaign_products for all
  using (public.is_admin())
  with check (public.is_admin());

-- Banners
alter table public.banners enable row level security;

drop policy if exists "Banners are publicly readable" on public.banners;
create policy "Banners are publicly readable"
  on public.banners for select
  using (is_active = true or public.is_admin());

drop policy if exists "Only admins can manage banners" on public.banners;
create policy "Only admins can manage banners"
  on public.banners for all
  using (public.is_admin())
  with check (public.is_admin());

-- Product Tags
alter table public.product_tags enable row level security;

drop policy if exists "Product tags are publicly readable" on public.product_tags;
create policy "Product tags are publicly readable"
  on public.product_tags for select
  using (true);

drop policy if exists "Only admins can manage product tags" on public.product_tags;
create policy "Only admins can manage product tags"
  on public.product_tags for all
  using (public.is_admin())
  with check (public.is_admin());

-- Collections
alter table public.collections enable row level security;

drop policy if exists "Collections are publicly readable" on public.collections;
create policy "Collections are publicly readable"
  on public.collections for select
  using (is_active = true or public.is_admin());

drop policy if exists "Only admins can manage collections" on public.collections;
create policy "Only admins can manage collections"
  on public.collections for all
  using (public.is_admin())
  with check (public.is_admin());

-- Collection Products
alter table public.collection_products enable row level security;

drop policy if exists "Collection products are publicly readable" on public.collection_products;
create policy "Collection products are publicly readable"
  on public.collection_products for select
  using (true);

drop policy if exists "Only admins can manage collection products" on public.collection_products;
create policy "Only admins can manage collection products"
  on public.collection_products for all
  using (public.is_admin())
  with check (public.is_admin());

-- User Locations
alter table public.user_locations enable row level security;

drop policy if exists "Users can view own location" on public.user_locations;
create policy "Users can view own location"
  on public.user_locations for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can upsert own location" on public.user_locations;
create policy "Users can upsert own location"
  on public.user_locations for insert
  with check (user_id = auth.uid());

drop policy if exists "Users can update own location" on public.user_locations;
create policy "Users can update own location"
  on public.user_locations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service Areas
alter table public.service_areas enable row level security;

drop policy if exists "Service areas are publicly readable" on public.service_areas;
create policy "Service areas are publicly readable"
  on public.service_areas for select
  using (is_active = true or public.is_admin());

drop policy if exists "Only admins can manage service areas" on public.service_areas;
create policy "Only admins can manage service areas"
  on public.service_areas for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 11. Seed default service areas for Pune
-- ---------------------------------------------------------------------------
insert into public.service_areas (area_name, city, pincode, delivery_eta_minutes, sort_order) values
  ('Hinjewadi Phase 1', 'Pune', '411057', 30, 1),
  ('Hinjewadi Phase 2', 'Pune', '411057', 35, 2),
  ('Hinjewadi Phase 3', 'Pune', '411057', 40, 3),
  ('Wakad', 'Pune', '411057', 35, 4),
  ('Pimple Saudagar', 'Pune', '411027', 40, 5),
  ('Balewadi', 'Pune', '411045', 35, 6),
  ('Baner', 'Pune', '411045', 40, 7),
  ('Aundh', 'Pune', '411007', 45, 8),
  ('Pimple Nilakh', 'Pune', '411027', 40, 9),
  ('Mahalunge', 'Pune', '411045', 45, 10),
  ('Kasarwadi', 'Pune', '411034', 40, 11),
  ('Ravet', 'Pune', '412101', 50, 12),
  ('Tathawade', 'Pune', '411033', 35, 13),
  ('Maan', 'Pune', '411057', 45, 14),
  ('Mukai Nagar', 'Pune', '411057', 15, 0)
on conflict (area_name) do nothing;
