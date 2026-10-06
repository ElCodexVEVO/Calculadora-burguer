-- BurgerShot V5.1: historial y detalle de cortes. Ejecutar completo UNA VEZ.
-- Actualización acumulativa sobre V3 + V4.2. No borra ventas, perfiles ni cortes.
begin;

-- Permisos finos: admin siempre conserva acceso total; los demás se asignan por perfil.
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

alter table public.employee_payouts add column if not exists sales_snapshot jsonb;
create index if not exists sales_store_date_idx on public.sales(store_id, created_at desc, id desc);
create index if not exists sales_payout_idx on public.sales(payout_id);
create index if not exists payouts_store_date_idx on public.employee_payouts(store_id, created_at desc, id desc);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  created_at timestamptz not null default now(),
  actor_id uuid,
  actor_name text not null,
  entity text not null,
  entity_id text not null,
  entity_name text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb
);
-- No FK a auth.users: el historial permanece al borrar un perfil sin ventas.
create index if not exists audit_store_date_idx on public.audit_events(store_id, created_at desc, id desc);
create index if not exists audit_actor_date_idx on public.audit_events(store_id, actor_id, created_at desc);
alter table public.audit_events enable row level security;
revoke all on public.audit_events from public, anon, authenticated;
grant select on public.audit_events to authenticated;
drop policy if exists audit_admin_read on public.audit_events;
create policy audit_admin_read on public.audit_events for select to authenticated
  using(public.has_permission(store_id,'view_audit'));

create or replace function public.capture_burgershot_audit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_before jsonb; v_after jsonb; v_row jsonb;
  v_fields text[]; v_actor uuid := auth.uid(); v_actor_name text;
  v_store uuid; v_action text; v_label text; v_id text;
begin
  -- Lista explícita: nunca copiar correos, contraseñas ni tokens al historial.
  case tg_table_name
    when 'profiles' then v_fields := array['name','username','role','active','commission_percent','can_edit_orders','can_manage_catalog','can_manage_employees','can_view_reports','can_manage_payouts','can_view_audit'];
    when 'products' then v_fields := array['name','category','price','active','emoji','tag','restriction'];
    when 'discounts' then v_fields := array['name','percent','scope','description','exclude_public','active'];
    when 'sales' then v_fields := array['sale_number','employee_name','total','commission_percent','employee_earnings','business_net','status','payout_id'];
    when 'employee_payouts' then v_fields := array['employee_name','generated_total','amount','business_net','sales_count'];
    else raise exception 'Tabla no admitida por el historial';
  end case;
  if tg_op <> 'INSERT' then
    select jsonb_object_agg(key,value) into v_before from jsonb_each(to_jsonb(old)) where key=any(v_fields);
  end if;
  if tg_op <> 'DELETE' then
    select jsonb_object_agg(key,value) into v_after from jsonb_each(to_jsonb(new)) where key=any(v_fields);
  end if;
  if tg_op = 'UPDATE' and v_before is not distinct from v_after then return new; end if;
  if tg_op = 'DELETE' then v_row := to_jsonb(old); else v_row := to_jsonb(new); end if;
  v_store := (v_row->>'store_id')::uuid;
  -- Una eliminación completa de tienda ya elimina su historial por cascada.
  if not exists(select 1 from public.stores where id=v_store) then return null; end if;
  select name into v_actor_name from public.profiles where user_id=v_actor and store_id=v_store;
  v_actor_name := coalesce(v_actor_name, case when v_actor is null then 'Servicio / SQL de administración' else 'Cuenta sin perfil' end);
  v_id := coalesce(v_row->>'id',v_row->>'user_id');
  v_label := coalesce(v_row->>'name',v_row->>'employee_name','Registro');
  v_action := lower(tg_op);
  if tg_table_name='sales' then
    v_label := 'BS-' || lpad(v_row->>'sale_number', greatest(5,length(v_row->>'sale_number')), '0');
    if tg_op='UPDATE' and v_before->>'status' is distinct from v_after->>'status' and v_after->>'status'='void' then v_action:='void'; end if;
    if tg_op='UPDATE' and v_before->>'payout_id' is distinct from v_after->>'payout_id' then v_action:='paid'; end if;
  elsif tg_table_name='profiles' and tg_op='UPDATE' and v_before->>'active' is distinct from v_after->>'active' then
    v_action := case when (v_after->>'active')::boolean then 'reactivate' else 'deactivate' end;
  end if;
  insert into public.audit_events(store_id,actor_id,actor_name,entity,entity_id,entity_name,action,before_data,after_data)
  values(v_store,v_actor,v_actor_name,tg_table_name,v_id,v_label,v_action,v_before,v_after);
  return null; -- AFTER trigger: no altera la fila original.
