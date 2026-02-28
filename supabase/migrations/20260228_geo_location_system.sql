-- ============================================================================
-- Migration: Geolocation-Based Targeting System
-- Date: 2026-02-28
-- Description: Upgrades the location system from text-based area matching to
--              coordinate-based proximity targeting using PostGIS.
--
-- Changes:
--   1. Enable PostGIS extension
--   2. Add geo columns to user_locations (home + last-seen coordinates)
--   3. Add geo columns to service_areas (centre point + radius + boundary)
--   4. Replace banners.location_area with target_lat, target_lng, target_radius_km
--   5. Add campaign geo-targeting columns
--   6. Add spatial indexes for fast proximity queries
--   7. Add delivery-fee-band & delivery-fee support on service_areas
--   8. Add RPC for geo-based banner/service-area lookups
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Enable PostGIS (idempotent — Supabase already ships with it)
-- ---------------------------------------------------------------------------
create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- 1. Upgrade user_locations — add home/last coordinates + source metadata
-- ---------------------------------------------------------------------------
-- Instead of purely relying on text "area", store precise coordinates.
-- We keep the existing text columns for backward compatibility and fallback.
alter table public.user_locations
  add column if not exists location_source text
    check (location_source in ('gps', 'ip', 'manual', 'address'))
    default 'manual',
  add column if not exists accuracy_metres double precision,
  add column if not exists last_latitude double precision,
  add column if not exists last_longitude double precision,
  add column if not exists last_location_updated_at timestamptz;

-- Spatial index on home coordinates (using a functional GIST index)
-- We can't use GEOGRAPHY columns via ALTER ADD with generated values,
-- so we use a functional index on ST_Point and raw lat/lng columns.
create index if not exists idx_user_locations_home_geo
  on public.user_locations using gist (
    (st_setsrid(st_point(longitude, latitude), 4326)::geography)
  )
  where latitude is not null and longitude is not null;

-- ---------------------------------------------------------------------------
-- 2. Upgrade service_areas — add centre point, radius, delivery fee bands
-- ---------------------------------------------------------------------------
alter table public.service_areas
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists radius_km numeric(6, 2) default 5.0,
  add column if not exists delivery_fee numeric(10, 2) default 0,
  add column if not exists min_order_free_delivery numeric(10, 2) default 500;

-- Spatial index on service area centres
create index if not exists idx_service_areas_geo
  on public.service_areas using gist (
    (st_setsrid(st_point(longitude, latitude), 4326)::geography)
  )
  where latitude is not null and longitude is not null;

-- ---------------------------------------------------------------------------
-- 3. Upgrade banners — replace text location_area with geo-targeting
-- ---------------------------------------------------------------------------
-- Keep location_area for backward compat but add geo columns.
alter table public.banners
  add column if not exists target_lat double precision,
  add column if not exists target_lng double precision,
  add column if not exists target_radius_km numeric(6, 2);

-- Spatial index on banner targets
create index if not exists idx_banners_target_geo
  on public.banners using gist (
    (st_setsrid(st_point(target_lng, target_lat), 4326)::geography)
  )
  where target_lat is not null and target_lng is not null;

-- ---------------------------------------------------------------------------
-- 4. Upgrade campaigns — add geo-targeting (optional zone)
-- ---------------------------------------------------------------------------
alter table public.campaigns
  add column if not exists target_lat double precision,
  add column if not exists target_lng double precision,
  add column if not exists target_radius_km numeric(6, 2);

create index if not exists idx_campaigns_target_geo
  on public.campaigns using gist (
    (st_setsrid(st_point(target_lng, target_lat), 4326)::geography)
  )
  where target_lat is not null and target_lng is not null;

