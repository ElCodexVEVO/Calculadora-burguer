-- BurgerShot V5.5: empleado de la semana, foto pública y métricas semanales.
-- Ejecutar después de supabase_patch_v5_4_quantities.sql (o del último parche aplicado).
-- No borra ventas, perfiles, cortes ni configuraciones existentes.
begin;

create table if not exists public.employee_of_week(
  store_id uuid primary key references public.stores(id) on delete cascade,
  employee_id uuid not null references auth.users(id) on delete cascade,
  photo_url text not null default '',
  week_start date not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists employee_of_week_employee_idx
  on public.employee_of_week(employee_id);

alter table public.employee_of_week enable row level security;
revoke all on public.employee_of_week from public, anon, authenticated;
grant select, insert, update, delete on public.employee_of_week to authenticated;

drop policy if exists employee_week_read on public.employee_of_week;
create policy employee_week_read on public.employee_of_week
  for select to authenticated
  using(public.is_member(store_id));

drop policy if exists employee_week_admin_insert on public.employee_of_week;
create policy employee_week_admin_insert on public.employee_of_week
  for insert to authenticated
  with check(
    public.is_admin(store_id)
    and exists(
      select 1 from public.profiles p
      where p.user_id=employee_id and p.store_id=employee_of_week.store_id and p.active=true
    )
  );

drop policy if exists employee_week_admin_update on public.employee_of_week;
create policy employee_week_admin_update on public.employee_of_week
  for update to authenticated
  using(public.is_admin(store_id))
  with check(
    public.is_admin(store_id)
    and exists(
      select 1 from public.profiles p
      where p.user_id=employee_id and p.store_id=employee_of_week.store_id and p.active=true
    )
  );

drop policy if exists employee_week_admin_delete on public.employee_of_week;
create policy employee_week_admin_delete on public.employee_of_week
  for delete to authenticated
  using(public.is_admin(store_id));

-- Bucket público solo para que el panel pueda mostrar la foto con una URL.
-- La escritura continúa protegida por las políticas de abajo.
insert into storage.buckets(id,name,public)
values('employee-week','employee-week',true)
on conflict(id) do update set public=true;

drop policy if exists employee_week_photos_read on storage.objects;
create policy employee_week_photos_read on storage.objects
  for select to public
  using(bucket_id='employee-week');

drop policy if exists employee_week_photos_insert on storage.objects;
create policy employee_week_photos_insert on storage.objects
  for insert to authenticated
  with check(
    bucket_id='employee-week'
    and exists(
      select 1 from public.profiles p
      where p.user_id=auth.uid() and p.active=true and p.role='admin'
        and p.store_id::text=(storage.foldername(storage.objects.name))[1]
    )
  );

drop policy if exists employee_week_photos_update on storage.objects;
create policy employee_week_photos_update on storage.objects
  for update to authenticated
  using(
    bucket_id='employee-week'
    and exists(
      select 1 from public.profiles p
      where p.user_id=auth.uid() and p.active=true and p.role='admin'
        and p.store_id::text=(storage.foldername(storage.objects.name))[1]
    )
  )
  with check(
    bucket_id='employee-week'
    and exists(
      select 1 from public.profiles p
      where p.user_id=auth.uid() and p.active=true and p.role='admin'
        and p.store_id::text=(storage.foldername(storage.objects.name))[1]
    )
  );

drop policy if exists employee_week_photos_delete on storage.objects;
create policy employee_week_photos_delete on storage.objects
  for delete to authenticated
  using(
    bucket_id='employee-week'
    and exists(
      select 1 from public.profiles p
      where p.user_id=auth.uid() and p.active=true and p.role='admin'
        and p.store_id::text=(storage.foldername(storage.objects.name))[1]
    )
  );

do $$
begin
  begin
    alter publication supabase_realtime add table public.employee_of_week;
  exception when duplicate_object then null;
  end;
end $$;

notify pgrst, 'reload schema';
commit;