end;
$$;
revoke all on function public.capture_burgershot_audit() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['profiles','products','discounts','sales','employee_payouts'] loop
    execute format('drop trigger if exists trg_burgershot_audit on public.%I',t);
    execute format('create trigger trg_burgershot_audit after insert or update or delete on public.%I for each row execute function public.capture_burgershot_audit()',t);
  end loop;
end $$;

-- Serializa cortes del mismo empleado y captura exactamente las ventas bloqueadas.
-- Una venta que llega después queda pendiente para el siguiente corte.
create or replace function public.create_employee_payout(p_employee uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_admin uuid:=auth.uid(); v_store uuid; v_admin_name text; v_employee_name text;
  v_ids uuid[]; v_snapshot jsonb; v_generated numeric(12,2); v_amount numeric(12,2);
  v_net numeric(12,2); v_count int; v_payout uuid;
begin
  select store_id,name into v_store,v_admin_name from public.profiles
    where user_id=v_admin and active=true and (role='admin' or can_manage_payouts=true);
  if v_store is null then raise exception 'No autorizado'; end if;
  select name into v_employee_name from public.profiles
    where user_id=p_employee and store_id=v_store for update;
  if v_employee_name is null then raise exception 'Empleado no encontrado'; end if;
  select array_agg(s.id), jsonb_agg(to_jsonb(s) order by s.created_at,s.id),
         coalesce(sum(s.total),0),coalesce(sum(s.employee_earnings),0),coalesce(sum(s.business_net),0),count(*)
    into v_ids,v_snapshot,v_generated,v_amount,v_net,v_count
    from (select * from public.sales where store_id=v_store and created_by=p_employee
      and status='active' and payout_id is null and employee_earnings>0 order by id for update) s;
  if v_count=0 or v_amount<=0 then raise exception 'No hay ganancias pendientes por pagar'; end if;
  insert into public.employee_payouts(store_id,employee_id,employee_name,generated_total,amount,business_net,sales_count,created_by,created_by_name,sales_snapshot)
    values(v_store,p_employee,v_employee_name,v_generated,v_amount,v_net,v_count,v_admin,v_admin_name,v_snapshot)
    returning id into v_payout;
  update public.sales set payout_id=v_payout where id=any(v_ids) and store_id=v_store;
  return v_payout;
end;
$$;
revoke all on function public.create_employee_payout(uuid) from public, anon;
grant execute on function public.create_employee_payout(uuid) to authenticated;

-- Recalcula la comisión si una orden abierta cambia de importe. Los cortes ya pagados no se pueden alterar.
create or replace function public.apply_sale_commission()
returns trigger language plpgsql security definer set search_path=public, pg_temp as $$
declare v_pct numeric(5,2);
begin
  if tg_op='UPDATE' and old.payout_id is not null and (
    new.client is distinct from old.client or new.client_type is distinct from old.client_type or
    new.payment is distinct from old.payment or new.note is distinct from old.note or
    new.items is distinct from old.items or new.subtotal is distinct from old.subtotal or
    new.discount_id is distinct from old.discount_id or new.discount_name is distinct from old.discount_name or
    new.discount_percent is distinct from old.discount_percent or new.discount_amount is distinct from old.discount_amount or
    new.total is distinct from old.total or new.commission_percent is distinct from old.commission_percent or
    new.employee_earnings is distinct from old.employee_earnings or new.business_net is distinct from old.business_net or
    new.created_by is distinct from old.created_by or new.store_id is distinct from old.store_id or new.payout_id is distinct from old.payout_id
  ) then raise exception 'No puedes editar una orden que ya fue incluida en un corte'; end if;
  if tg_op='INSERT' or (tg_op='UPDATE' and (new.total is distinct from old.total or new.created_by is distinct from old.created_by or new.store_id is distinct from old.store_id)) then
    select coalesce(commission_percent,0) into v_pct from public.profiles
      where user_id=new.created_by and store_id=new.store_id and active=true;
    if v_pct is null then raise exception 'Empleado inválido'; end if;
    new.commission_percent:=v_pct;
    new.employee_earnings:=round((new.total * v_pct / 100.0)::numeric,2);
    new.business_net:=round((new.total - new.employee_earnings)::numeric,2);
  end if;
  return new;
end;
$$;
revoke all on function public.apply_sale_commission() from public, anon, authenticated;
drop trigger if exists trg_apply_sale_commission on public.sales;
create trigger trg_apply_sale_commission
before insert or update of total,created_by,store_id,client,client_type,payment,note,items,subtotal,discount_id,discount_name,discount_percent,discount_amount,commission_percent,employee_earnings,business_net,payout_id,status,voided_at,voided_by on public.sales
for each row execute function public.apply_sale_commission();

-- Solo inserciones: el historial no tiene edición ni borrado desde la app.
do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and
     not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='audit_events') then
    alter publication supabase_realtime add table public.audit_events;
  end if;
end $$;
notify pgrst, 'reload schema';
commit;
