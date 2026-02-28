-- ============================================================================
-- Migration: User Presence Tracking
-- Date: 2026-02-28
-- Description: Server-side presence tracking with heartbeat TTL.
--              Users send periodic heartbeats; the server marks them
--              offline when TTL expires. This prevents false offline
--              states from brief network fluctuations.
-- ============================================================================

create table if not exists public.user_presence (
  user_id uuid primary key references public.users(id) on delete cascade,
  is_online boolean not null default false,
  last_seen_at timestamptz not null default now(),
  -- Metadata
  user_agent text,
  page_path text
);

create index if not exists idx_user_presence_online
  on public.user_presence (is_online) where is_online = true;

alter table public.user_presence enable row level security;

-- Anyone authenticated can read presence
create policy "Authenticated users can read presence"
  on public.user_presence for select
  using (auth.role() = 'authenticated');

-- Users can update their own presence
create policy "Users can upsert own presence"
  on public.user_presence for insert
  with check (user_id = auth.uid());

create policy "Users can update own presence"
  on public.user_presence for update
  using (user_id = auth.uid());

-- Admins can read all
create policy "Admins can read all presence"
  on public.user_presence for select
  using (public.is_admin());

-- RPC: Heartbeat — updates last_seen and marks online
create or replace function public.presence_heartbeat(
  p_page_path text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_presence (user_id, is_online, last_seen_at, page_path)
  values (auth.uid(), true, now(), p_page_path)
  on conflict (user_id) do update set
    is_online = true,
    last_seen_at = now(),
    page_path = coalesce(p_page_path, user_presence.page_path);
end;
$$;

grant execute on function public.presence_heartbeat(text) to authenticated;

-- RPC: Mark offline
create or replace function public.presence_offline()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_presence
  set is_online = false, last_seen_at = now()
  where user_id = auth.uid();
end;
$$;

grant execute on function public.presence_offline() to authenticated;

-- RPC: Expire stale presence — call periodically (e.g., via cron)
-- Marks users offline if they haven't sent a heartbeat in 2 minutes.
create or replace function public.presence_expire_stale(
  p_ttl_seconds integer default 120
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.user_presence
  set is_online = false
  where is_online = true
    and last_seen_at < now() - (p_ttl_seconds || ' seconds')::interval;
  
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.presence_expire_stale(integer) to authenticated;

-- Add presence to realtime publication
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'user_presence'
  ) then
    alter publication supabase_realtime add table public.user_presence;
  end if;
end;
$$;

alter table public.user_presence replica identity full;
