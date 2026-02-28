-- ============================================================================
-- Migration: Real-time Delivery Tracking System
-- Date: 2026-02-28
-- Description: Adds delivery agents, order tracking timeline, and live
--              location tracking for out-for-delivery orders. Enables
--              customers to see a live map with driver position and ETA.
--
-- Changes:
--   1. delivery_agents table — delivery personnel registry
--   2. order_status_history table — full audit log of every status change
--   3. delivery_tracking table — latest driver GPS per active delivery
--   4. delivery assignment column on orders
--   5. RPCs for tracking: update driver location, get tracking info
--   6. Realtime publication for delivery_tracking
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Delivery Agents — riders/drivers who carry out deliveries
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.delivery_agents enable row level security;

-- Admins can manage delivery agents
create policy "Admin full access on delivery_agents"
  on public.delivery_agents for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Order Status History — audit trail for every status change
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_status text not null,
  payment_status text not null,
  changed_by uuid references auth.users(id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order
  on public.order_status_history (order_id, created_at desc);

alter table public.order_status_history enable row level security;

-- Customers can read their own order history
create policy "Customers read own order history"
  on public.order_status_history for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.user_id = auth.uid()
    )
  );

-- Admins full access
create policy "Admin full access on order_status_history"
  on public.order_status_history for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Delivery Tracking — live driver GPS position per order
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_tracking (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  agent_id uuid references public.delivery_agents(id),
  latitude double precision not null,
  longitude double precision not null,
  heading double precision,          -- compass direction 0–360
  speed double precision,            -- km/h
  estimated_arrival timestamptz,
  updated_at timestamptz not null default now()
);

-- Only one active tracking row per order (upsert pattern)
create unique index if not exists idx_delivery_tracking_order
  on public.delivery_tracking (order_id);

alter table public.delivery_tracking enable row level security;

-- Customers can read tracking for their own orders
create policy "Customers read own delivery tracking"
  on public.delivery_tracking for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = delivery_tracking.order_id
        and o.user_id = auth.uid()
    )
  );

-- Admins full access
create policy "Admin full access on delivery_tracking"
  on public.delivery_tracking for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Add delivery agent assignment to orders
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists assigned_agent_id uuid references public.delivery_agents(id),
  add column if not exists delivered_at timestamptz,
  add column if not exists out_for_delivery_at timestamptz;

-- ---------------------------------------------------------------------------
-- 5. RPC: Update driver location (called from admin/driver interface)
-- ---------------------------------------------------------------------------
create or replace function public.update_delivery_location(
  p_order_id uuid,
  p_lat double precision,
  p_lng double precision,
  p_heading double precision default null,
  p_speed double precision default null,
  p_eta_minutes integer default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_eta timestamptz;
begin
  -- Verify order exists and is out for delivery
  select * into v_order
  from public.orders
  where id = p_order_id
    and order_status = 'out_for_delivery';

  if not found then
    return false;
  end if;

  -- Calculate estimated arrival
  if p_eta_minutes is not null and p_eta_minutes > 0 then
    v_eta := now() + (p_eta_minutes || ' minutes')::interval;
  end if;

  -- Upsert tracking record
  insert into public.delivery_tracking (
    order_id, agent_id, latitude, longitude, heading, speed, estimated_arrival, updated_at
  )
  values (
    p_order_id, v_order.assigned_agent_id, p_lat, p_lng, p_heading, p_speed, v_eta, now()
  )
  on conflict (order_id) do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    heading = excluded.heading,
    speed = excluded.speed,
    estimated_arrival = excluded.estimated_arrival,
    updated_at = now();

  return true;
end;
$$;

grant execute on function public.update_delivery_location(uuid, double precision, double precision, double precision, double precision, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 6. RPC: Get full tracking info for an order (customer-facing)
-- ---------------------------------------------------------------------------
create or replace function public.get_order_tracking(
  p_order_id uuid
)
returns table (
  order_id uuid,
  order_status text,
  payment_status text,
  delivery_area text,
  store_lat double precision,
  store_lng double precision,
  customer_lat double precision,
  customer_lng double precision,
  driver_lat double precision,
  driver_lng double precision,
  driver_heading double precision,
  driver_speed double precision,
  estimated_arrival timestamptz,
  agent_name text,
  agent_phone text,
  assigned_at timestamptz,
  out_for_delivery_at timestamptz,
  delivered_at timestamptz,
  tracking_updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id as order_id,
    o.order_status,
    o.payment_status,
    o.delivery_area,
    -- Store location (Mmart Pune)
    18.5913 as store_lat,
    73.7389 as store_lng,
    -- Customer delivery coordinates
    o.delivery_lat as customer_lat,
    o.delivery_lng as customer_lng,
    -- Driver location
    dt.latitude as driver_lat,
    dt.longitude as driver_lng,
    dt.heading as driver_heading,
    dt.speed as driver_speed,
    dt.estimated_arrival,
    -- Agent info
    da.name as agent_name,
    da.phone as agent_phone,
    -- Timestamps
    o.out_for_delivery_at as assigned_at,
    o.out_for_delivery_at,
    o.delivered_at,
    dt.updated_at as tracking_updated_at
  from public.orders o
  left join public.delivery_tracking dt on dt.order_id = o.id
  left join public.delivery_agents da on da.id = o.assigned_agent_id
  where o.id = p_order_id
    and (
      o.user_id = auth.uid()
      or public.is_admin()
    );
$$;

grant execute on function public.get_order_tracking(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 7. RPC: Get order status timeline
-- ---------------------------------------------------------------------------
create or replace function public.get_order_timeline(
  p_order_id uuid
)
returns table (
  id uuid,
  order_status text,
  payment_status text,
  changed_by uuid,
  note text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    h.id,
    h.order_status,
    h.payment_status,
    h.changed_by,
    h.note,
    h.created_at
  from public.order_status_history h
  inner join public.orders o on o.id = h.order_id
  where h.order_id = p_order_id
    and (
      o.user_id = auth.uid()
      or public.is_admin()
    )
  order by h.created_at asc;
$$;

grant execute on function public.get_order_timeline(uuid)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Realtime publication for delivery_tracking
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'delivery_tracking'
  ) then
    alter publication supabase_realtime add table public.delivery_tracking;
  end if;
end;
$$;

alter table public.delivery_tracking replica identity full;

-- Also publish order_status_history for timeline updates
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'order_status_history'
  ) then
    alter publication supabase_realtime add table public.order_status_history;
  end if;
end;
$$;

alter table public.order_status_history replica identity full;
