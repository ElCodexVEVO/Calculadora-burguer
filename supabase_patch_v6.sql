-- Burger Shot V6. Apply AFTER all V5 patches. Repeatable; preserves sales and accounts.
begin;
create table if not exists public.pos_roles(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id) on delete cascade,
 key text not null check(key in ('admin','manager','supervisor','cashier')),name text not null,
 permissions jsonb not null default '{}'::jsonb check(jsonb_typeof(permissions)='object'),unique(store_id,key)
);
alter table public.profiles add column if not exists access_role_id uuid references public.pos_roles(id);
alter table public.profiles add column if not exists can_manage_customers boolean not null default false;
alter table public.profiles add column if not exists can_manage_promotions boolean not null default false;
alter table public.profiles add column if not exists can_apply_promotions boolean not null default true;
alter table public.profiles add column if not exists last_access_at timestamptz;
create table if not exists public.customers(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 100),identifier text not null check(length(trim(identifier)) between 1 and 120),
 phone text not null default '' check(length(phone)<=40),level text not null default 'Nuevo' check(level in ('Nuevo','Frecuente','VIP','Convenio')),
 notes text not null default '' check(length(notes)<=1500),benefit text not null default '' check(length(benefit)<=200),created_at timestamptz not null default now()
);
create unique index if not exists customers_identifier_unique on public.customers(store_id,lower(trim(identifier)));
create table if not exists public.promotions(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 100),code text check(code ~ '^[A-Z0-9_-]{1,32}$'),
 kind text not null check(kind in ('percent','fixed','two_for_one','combo')),value numeric(12,2) not null default 0 check(value>=0),
 product_id uuid references public.products(id) on delete cascade,description text not null default '' check(length(description)<=500),
 active boolean not null default true,starts_at timestamptz,ends_at timestamptz,created_at timestamptz not null default now(),
 check(ends_at is null or starts_at is null or ends_at>starts_at),check(kind<>'percent' or value>0 and value<=100),check(kind<>'combo' or product_id is not null)
);
create unique index if not exists promotions_code_unique on public.promotions(store_id,code) where code is not null;
-- No FK to promotions: deletion must never change historical sale snapshots.
alter table public.sales add column if not exists promotion_id uuid;
alter table public.sales add column if not exists promotion_code text;

