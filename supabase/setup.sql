-- Run this entire file once in Supabase > SQL Editor > New query > Run.
-- Safe to run again. Existing records are preserved.
begin;

create table if not exists public.gift_profiles (
  id text primary key,
  data jsonb not null,
  check (data->>'id' = id)
);
create table if not exists public.gift_names (
  name text primary key,
  profile_id text not null references public.gift_profiles(id) on delete cascade
);
create table if not exists public.gift_settings (
  id boolean primary key default true check (id),
  data jsonb not null
);
create table if not exists public.gift_replies (
  id text primary key,
  profile_id text not null references public.gift_profiles(id),
  data jsonb not null
);
create table if not exists public.gift_limits (
  key text primary key,
  starts_at timestamptz not null default now(),
  hits integer not null default 1
);
create table if not exists public.gift_opens (
  session_id text primary key,
  profile_id text not null references public.gift_profiles(id)
);

alter table public.gift_profiles enable row level security;
alter table public.gift_names enable row level security;
alter table public.gift_settings enable row level security;
alter table public.gift_replies enable row level security;
alter table public.gift_limits enable row level security;
alter table public.gift_opens enable row level security;
revoke all on public.gift_profiles, public.gift_names, public.gift_settings,
  public.gift_replies, public.gift_limits, public.gift_opens from anon, authenticated;
grant all on public.gift_profiles, public.gift_names, public.gift_settings,
  public.gift_replies, public.gift_limits, public.gift_opens to service_role;

create or replace function public.gift_save_profile(p_data jsonb, p_names text[], p_import boolean default false)
returns boolean language plpgsql set search_path = public as $$
declare existing jsonb;
begin
  -- Serialize profile/name changes so concurrent saves cannot create duplicate names.
  perform pg_advisory_xact_lock(20102026);
  select data into existing from gift_profiles where id = p_data->>'id' for update;
  if p_import and existing is not null then return false; end if;
  if existing is not null then
    p_data := p_data || jsonb_build_object(
      'openedCount', existing->'openedCount', 'lastOpenedAt', existing->'lastOpenedAt',
      'createdAt', existing->'createdAt');
  end if;
  insert into gift_profiles(id, data) values(p_data->>'id', p_data)
    on conflict(id) do update set data = excluded.data;
  delete from gift_names where profile_id = p_data->>'id';
  if p_data->>'status' = 'active' then
    insert into gift_names(name, profile_id)
      select unnest(p_names), p_data->>'id';
  end if;
  return true;
end $$;

create or replace function public.gift_rate_limit(p_key text, p_max integer, p_seconds integer)
returns boolean language plpgsql set search_path = public as $$
declare count_now integer;
begin
  insert into gift_limits(key) values(p_key)
  on conflict(key) do update set
    hits = case when gift_limits.starts_at < now() - make_interval(secs => p_seconds) then 1 else gift_limits.hits + 1 end,
    starts_at = case when gift_limits.starts_at < now() - make_interval(secs => p_seconds) then now() else gift_limits.starts_at end
  returning hits into count_now;
  delete from gift_limits where starts_at < now() - interval '1 day';
  return count_now <= p_max;
end $$;

create or replace function public.gift_record_open(p_id text, p_session text)
returns void language plpgsql set search_path = public as $$
begin
  insert into gift_opens(session_id, profile_id) values(p_session, p_id) on conflict do nothing;
  if found then
    update gift_profiles set data = data || jsonb_build_object(
      'openedCount', coalesce((data->>'openedCount')::integer, 0) + 1,
      'lastOpenedAt', to_jsonb(now())) where id = p_id;
  end if;
end $$;

revoke all on function public.gift_save_profile(jsonb, text[], boolean),
  public.gift_rate_limit(text, integer, integer), public.gift_record_open(text, text)
  from public, anon, authenticated;
grant execute on function public.gift_save_profile(jsonb, text[], boolean),
  public.gift_rate_limit(text, integer, integer), public.gift_record_open(text, text)
  to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('gift-portraits', 'gift-portraits', false, 2097152, array['image/jpeg'])
on conflict(id) do nothing;

commit;
