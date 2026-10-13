-- Adición independiente. No modifica ventas, permisos ni comisiones.
begin;
create table if not exists public.employee_appearance (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  photo_path text,
  photo_version bigint not null default 0,
  effects_mode text not null default 'balanced' check (effects_mode in ('cinematic','balanced','performance')),
  updated_at timestamptz not null default now(),
  constraint employee_photo_path check (photo_path is null or
    photo_path ~ ('^' || store_id::text || '/' || user_id::text || '/[0-9a-f-]{36}\.jpg$'))
);
create index if not exists employee_appearance_store_idx on public.employee_appearance(store_id);
alter table public.employee_appearance enable row level security;
revoke all on public.employee_appearance from public, anon, authenticated;
grant select on public.employee_appearance to authenticated;
grant all on public.employee_appearance to service_role;
drop policy if exists employee_appearance_read on public.employee_appearance;
create policy employee_appearance_read on public.employee_appearance for select to authenticated
using (public.is_member(store_id));

create or replace function public.set_my_effects(p_mode text)
returns public.employee_appearance language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.profiles; result public.employee_appearance;
begin
  select * into p from public.profiles where user_id=auth.uid() and active;
  if p.user_id is null then raise exception 'Sesión inválida'; end if;
  if p_mode not in ('cinematic','balanced','performance') or p_mode is null then raise exception 'Nivel de efectos inválido'; end if;
  insert into public.employee_appearance(user_id,store_id,effects_mode) values(p.user_id,p.store_id,p_mode)
  on conflict(user_id) do update set effects_mode=excluded.effects_mode,updated_at=now()
  returning * into result;
  return result;
end $$;
revoke all on function public.set_my_effects(text) from public,anon;
grant execute on function public.set_my_effects(text) to authenticated;

-- Solo el servidor invoca esta función; el identificador procede del JWT verificado.
-- Bloqueo + versión impiden que dos dispositivos se pisen o borren la foto vigente.
create or replace function public.commit_profile_photo(p_user uuid,p_expected bigint,p_path text)
returns public.employee_appearance language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.profiles; result public.employee_appearance;
begin
  select * into p from public.profiles where user_id=p_user and active for share;
  if p.user_id is null then raise exception 'Perfil inactivo'; end if;
  insert into public.employee_appearance(user_id,store_id) values(p.user_id,p.store_id) on conflict do nothing;
  select * into result from public.employee_appearance where user_id=p_user for update;
  if result.photo_version<>p_expected then raise exception 'PHOTO_CONFLICT'; end if;
  if result.store_id<>p.store_id then raise exception 'Tienda inválida'; end if;
  update public.employee_appearance set photo_path=p_path,photo_version=photo_version+1,updated_at=now()
    where user_id=p_user returning * into result;
  return result;
end $$;
revoke all on function public.commit_profile_photo(uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.commit_profile_photo(uuid,bigint,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('employee-avatars','employee-avatars',false,524288,array['image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=524288,allowed_mime_types=array['image/jpeg'];
drop policy if exists employee_avatar_read on storage.objects;
create policy employee_avatar_read on storage.objects for select to authenticated using (
  bucket_id='employee-avatars' and exists(select 1 from public.employee_appearance a
    where a.photo_path=name and public.is_member(a.store_id))
);
-- Sin políticas de escritura para clientes: solamente profile-photo escribe con service_role.
do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='employee_appearance') then
    alter publication supabase_realtime add table public.employee_appearance;
  end if;
end $$;
commit;