create or replace function public.v6_seed_roles(p_store uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is not null and not public.is_admin(p_store) then raise exception 'No autorizado';end if;
 insert into public.pos_roles(store_id,key,name,permissions) values
 (p_store,'admin','Administrador','{}'),
 (p_store,'manager','Gerente','{"edit_orders":true,"manage_catalog":true,"manage_employees":true,"view_reports":true,"manage_payouts":true,"view_audit":true,"manage_customers":true,"manage_promotions":true,"apply_promotions":true}'),
 (p_store,'supervisor','Supervisor','{"edit_orders":true,"view_reports":true,"manage_customers":true,"apply_promotions":true}'),
 (p_store,'cashier','Cajero','{"apply_promotions":true}') on conflict(store_id,key) do nothing;
end $$;
revoke all on function public.v6_seed_roles(uuid) from public,anon,authenticated;
do $$declare s record;begin for s in select id from public.stores loop perform public.v6_seed_roles(s.id);end loop;end $$;
create or replace function public.v6_seed_store() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 -- Bootstrap inserts store before profile, so seed explicitly without membership check.
 insert into public.pos_roles(store_id,key,name,permissions) values
 (new.id,'admin','Administrador','{}'),
 (new.id,'manager','Gerente','{"edit_orders":true,"manage_catalog":true,"manage_employees":true,"view_reports":true,"manage_payouts":true,"view_audit":true,"manage_customers":true,"manage_promotions":true,"apply_promotions":true}'),
 (new.id,'supervisor','Supervisor','{"edit_orders":true,"view_reports":true,"manage_customers":true,"apply_promotions":true}'),
 (new.id,'cashier','Cajero','{"apply_promotions":true}') on conflict do nothing;return new;
end $$;
drop trigger if exists trg_v6_seed_store on public.stores;
create trigger trg_v6_seed_store after insert on public.stores for each row execute function public.v6_seed_store();

create or replace function public.v6_sync_profile_role() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.pos_roles;
begin
 if new.access_role_id is not null then
  select * into r from public.pos_roles where id=new.access_role_id and store_id=new.store_id and key<>'admin';
  if not found or new.role='admin' then raise exception 'Rol incompatible con esta cuenta';end if;
  new.can_edit_orders:=coalesce((r.permissions->>'edit_orders')::boolean,false);
  new.can_manage_catalog:=coalesce((r.permissions->>'manage_catalog')::boolean,false);
  new.can_manage_employees:=coalesce((r.permissions->>'manage_employees')::boolean,false);
  new.can_view_reports:=coalesce((r.permissions->>'view_reports')::boolean,false);
  new.can_manage_payouts:=coalesce((r.permissions->>'manage_payouts')::boolean,false);
  new.can_view_audit:=coalesce((r.permissions->>'view_audit')::boolean,false);
  new.can_manage_customers:=coalesce((r.permissions->>'manage_customers')::boolean,false);
  new.can_manage_promotions:=coalesce((r.permissions->>'manage_promotions')::boolean,false);
  new.can_apply_promotions:=coalesce((r.permissions->>'apply_promotions')::boolean,false);
 end if;return new;
end $$;
drop trigger if exists trg_v6_sync_profile_role on public.profiles;
create trigger trg_v6_sync_profile_role before insert or update on public.profiles for each row execute function public.v6_sync_profile_role();
create or replace function public.v6_save_role(p_role uuid,p_permissions jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.pos_roles;
begin
 select * into r from public.pos_roles where id=p_role for update;
 if not found or not public.is_admin(r.store_id) or r.key='admin' then raise exception 'No autorizado';end if;
 if jsonb_typeof(p_permissions)<>'object' or exists(select 1 from jsonb_each(p_permissions) where key not in ('edit_orders','manage_catalog','manage_employees','view_reports','manage_payouts','view_audit','manage_customers','manage_promotions','apply_promotions') or jsonb_typeof(value)<>'boolean') then raise exception 'Permisos inválidos';end if;
 update public.pos_roles set permissions=p_permissions where id=p_role;
 update public.profiles set access_role_id=p_role where access_role_id=p_role and store_id=r.store_id;
end $$;
create or replace function public.v6_assign_role(p_user uuid,p_role uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.pos_roles;
begin
 select * into r from public.pos_roles where id=p_role for update;
 if not found or not public.is_admin(r.store_id) or r.key='admin' then raise exception 'No autorizado';end if;
 update public.profiles set access_role_id=p_role where user_id=p_user and store_id=r.store_id and role<>'admin';
 if not found then raise exception 'Cuenta no válida para asignación';end if;
end $$;
revoke all on function public.v6_save_role(uuid,jsonb),public.v6_assign_role(uuid,uuid) from public,anon;
grant execute on function public.v6_save_role(uuid,jsonb),public.v6_assign_role(uuid,uuid) to authenticated;
create or replace function public.has_permission(p_store uuid,p_permission text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.store_id=p_store and p.active and (p.role='admin' or case p_permission
 when 'edit_orders' then p.can_edit_orders when 'manage_catalog' then p.can_manage_catalog when 'manage_employees' then p.can_manage_employees
 when 'view_reports' then p.can_view_reports when 'manage_payouts' then p.can_manage_payouts when 'view_audit' then p.can_view_audit
 when 'manage_customers' then p.can_manage_customers when 'manage_promotions' then p.can_manage_promotions when 'apply_promotions' then p.can_apply_promotions else false end));
$$;
alter table public.pos_roles enable row level security;
alter table public.customers enable row level security;
alter table public.promotions enable row level security;
revoke all on public.pos_roles,public.customers,public.promotions from public,anon,authenticated;
grant select on public.pos_roles to authenticated;
grant select,insert,update,delete on public.customers,public.promotions to authenticated;
drop policy if exists v6_roles_read on public.pos_roles;
create policy v6_roles_read on public.pos_roles for select to authenticated using(public.is_member(store_id));
drop policy if exists v6_customers_access on public.customers;
create policy v6_customers_access on public.customers for all to authenticated using(public.has_permission(store_id,'manage_customers')) with check(public.has_permission(store_id,'manage_customers'));
drop policy if exists v6_promotions_read on public.promotions;
create policy v6_promotions_read on public.promotions for select to authenticated using(public.is_member(store_id));
drop policy if exists v6_promotions_insert on public.promotions;
create policy v6_promotions_insert on public.promotions for insert to authenticated with check(public.has_permission(store_id,'manage_promotions'));
drop policy if exists v6_promotions_update on public.promotions;
create policy v6_promotions_update on public.promotions for update to authenticated using(public.has_permission(store_id,'manage_promotions')) with check(public.has_permission(store_id,'manage_promotions'));
drop policy if exists v6_promotions_delete on public.promotions;
create policy v6_promotions_delete on public.promotions for delete to authenticated using(public.has_permission(store_id,'manage_promotions'));

create or replace function public.v6_guard_promotion() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.product_id is not null and not exists(select 1 from public.products where id=new.product_id and store_id=new.store_id and (new.kind<>'combo' or category='combos')) then raise exception 'Producto inválido para esta promoción';end if;
 if tg_op='UPDATE' and new.store_id<>old.store_id then raise exception 'No se puede mover la promoción';end if;
 return new;
end $$;
drop trigger if exists trg_v6_guard_promotion on public.promotions;
create trigger trg_v6_guard_promotion before insert or update on public.promotions for each row execute function public.v6_guard_promotion();

-- Server-side validation independent of browser price, coupon, eligibility and clock.
create or replace function public.v6_validate_sale_promotion() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.promotions; pr public.products; i jsonb; q integer; subtotal numeric:=0; base numeric:=0; reduction numeric:=0; canon jsonb:='[]';
begin
 if tg_op='UPDATE' then
  if old.promotion_id is not null or new.promotion_id is not null then
   if new.promotion_id is distinct from old.promotion_id or new.promotion_code is distinct from old.promotion_code or
   new.items is distinct from old.items or new.subtotal is distinct from old.subtotal or new.total is distinct from old.total or
   new.discount_amount is distinct from old.discount_amount or new.discount_percent is distinct from old.discount_percent or new.discount_name is distinct from old.discount_name or
   new.discount_id is distinct from old.discount_id or new.client_type is distinct from old.client_type or new.store_id is distinct from old.store_id then
    raise exception 'Una venta promocional conserva sus importes. Anula y registra una nueva orden para corregirlos';
   end if;
  end if;return new;
 end if;
 if new.promotion_id is null then return new;end if;
 if not public.has_permission(new.store_id,'apply_promotions') then raise exception 'No tienes permiso para aplicar promociones';end if;
 select * into p from public.promotions where id=new.promotion_id and store_id=new.store_id for share;
 if not found or not p.active or p.starts_at>now() or p.ends_at<=now() then raise exception 'Promoción inválida, pausada o fuera de vigencia';end if;
 if p.code is not null and p.code is distinct from upper(trim(new.promotion_code)) then raise exception 'Código de cupón inválido';end if;
 if jsonb_typeof(new.items)<>'array' or jsonb_array_length(new.items)=0 or jsonb_array_length(new.items)>500 then raise exception 'Pedido inválido';end if;
 if exists(select 1 from jsonb_array_elements(new.items) x group by x->>'id' having count(*)>1) then raise exception 'No dupliques líneas del mismo producto';end if;
 for i in select * from jsonb_array_elements(new.items) loop
  if (i->>'qty')::numeric<>trunc((i->>'qty')::numeric) then raise exception 'Cantidad inválida';end if;
  q:=(i->>'qty')::integer;if q is null or q<1 or q>9999 then raise exception 'Cantidad inválida';end if;
  select * into pr from public.products where id=(i->>'id')::uuid and store_id=new.store_id and active for share;
  if not found or pr.restriction is not null and pr.restriction<>new.client_type then raise exception 'Producto no disponible para este cliente';end if;
  subtotal:=subtotal+pr.price*q;canon:=canon||jsonb_build_array(jsonb_build_object('id',pr.id,'name',pr.name,'price',pr.price,'qty',q,'lineTotal',pr.price*q));
  if pr.tag<>'none' and (p.product_id is null or p.product_id=pr.id) then
   base:=base+pr.price*q;
   if p.kind='two_for_one' then reduction:=reduction+floor(q/2.0)*pr.price;end if;
   if p.kind='combo' then reduction:=reduction+greatest(0,pr.price-p.value)*q;end if;
  end if;
 end loop;
 if p.kind='percent' then reduction:=round(base*p.value/100);end if;
 if p.kind='fixed' then reduction:=p.value;end if;
 reduction:=round(greatest(0,least(base,reduction)),2);
 -- Reject stale previews instead of silently charging a changed amount.
 if new.total is distinct from subtotal-reduction or new.subtotal is distinct from subtotal or new.discount_amount is distinct from reduction then raise exception 'El importe cambió. Sincroniza y revisa el pedido antes de cobrar';end if;
 new.items:=canon;new.discount_id:=null;new.discount_name:=p.name;new.discount_percent:=case when p.kind='percent' then p.value else 0 end;new.promotion_code:=p.code;
 return new;
end $$;
drop trigger if exists trg_00_v6_sale_promotion on public.sales;
create trigger trg_00_v6_sale_promotion before insert or update on public.sales for each row execute function public.v6_validate_sale_promotion();

-- Auth updates this timestamp on successful sign-in; no client RPC can forge a login event.
create or replace function public.v6_record_login() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare p public.profiles;
begin
 if new.last_sign_in_at is not distinct from old.last_sign_in_at or new.last_sign_in_at is null then return new;end if;
 update public.profiles set last_access_at=new.last_sign_in_at where user_id=new.id returning * into p;
 if found then insert into public.audit_events(store_id,actor_id,actor_name,entity,entity_id,entity_name,action,after_data) values(p.store_id,p.user_id,p.name,'profiles',p.user_id::text,p.name,'login',jsonb_build_object('last_access_at',new.last_sign_in_at));end if;
 return new;
end $$;
drop trigger if exists trg_v6_login on auth.users;
create trigger trg_v6_login after update of last_sign_in_at on auth.users for each row execute function public.v6_record_login();

revoke all on function public.v6_seed_store(),public.v6_sync_profile_role(),public.v6_guard_promotion(),public.v6_validate_sale_promotion(),public.v6_record_login() from public,anon,authenticated;
create or replace function public.capture_burgershot_audit()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_before jsonb; v_after jsonb; v_row jsonb;
  v_fields text[]; v_actor uuid := auth.uid(); v_actor_name text;
  v_store uuid; v_action text; v_label text; v_id text;
begin
  -- Lista explícita: nunca copiar correos, contraseñas ni tokens al historial.
  -- Las ventas incluyen items para que el administrador pueda comprobar cantidades.
  case tg_table_name
    when 'profiles' then v_fields := array['name','username','role','active','commission_percent','can_edit_orders','can_manage_catalog','can_manage_employees','can_view_reports','can_manage_payouts','can_view_audit','access_role_id','can_manage_customers','can_manage_promotions','can_apply_promotions'];
    when 'products' then v_fields := array['name','category','price','active','emoji','tag','restriction'];
    when 'discounts' then v_fields := array['name','percent','scope','description','exclude_public','active'];
    when 'sales' then v_fields := array['sale_number','employee_name','client','client_type','payment','note','items','subtotal','discount_name','discount_percent','discount_amount','total','commission_percent','employee_earnings','business_net','status','payout_id','promotion_id','promotion_code'];
    when 'employee_payouts' then v_fields := array['employee_name','generated_total','amount','business_net','sales_count'];
    when 'pos_roles' then v_fields := array['name','key','permissions'];
    when 'customers' then v_fields := array['name','identifier','level','benefit'];
    when 'promotions' then v_fields := array['name','kind','value','code','product_id','active','starts_at','ends_at','description'];
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
  return null;
end;
$$;
revoke all on function public.capture_burgershot_audit() from public, anon, authenticated;


do $$declare t text;begin foreach t in array array['pos_roles','customers','promotions'] loop
 execute format('drop trigger if exists trg_burgershot_audit on public.%I',t);
 execute format('create trigger trg_burgershot_audit after insert or update or delete on public.%I for each row execute function public.capture_burgershot_audit()',t);
 end loop;end $$;
do $$declare t text;begin
 foreach t in array array['promotions','customers','pos_roles'] loop
 if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
 execute format('alter publication supabase_realtime add table public.%I',t);end if;
 end loop;end $$;
notify pgrst, 'reload schema';
commit;
