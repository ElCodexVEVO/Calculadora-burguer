-- Burger Shot V14.1: gerente, edición de empleados y permiso independiente de descuentos.
-- Aplicar después de V6. No modifica ventas ni elimina cuentas.
begin;
alter table public.profiles add column if not exists can_manage_discounts boolean not null default false;

create or replace function public.v6_seed_roles(p_store uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.pos_roles(store_id,key,name,permissions) values
 (p_store,'admin','Administrador','{}'),
 (p_store,'manager','Gerente','{"manage_employees":true,"view_reports":true,"manage_discounts":true,"apply_promotions":true}'),
 (p_store,'supervisor','Supervisor','{"edit_orders":true,"view_reports":true,"manage_customers":true,"apply_promotions":true}'),
 (p_store,'cashier','Cajero','{"apply_promotions":true}') on conflict(store_id,key) do nothing;
end $$;
create or replace function public.v6_seed_store() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin perform public.v6_seed_roles(new.id);return new;end $$;

create or replace function public.v6_sync_profile_role() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.pos_roles;
begin
 if new.access_role_id is not null then
  select * into r from public.pos_roles where id=new.access_role_id and store_id=new.store_id and key<>'admin';
  if not found or new.role='admin' then raise exception 'Rol incompatible con esta cuenta';end if;
  new.can_edit_orders:=coalesce((r.permissions->>'edit_orders')::boolean,false);
  new.can_manage_catalog:=coalesce((r.permissions->>'manage_catalog')::boolean,false);
  new.can_manage_discounts:=coalesce((r.permissions->>'manage_discounts')::boolean,false);
  new.can_manage_employees:=coalesce((r.permissions->>'manage_employees')::boolean,false);
  new.can_view_reports:=coalesce((r.permissions->>'view_reports')::boolean,false);
  new.can_manage_payouts:=coalesce((r.permissions->>'manage_payouts')::boolean,false);
  new.can_view_audit:=coalesce((r.permissions->>'view_audit')::boolean,false);
  new.can_manage_customers:=coalesce((r.permissions->>'manage_customers')::boolean,false);
  new.can_manage_promotions:=coalesce((r.permissions->>'manage_promotions')::boolean,false);
  new.can_apply_promotions:=coalesce((r.permissions->>'apply_promotions')::boolean,false);
 end if;return new;
end $$;
create or replace function public.v6_save_role(p_role uuid,p_permissions jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.pos_roles;
begin
 select * into r from public.pos_roles where id=p_role for update;
 if not found or not public.is_admin(r.store_id) or r.key='admin' then raise exception 'No autorizado';end if;
 if jsonb_typeof(p_permissions)<>'object' or exists(select 1 from jsonb_each(p_permissions) where key not in ('edit_orders','manage_catalog','manage_discounts','manage_employees','view_reports','manage_payouts','view_audit','manage_customers','manage_promotions','apply_promotions') or jsonb_typeof(value)<>'boolean') then raise exception 'Permisos inválidos';end if;
 update public.pos_roles set permissions=p_permissions where id=p_role;
 update public.profiles set access_role_id=p_role where access_role_id=p_role and store_id=r.store_id;
end $$;
create or replace function public.has_permission(p_store uuid,p_permission text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.store_id=p_store and p.active and (p.role='admin' or case p_permission
 when 'edit_orders' then p.can_edit_orders when 'manage_catalog' then p.can_manage_catalog
 when 'manage_discounts' then p.can_manage_discounts or p.can_manage_catalog
 when 'manage_employees' then p.can_manage_employees when 'view_reports' then p.can_view_reports
 when 'manage_payouts' then p.can_manage_payouts when 'view_audit' then p.can_view_audit
 when 'manage_customers' then p.can_manage_customers when 'manage_promotions' then p.can_manage_promotions
 when 'apply_promotions' then p.can_apply_promotions else false end));
$$;

drop policy if exists discounts_insert on public.discounts;
create policy discounts_insert on public.discounts for insert to authenticated with check(public.has_permission(store_id,'manage_discounts'));
drop policy if exists discounts_update on public.discounts;
create policy discounts_update on public.discounts for update to authenticated using(public.has_permission(store_id,'manage_discounts')) with check(public.has_permission(store_id,'manage_discounts'));
drop policy if exists discounts_delete on public.discounts;
create policy discounts_delete on public.discounts for delete to authenticated using(public.has_permission(store_id,'manage_discounts'));

create or replace function public.v14_update_employee(p_user uuid,p_name text,p_username text,p_commission numeric,p_active boolean)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare actor public.profiles;target public.profiles;v_name text:=trim(p_name);v_username text:=lower(trim(p_username));
begin
 select * into actor from public.profiles where user_id=auth.uid() and active;
 if not found or not public.has_permission(actor.store_id,'manage_employees') then raise exception 'No autorizado para gestionar empleados';end if;
 select * into target from public.profiles where user_id=p_user and store_id=actor.store_id for update;
 if not found then raise exception 'Empleado no encontrado en esta sucursal';end if;
 if actor.role<>'admin' and (target.role='admin' or target.can_manage_employees or p_user=actor.user_id) then raise exception 'Esta cuenta requiere un administrador';end if;
 if p_user=actor.user_id and p_active is not true then raise exception 'No puedes desactivar tu propia cuenta';end if;
 if v_name is null or length(v_name)<1 or length(v_name)>100 or v_username is null or v_username !~ '^[a-z0-9._-]{3,28}$' or p_commission is null or p_commission<0 or p_commission>100 or p_active is null then raise exception 'Datos de empleado inválidos';end if;
 if exists(select 1 from public.profiles where lower(username)=v_username and user_id<>p_user) then raise exception 'Ese usuario ya existe';end if;
 update public.profiles set name=v_name,username=v_username,commission_percent=p_commission,active=p_active where user_id=p_user and store_id=actor.store_id;
end $$;
revoke all on function public.v14_update_employee(uuid,text,text,numeric,boolean) from public,anon;
grant execute on function public.v14_update_employee(uuid,text,text,numeric,boolean) to authenticated;
revoke all on function public.v6_seed_roles(uuid),public.v6_seed_store(),public.v6_sync_profile_role() from public,anon,authenticated;

-- Se completa el rol solicitado sin tocar asignaciones a personas ni los otros roles.
do $$declare s record;begin for s in select id from public.stores loop perform public.v6_seed_roles(s.id);end loop;end $$;
update public.pos_roles set permissions='{"manage_employees":true,"view_reports":true,"manage_discounts":true,"apply_promotions":true}'::jsonb
where key='manager' and not (permissions @> '{"manage_discounts":true}');
update public.profiles p set access_role_id=p.access_role_id from public.pos_roles r
where r.id=p.access_role_id and r.key='manager';
notify pgrst,'reload schema';
commit;
