-- Mmart schema for Supabase (PostgreSQL)

create extension if not exists "pgcrypto";

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text not null unique,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10, 2) not null check (price >= 0),
  discount_price numeric(10, 2),
  stock integer not null default 0 check (stock >= 0),
  category text not null,
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint valid_discount check (discount_price is null or discount_price >= 0)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  delivery_charge numeric(10, 2) not null default 0,
  payment_status text not null default 'pending_verification' check (
    payment_status in ('pending_verification', 'paid', 'rejected')
  ),
  order_status text not null default 'pending' check (
    order_status in ('pending', 'paid', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')
  ),
  payment_screenshot_url text,
  delivery_address jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  price numeric(10, 2) not null check (price >= 0)
);

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_active on public.products(is_active);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_order_status on public.orders(order_status);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', null))
  on conflict (id)
  do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.place_order_with_items(
  p_user_id uuid,
  p_payment_screenshot_url text,
  p_delivery_address jsonb,
  p_items jsonb
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
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

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

  v_delivery := case when v_subtotal >= 500 then 0 else 30 end;

  insert into public.orders (
    user_id,
    total_amount,
    delivery_charge,
    payment_status,
    order_status,
    payment_screenshot_url,
    delivery_address
  )
  values (
    p_user_id,
    v_subtotal + v_delivery,
    v_delivery,
    'pending_verification',
    'pending',
    p_payment_screenshot_url,
    p_delivery_address
  )
  returning id into v_order_id;

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

grant execute on function public.place_order_with_items(uuid, text, jsonb, jsonb) to authenticated;

alter table public.admin_users enable row level security;
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- admin_users policies
drop policy if exists "Admin users readable by admins" on public.admin_users;
create policy "Admin users readable by admins"
on public.admin_users for select
using (public.is_admin());

drop policy if exists "Admin users writable by admins" on public.admin_users;
create policy "Admin users writable by admins"
on public.admin_users for all
using (public.is_admin())
with check (public.is_admin());

-- users policies
drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users for insert
with check (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- categories policies
drop policy if exists "Categories are public" on public.categories;
create policy "Categories are public"
on public.categories for select
using (is_active = true or public.is_admin());

drop policy if exists "Only admin can change categories" on public.categories;
create policy "Only admin can change categories"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

-- products policies
drop policy if exists "Products are public" on public.products;
create policy "Products are public"
on public.products for select
using (is_active = true or public.is_admin());

drop policy if exists "Only admin can change products" on public.products;
create policy "Only admin can change products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

-- orders policies
drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
on public.orders for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
on public.orders for insert
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

-- order items policies
drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "Users can insert own order items" on public.order_items;
create policy "Users can insert own order items"
on public.order_items for insert
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_admin())
  )
);

-- Storage buckets
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('payment-screenshots', 'payment-screenshots', true)
on conflict (id) do nothing;

-- Realtime for order status updates
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;

-- Seed your admin access (replace email before executing)
-- insert into public.admin_users (email) values ('admin@example.com') on conflict do nothing;
