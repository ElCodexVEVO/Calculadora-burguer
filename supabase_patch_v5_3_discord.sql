-- BurgerShot V5.3: cola idempotente para notificaciones de Discord.
-- La URL del webhook nunca se guarda en la base ni en el navegador:
-- se configura como secreto DISCORD_WEBHOOK_URL de la Edge Function.
begin;

create table if not exists public.discord_deliveries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  event_key text not null,
  event_type text not null,
  record_id text,
  status text not null default 'pending' check(status in ('pending','sent','failed')),
  response_code integer,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique(store_id,event_key)
);

create index if not exists discord_deliveries_store_date_idx
  on public.discord_deliveries(store_id,created_at desc);
alter table public.discord_deliveries enable row level security;
revoke all on public.discord_deliveries from public, anon, authenticated;
grant select on public.discord_deliveries to authenticated;
grant all on public.discord_deliveries to service_role;
drop policy if exists discord_deliveries_admin_read on public.discord_deliveries;
create policy discord_deliveries_admin_read on public.discord_deliveries
  for select to authenticated using(public.is_admin(store_id));

notify pgrst, 'reload schema';
commit;