-- ---------------------------------------------------------------------------
-- 5. RPC: Find nearest service area for a coordinate
-- ---------------------------------------------------------------------------
create or replace function public.find_nearest_service_area(
  p_lat double precision,
  p_lng double precision,
  p_max_distance_km double precision default 50.0
)
returns table (
  id uuid,
  area_name text,
  city text,
  pincode text,
  delivery_eta_minutes integer,
  delivery_fee numeric,
  min_order_free_delivery numeric,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sa.id,
    sa.area_name,
    sa.city,
    sa.pincode,
    sa.delivery_eta_minutes,
    sa.delivery_fee,
    sa.min_order_free_delivery,
    round(
      (st_distance(
        st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
        st_setsrid(st_point(p_lng, p_lat), 4326)::geography
      ) / 1000.0)::numeric,
      2
    )::double precision as distance_km
  from public.service_areas sa
  where sa.is_active = true
    and sa.latitude is not null
    and sa.longitude is not null
    and st_dwithin(
      st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
      st_setsrid(st_point(p_lng, p_lat), 4326)::geography,
      p_max_distance_km * 1000  -- ST_DWithin uses metres
    )
  order by st_distance(
    st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
    st_setsrid(st_point(p_lng, p_lat), 4326)::geography
  )
  limit 1;
$$;

grant execute on function public.find_nearest_service_area(double precision, double precision, double precision)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. RPC: Get geo-targeted banners for a coordinate
-- ---------------------------------------------------------------------------
create or replace function public.get_geo_targeted_banners(
  p_lat double precision default null,
  p_lng double precision default null
)
returns setof public.banners
language sql
stable
security definer
set search_path = public
as $$
  select b.*
  from public.banners b
  where b.is_active = true
    and now() between b.starts_at and b.ends_at
    and (
      -- Global banners (no geo target set) always shown
      (b.target_lat is null or b.target_lng is null)
      or (
        -- Geo-targeted: user must be within radius
        p_lat is not null
        and p_lng is not null
        and st_dwithin(
          st_setsrid(st_point(b.target_lng, b.target_lat), 4326)::geography,
          st_setsrid(st_point(p_lng, p_lat), 4326)::geography,
          coalesce(b.target_radius_km, 5.0) * 1000
        )
      )
    )
  order by b.sort_order;
$$;

grant execute on function public.get_geo_targeted_banners(double precision, double precision)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. RPC: Get geo-targeted active campaign
-- ---------------------------------------------------------------------------
create or replace function public.get_geo_targeted_campaign(
  p_lat double precision default null,
  p_lng double precision default null
)
returns setof public.campaigns
language sql
stable
security definer
set search_path = public
as $$
  select c.*
  from public.campaigns c
  where c.is_active = true
    and now() between c.starts_at and c.ends_at
    and (
      (c.target_lat is null or c.target_lng is null)
      or (
        p_lat is not null
        and p_lng is not null
        and st_dwithin(
          st_setsrid(st_point(c.target_lng, c.target_lat), 4326)::geography,
          st_setsrid(st_point(p_lng, p_lat), 4326)::geography,
          coalesce(c.target_radius_km, 10.0) * 1000
        )
      )
    )
  order by c.priority desc
  limit 1;
$$;

grant execute on function public.get_geo_targeted_campaign(double precision, double precision)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Update seed data — add coordinates for Pune service areas
-- ---------------------------------------------------------------------------
update public.service_areas set latitude = 18.5912, longitude = 73.7388, radius_km = 3.0 where area_name = 'Hinjewadi Phase 1';
update public.service_areas set latitude = 18.5976, longitude = 73.7234, radius_km = 3.0 where area_name = 'Hinjewadi Phase 2';
update public.service_areas set latitude = 18.6047, longitude = 73.7102, radius_km = 3.0 where area_name = 'Hinjewadi Phase 3';
update public.service_areas set latitude = 18.5997, longitude = 73.7603, radius_km = 3.5 where area_name = 'Wakad';
update public.service_areas set latitude = 18.5951, longitude = 73.7971, radius_km = 3.0 where area_name = 'Pimple Saudagar';
update public.service_areas set latitude = 18.5814, longitude = 73.7683, radius_km = 3.0 where area_name = 'Balewadi';
update public.service_areas set latitude = 18.5606, longitude = 73.7725, radius_km = 3.5 where area_name = 'Baner';
update public.service_areas set latitude = 18.5596, longitude = 73.8074, radius_km = 3.0 where area_name = 'Aundh';
update public.service_areas set latitude = 18.5827, longitude = 73.7994, radius_km = 2.5 where area_name = 'Pimple Nilakh';
update public.service_areas set latitude = 18.5722, longitude = 73.7442, radius_km = 3.0 where area_name = 'Mahalunge';
update public.service_areas set latitude = 18.6154, longitude = 73.7943, radius_km = 2.5 where area_name = 'Kasarwadi';
update public.service_areas set latitude = 18.6459, longitude = 73.7538, radius_km = 3.5 where area_name = 'Ravet';
update public.service_areas set latitude = 18.6125, longitude = 73.7573, radius_km = 3.0 where area_name = 'Tathawade';
update public.service_areas set latitude = 18.5758, longitude = 73.7178, radius_km = 3.0 where area_name = 'Maan';
update public.service_areas set latitude = 18.5943, longitude = 73.7412, radius_km = 1.5 where area_name = 'Mukai Nagar';
