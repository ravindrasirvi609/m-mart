-- ============================================================================
-- Migration: Geo-Aware Delivery Fee Calculation
-- Date: 2026-02-28
-- Description: Upgrades the order placement RPC to compute delivery charges
--              from the user's nearest service area rather than a hardcoded
--              ₹30/₹500 rule. Also adds location context to the orders table
--              so delivery zone is tracked per-order for analytics.
--
-- Changes:
--   1. Add delivery-zone columns to orders (area, distance, coordinates)
--   2. Replace place_order_with_items with geo-aware version
--   3. Add RPC to check delivery coverage for a coordinate
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add delivery-zone context columns to orders
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists delivery_area text,
  add column if not exists delivery_distance_km double precision,
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision,
  add column if not exists service_area_id uuid references public.service_areas(id);

-- ---------------------------------------------------------------------------
-- 2. Upgrade place_order_with_items — geo-aware delivery fee
-- ---------------------------------------------------------------------------
-- The new version accepts optional location parameters. When provided,
-- it looks up the nearest service area's delivery_fee and
-- min_order_free_delivery. Falls back to ₹30/₹500 when no geo context.

create or replace function public.place_order_with_items(
  p_user_id uuid,
  p_payment_screenshot_url text,
  p_delivery_address jsonb,
  p_items jsonb,
  p_lat double precision default null,
  p_lng double precision default null
)
returns table (order_id uuid, total_amount numeric, delivery_charge numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  line_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_unit_price numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_delivery numeric(10, 2);
  v_order_id uuid;
  -- Geo context
  v_service_area_id uuid;
  v_delivery_area text;
  v_delivery_fee numeric(10, 2) := 30;
  v_free_threshold numeric(10, 2) := 500;
  v_distance_km double precision;
begin
  -- -----------------------------------------------------------------------
  -- Validate cart
  -- -----------------------------------------------------------------------
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  -- -----------------------------------------------------------------------
  -- Resolve delivery zone from coordinates (if provided)
  -- -----------------------------------------------------------------------
  if p_lat is not null and p_lng is not null then
    select
      sa.id,
      sa.area_name,
      coalesce(sa.delivery_fee, 30),
      coalesce(sa.min_order_free_delivery, 500),
      round(
        (st_distance(
          st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
          st_setsrid(st_point(p_lng, p_lat), 4326)::geography
        ) / 1000.0)::numeric, 2
      )::double precision
    into
      v_service_area_id,
      v_delivery_area,
      v_delivery_fee,
      v_free_threshold,
      v_distance_km
    from public.service_areas sa
    where sa.is_active = true
      and sa.latitude is not null
      and sa.longitude is not null
      and st_dwithin(
        st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
        st_setsrid(st_point(p_lng, p_lat), 4326)::geography,
        50000  -- 50 km max
      )
    order by st_distance(
      st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
      st_setsrid(st_point(p_lng, p_lat), 4326)::geography
    )
    limit 1;
  end if;

  -- -----------------------------------------------------------------------
  -- Calculate subtotal
  -- -----------------------------------------------------------------------
  for line_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (line_item ->> 'quantity')::integer;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid product quantity';
    end if;

    select *
    into v_product
    from public.products
    where id = (line_item ->> 'productId')::uuid
      and is_active = true
    for update;

    if not found then
      raise exception 'Product not found';
    end if;

    if v_product.stock < v_quantity then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_unit_price := least(v_product.price, coalesce(v_product.discount_price, v_product.price));
    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
  end loop;

  -- -----------------------------------------------------------------------
  -- Compute delivery charge (geo-aware)
  -- -----------------------------------------------------------------------
  v_delivery := case when v_subtotal >= v_free_threshold then 0 else v_delivery_fee end;

  -- -----------------------------------------------------------------------
  -- Create order with geo context
  -- -----------------------------------------------------------------------
  insert into public.orders (
    user_id,
    total_amount,
    delivery_charge,
    payment_status,
    order_status,
    payment_screenshot_url,
    delivery_address,
    delivery_area,
    delivery_distance_km,
    delivery_lat,
    delivery_lng,
    service_area_id
  )
  values (
    p_user_id,
    v_subtotal + v_delivery,
    v_delivery,
    'pending_verification',
    'pending',
    p_payment_screenshot_url,
    p_delivery_address,
    v_delivery_area,
    v_distance_km,
    p_lat,
    p_lng,
    v_service_area_id
  )
  returning id into v_order_id;

  -- -----------------------------------------------------------------------
  -- Create order items + decrement stock
  -- -----------------------------------------------------------------------
  for line_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (line_item ->> 'quantity')::integer;

    select *
    into v_product
    from public.products
    where id = (line_item ->> 'productId')::uuid
    for update;

    v_unit_price := least(v_product.price, coalesce(v_product.discount_price, v_product.price));

    insert into public.order_items (order_id, product_id, quantity, price)
    values (v_order_id, v_product.id, v_quantity, v_unit_price);

    update public.products
    set stock = stock - v_quantity
    where id = v_product.id;
  end loop;

  return query
  select v_order_id, (v_subtotal + v_delivery), v_delivery;
end;
$$;

-- Re-grant with new signature (2 extra optional params)
grant execute on function public.place_order_with_items(uuid, text, jsonb, jsonb, double precision, double precision)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 3. RPC: Check delivery coverage for a coordinate
-- ---------------------------------------------------------------------------
-- Returns delivery fee/threshold for a point, or empty if out of coverage.
create or replace function public.check_delivery_coverage(
  p_lat double precision,
  p_lng double precision
)
returns table (
  covered boolean,
  service_area_id uuid,
  area_name text,
  delivery_fee numeric,
  min_order_free_delivery numeric,
  delivery_eta_minutes integer,
  distance_km double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    true as covered,
    sa.id as service_area_id,
    sa.area_name,
    coalesce(sa.delivery_fee, 30) as delivery_fee,
    coalesce(sa.min_order_free_delivery, 500) as min_order_free_delivery,
    sa.delivery_eta_minutes,
    round(
      (st_distance(
        st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
        st_setsrid(st_point(p_lng, p_lat), 4326)::geography
      ) / 1000.0)::numeric, 2
    )::double precision as distance_km
  from public.service_areas sa
  where sa.is_active = true
    and sa.latitude is not null
    and sa.longitude is not null
    and st_dwithin(
      st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
      st_setsrid(st_point(p_lng, p_lat), 4326)::geography,
      sa.radius_km * 1000  -- Use the service area's own radius
    )
  order by st_distance(
    st_setsrid(st_point(sa.longitude, sa.latitude), 4326)::geography,
    st_setsrid(st_point(p_lng, p_lat), 4326)::geography
  )
  limit 1;
$$;

grant execute on function public.check_delivery_coverage(double precision, double precision)
  to anon, authenticated;
