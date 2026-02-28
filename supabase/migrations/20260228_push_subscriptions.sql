-- ============================================================================
-- Migration: Push Subscription Storage
-- Date: 2026-02-28
-- Description: Stores Web Push (VAPID) subscriptions so the server can send
--              background push notifications to browsers and PWAs.
-- ============================================================================

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  endpoint text not null,
  keys_p256dh text not null,
  keys_auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_unique unique (endpoint)
);

create index if not exists idx_push_subscriptions_user_id
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Users can manage their own subscriptions
create policy "Users can read own push subscriptions"
  on public.push_subscriptions for select
  using (user_id = auth.uid() or public.is_admin());

create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid());

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (user_id = auth.uid());

-- Admins read all (for sending push to users)
create policy "Admins can read all push subscriptions"
  on public.push_subscriptions for select
  using (public.is_admin());
