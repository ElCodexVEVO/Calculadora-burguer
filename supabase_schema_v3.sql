-- BurgerShot V3 Dark Premium - DB + employee commission ledger
-- Ejecuta TODO en Supabase > SQL Editor.
-- IMPORTANTE: Authentication > Providers > Email > "Confirm email" = OFF.

create extension if not exists pgcrypto;

create table if not exists public.stores(
  id uuid primary key default gen_random_uuid(),
  name text not null default 'BurgerShot',
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  role text not null default 'cashier',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Upgrade from V2 if needed
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists login_email text;
alter table public.profiles add column if not exists commission_percent numeric(5,2) not null default 0;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('admin','cashier'));
alter table public.profiles drop constraint if exists profiles_commission_check;
alter table public.profiles add constraint profiles_commission_check check(commission_percent>=0 and commission_percent<=100);
create unique index if not exists profiles_username_unique on public.profiles(lower(username)) where username is not null;

create table if not exists public.products(
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  category text not null,
  price numeric(12,2) not null default 0 check(price>=0),
  emoji text not null default '🍔',
  tag text not null default 'all',
  restriction text,
  active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.discounts(
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  percent numeric(5,2) not null default 25 check(percent>=0 and percent<=100),
  scope text not null default 'all',
  description text not null default '',
  exclude_public boolean not null default false,
  active boolean not null default true,
  system boolean not null default false,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_payouts(
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  employee_id uuid not null references auth.users(id),
  employee_name text not null,
  generated_total numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  business_net numeric(12,2) not null default 0,
  sales_count int not null default 0,
  created_by uuid not null references auth.users(id),
  created_by_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.sales(
  id uuid primary key default gen_random_uuid(),
  sale_number bigint generated always as identity,
  store_id uuid not null references public.stores(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  employee_name text not null,
  client text not null default 'Cliente general',
  client_type text not null default 'general',
  payment text not null default 'Efectivo',
  note text not null default '',
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  discount_id uuid,
  discount_name text not null default 'Sin convenio',
  discount_percent numeric(5,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'active',
  voided_at timestamptz,
  voided_by uuid references auth.users(id),
  commission_percent numeric(5,2) not null default 0,
  employee_earnings numeric(12,2) not null default 0,
  business_net numeric(12,2) not null default 0,
  payout_id uuid references public.employee_payouts(id),
  created_at timestamptz not null default now()
);

-- Upgrade V2 sales
alter table public.sales add column if not exists commission_percent numeric(5,2) not null default 0;
alter table public.sales add column if not exists employee_earnings numeric(12,2) not null default 0;
alter table public.sales add column if not exists business_net numeric(12,2) not null default 0;
alter table public.sales add column if not exists payout_id uuid references public.employee_payouts(id);

create or replace function public.is_member(p_store uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.store_id=p_store and p.active=true);
$$;

create or replace function public.is_admin(p_store uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.user_id=auth.uid() and p.store_id=p_store and p.active=true and p.role='admin');
$$;

grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;

-- Public username -> hidden synthetic email resolver
create or replace function public.resolve_login_email(p_username text)
returns text language sql stable security definer set search_path=public as $$
  select login_email from public.profiles
  where lower(username)=lower(trim(p_username)) and active=true
  limit 1;
$$;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- Initial admin / store
create or replace function public.bootstrap_store(
  p_store_name text,
  p_display_name text,
  p_username text,
  p_login_email text
)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_store uuid;
begin
  if v_uid is null then raise exception 'Debes iniciar sesión'; end if;
  if exists(select 1 from public.profiles where user_id=v_uid) then raise exception 'Esta cuenta ya tiene perfil'; end if;
  if exists(select 1 from public.profiles where lower(username)=lower(trim(p_username))) then raise exception 'Ese usuario ya existe'; end if;

  insert into public.stores(name,owner_id)
  values(coalesce(nullif(trim(p_store_name),''),'BurgerShot'),v_uid)
  returning id into v_store;

  insert into public.profiles(user_id,store_id,name,username,login_email,role,active,commission_percent)
  values(v_uid,v_store,coalesce(nullif(trim(p_display_name),''),'Administrador'),lower(trim(p_username)),lower(trim(p_login_email)),'admin',true,0);

  insert into public.products(store_id,name,category,price,emoji,tag,restriction,sort_order) values
  (v_store,'Combo Hamburguesa','combos',280,'🍔','burger',null,10),
  (v_store,'Combo Nuggets','combos',280,'🟤','all',null,20),
  (v_store,'Combo Alitas','combos',280,'🍗','all',null,30),
  (v_store,'Combo Burrito','combos',280,'🌯','all',null,40),
  (v_store,'Hamburguesa','individuales',200,'🍔','burger',null,50),
  (v_store,'Cubo de alitas','individuales',200,'🍗','all',null,60),
  (v_store,'Burrito','individuales',200,'🌯','all',null,70),
  (v_store,'Nuggets','individuales',200,'🟤','all',null,80),
  (v_store,'Cola-Shot','extras',100,'🥤','all',null,90),
  (v_store,'Helado','extras',100,'🍦','all',null,100),
  (v_store,'Papitas fritas','extras',100,'🍟','all',null,110),
  (v_store,'Caja Feliz','cajas',400,'🎁','happybox',null,120),
  (v_store,'Cajita Feliz EMS','cajas',250,'🚑','none','ems',130),
  (v_store,'Cajita Feliz Policía','cajas',250,'🚓','none','police',140),
  (v_store,'Mayoreo Hamburguesa 5×5','mayoreo',1200,'🍔','burger',null,150),
  (v_store,'Mayoreo Hamburguesa 25×25','mayoreo',6000,'🍔','burger',null,160),
  (v_store,'Mayoreo Hamburguesa 50×50','mayoreo',12000,'🍔','burger',null,170),
  (v_store,'Mayoreo Hamburguesa 100×100','mayoreo',24000,'🍔','burger',null,180),
  (v_store,'Mayoreo Nuggets 5×5','mayoreo',1200,'🟤','all',null,190),
  (v_store,'Mayoreo Nuggets 25×25','mayoreo',6000,'🟤','all',null,200),
  (v_store,'Mayoreo Nuggets 50×50','mayoreo',12000,'🟤','all',null,210),
  (v_store,'Mayoreo Nuggets 100×100','mayoreo',24000,'🟤','all',null,220),
  (v_store,'Mayoreo Alitas 5×5','mayoreo',1200,'🍗','all',null,230),
  (v_store,'Mayoreo Alitas 25×25','mayoreo',6000,'🍗','all',null,240),
  (v_store,'Mayoreo Alitas 50×50','mayoreo',12000,'🍗','all',null,250),
  (v_store,'Mayoreo Alitas 100×100','mayoreo',24000,'🍗','all',null,260),
  (v_store,'Mayoreo Burrito 5×5','mayoreo',1200,'🌯','all',null,270),
  (v_store,'Mayoreo Burrito 25×25','mayoreo',6000,'🌯','all',null,280),
  (v_store,'Mayoreo Burrito 50×50','mayoreo',12000,'🌯','all',null,290),
  (v_store,'Mayoreo Burrito 100×100','mayoreo',24000,'🌯','all',null,300);

  -- Convenios al 25%
  insert into public.discounts(store_id,name,percent,scope,description,exclude_public,system,sort_order) values
  (v_store,'Sin convenio',0,'all','Precio normal.',false,true,1),
  (v_store,'YKZ',25,'all','Convenio autorizado del 25%.',false,false,10),
  (v_store,'Redline Mechanics',25,'all','Convenio autorizado del 25%.',false,false,20),
  (v_store,'EVO Motors',25,'all','Convenio autorizado del 25%.',false,false,30),
  (v_store,'Top Speed',25,'all','Convenio autorizado del 25%.',false,false,40),
  (v_store,'Empresa de Eventos',25,'all','Convenio autorizado del 25%.',false,false,50),
  (v_store,'503',25,'all','Convenio autorizado del 25%.',false,false,60),
  (v_store,'Kraken',25,'all','Convenio autorizado del 25%.',false,false,70);

  return v_store;
end;
$$;
grant execute on function public.bootstrap_store(text,text,text,text) to authenticated;

-- Snapshot commission automatically on every sale
create or replace function public.apply_sale_commission()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_pct numeric(5,2);
begin
  select coalesce(commission_percent,0) into v_pct
  from public.profiles where user_id=new.created_by and store_id=new.store_id and active=true;

  if v_pct is null then raise exception 'Empleado inválido'; end if;

  new.commission_percent:=v_pct;
  new.employee_earnings:=round((new.total * v_pct / 100.0)::numeric,2);
  new.business_net:=round((new.total - new.employee_earnings)::numeric,2);
  return new;
end;
$$;

drop trigger if exists trg_apply_sale_commission on public.sales;
create trigger trg_apply_sale_commission
before insert on public.sales
for each row execute function public.apply_sale_commission();

-- Admin creates a payout containing all unpaid active sales for one employee
create or replace function public.create_employee_payout(p_employee uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  v_admin uuid:=auth.uid();
  v_store uuid;
  v_admin_name text;
  v_employee_name text;
  v_generated numeric(12,2);
  v_amount numeric(12,2);
  v_net numeric(12,2);
  v_count int;
  v_payout uuid;
begin
  select p.store_id,p.name into v_store,v_admin_name
  from public.profiles p where p.user_id=v_admin and p.active=true and p.role='admin';

  if v_store is null then raise exception 'No autorizado'; end if;

  select name into v_employee_name from public.profiles
  where user_id=p_employee and store_id=v_store;

  if v_employee_name is null then raise exception 'Empleado no encontrado'; end if;

  select coalesce(sum(total),0),coalesce(sum(employee_earnings),0),coalesce(sum(business_net),0),count(*)
  into v_generated,v_amount,v_net,v_count
  from public.sales
  where store_id=v_store and created_by=p_employee and status='active' and payout_id is null and employee_earnings>0;

  if v_count=0 or v_amount<=0 then raise exception 'No hay ganancias pendientes por pagar'; end if;

  insert into public.employee_payouts(store_id,employee_id,employee_name,generated_total,amount,business_net,sales_count,created_by,created_by_name)
  values(v_store,p_employee,v_employee_name,v_generated,v_amount,v_net,v_count,v_admin,v_admin_name)
  returning id into v_payout;

  update public.sales set payout_id=v_payout
  where store_id=v_store and created_by=p_employee and status='active' and payout_id is null and employee_earnings>0;

  return v_payout;
end;
$$;
grant execute on function public.create_employee_payout(uuid) to authenticated;

alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.discounts enable row level security;
alter table public.sales enable row level security;
alter table public.employee_payouts enable row level security;

drop policy if exists stores_select on public.stores;
create policy stores_select on public.stores for select to authenticated using(public.is_member(id) or owner_id=auth.uid());
drop policy if exists stores_update on public.stores;
create policy stores_update on public.stores for update to authenticated using(public.is_admin(id)) with check(public.is_admin(id));

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using(public.is_member(store_id));
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check(public.is_admin(store_id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using(public.is_admin(store_id)) with check(public.is_admin(store_id));

drop policy if exists products_select on public.products;
create policy products_select on public.products for select to authenticated using(public.is_member(store_id));
drop policy if exists products_insert on public.products;
create policy products_insert on public.products for insert to authenticated with check(public.is_admin(store_id));
drop policy if exists products_update on public.products;
create policy products_update on public.products for update to authenticated using(public.is_admin(store_id)) with check(public.is_admin(store_id));
drop policy if exists products_delete on public.products;
create policy products_delete on public.products for delete to authenticated using(public.is_admin(store_id));

drop policy if exists discounts_select on public.discounts;
create policy discounts_select on public.discounts for select to authenticated using(public.is_member(store_id));
drop policy if exists discounts_insert on public.discounts;
create policy discounts_insert on public.discounts for insert to authenticated with check(public.is_admin(store_id));
drop policy if exists discounts_update on public.discounts;
create policy discounts_update on public.discounts for update to authenticated using(public.is_admin(store_id)) with check(public.is_admin(store_id));
drop policy if exists discounts_delete on public.discounts;
create policy discounts_delete on public.discounts for delete to authenticated using(public.is_admin(store_id));

drop policy if exists sales_select on public.sales;
create policy sales_select on public.sales for select to authenticated using(public.is_member(store_id));
drop policy if exists sales_insert on public.sales;
create policy sales_insert on public.sales for insert to authenticated with check(public.is_member(store_id) and created_by=auth.uid());
drop policy if exists sales_update on public.sales;
create policy sales_update on public.sales for update to authenticated using(public.is_admin(store_id)) with check(public.is_admin(store_id));

drop policy if exists payouts_select on public.employee_payouts;
create policy payouts_select on public.employee_payouts for select to authenticated using(public.is_member(store_id));
drop policy if exists payouts_insert on public.employee_payouts;
create policy payouts_insert on public.employee_payouts for insert to authenticated with check(public.is_admin(store_id));

do $$
begin
  begin alter publication supabase_realtime add table public.sales; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.products; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.discounts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.employee_payouts; exception when duplicate_object then null; end;
end $$;
