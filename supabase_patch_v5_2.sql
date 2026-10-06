-- BurgerShot V5.2: permisos específicos para empleados.
-- Ejecutar después de supabase_patch_v5_1.sql. Es idempotente.
begin;

alter table public.profiles add column if not exists can_edit_orders boolean not null default false;
alter table public.profiles add column if not exists can_manage_catalog boolean not null default false;
alter table public.profiles add column if not exists can_manage_employees boolean not null default false;
alter table public.profiles add column if not exists can_view_reports boolean not null default false;
alter table public.profiles add column if not exists can_manage_payouts boolean not null default false;
alter table public.profiles add column if not exists can_view_audit boolean not null default false;

create or replace function public.has_permission(p_store uuid, p_permission text)
returns boolean language sql stable security definer set search_path=public, pg_temp as $$
  select exists(
    select 1 from public.profiles p
    where p.user_id=auth.uid() and p.store_id=p_store and p.active=true
      and (p.role='admin' or case p_permission
        when 'edit_orders' then p.can_edit_orders
        when 'manage_catalog' then p.can_manage_catalog
        when 'manage_employees' then p.can_manage_employees
        when 'view_reports' then p.can_view_reports
        when 'manage_payouts' then p.can_manage_payouts
        when 'view_audit' then p.can_view_audit
        else false end)
  );
$$;
revoke all on function public.has_permission(uuid,text) from public, anon;
grant execute on function public.has_permission(uuid,text) to authenticated;

drop policy if exists products_insert on public.products;
create policy products_insert on public.products for insert to authenticated with check(public.has_permission(store_id,'manage_catalog'));
drop policy if exists products_update on public.products;
create policy products_update on public.products for update to authenticated using(public.has_permission(store_id,'manage_catalog')) with check(public.has_permission(store_id,'manage_catalog'));
drop policy if exists products_delete on public.products;
create policy products_delete on public.products for delete to authenticated using(public.has_permission(store_id,'manage_catalog'));

drop policy if exists discounts_insert on public.discounts;
create policy discounts_insert on public.discounts for insert to authenticated with check(public.has_permission(store_id,'manage_catalog'));
drop policy if exists discounts_update on public.discounts;
create policy discounts_update on public.discounts for update to authenticated using(public.has_permission(store_id,'manage_catalog')) with check(public.has_permission(store_id,'manage_catalog'));
drop policy if exists discounts_delete on public.discounts;
create policy discounts_delete on public.discounts for delete to authenticated using(public.has_permission(store_id,'manage_catalog'));

drop policy if exists sales_update on public.sales;
create policy sales_update on public.sales for update to authenticated using(public.has_permission(store_id,'edit_orders')) with check(public.has_permission(store_id,'edit_orders'));

-- Aunque la interfaz solo ofrece campos seguros, la base también impide que un
-- empleado con permiso de edición cambie propietario, tienda, folio, estado o corte.
create or replace function public.guard_burgershot_sale_edit()
returns trigger language plpgsql security definer set search_path=public, pg_temp as $$
begin
  if tg_op='UPDATE' and auth.uid() is not null and not exists(
    select 1 from public.profiles p where p.user_id=auth.uid() and p.store_id=old.store_id and p.active=true and p.role='admin'
  ) and (
    new.store_id is distinct from old.store_id or new.created_by is distinct from old.created_by or
    new.sale_number is distinct from old.sale_number or new.employee_name is distinct from old.employee_name or
    new.status is distinct from old.status or new.payout_id is distinct from old.payout_id or
    new.voided_at is distinct from old.voided_at or new.voided_by is distinct from old.voided_by
  ) then raise exception 'No tienes permiso para cambiar la propiedad o el estado de la orden'; end if;
  return new;
end;
$$;
revoke all on function public.guard_burgershot_sale_edit() from public, anon, authenticated;
drop trigger if exists trg_guard_burgershot_sale_edit on public.sales;
create trigger trg_guard_burgershot_sale_edit before update on public.sales
for each row execute function public.guard_burgershot_sale_edit();

drop policy if exists payouts_insert on public.employee_payouts;
create policy payouts_insert on public.employee_payouts for insert to authenticated with check(public.has_permission(store_id,'manage_payouts'));

drop policy if exists audit_admin_read on public.audit_events;
create policy audit_admin_read on public.audit_events for select to authenticated using(public.has_permission(store_id,'view_audit'));

notify pgrst, 'reload schema';
commit;
