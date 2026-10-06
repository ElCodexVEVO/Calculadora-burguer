-- BurgerShot V6.5 · Convenios vigentes.
-- Añade el precio especial por unidad (p. ej. Caja Feliz a $200) y los convenios exclusivos por tipo de cliente.
-- Se puede ejecutar varias veces: actualiza por nombre, crea los que faltan y desactiva los que ya no están en la lista.
-- No borra convenios ni ventas; las ventas anteriores conservan su nombre e importe de descuento.
begin;

alter table public.discounts add column if not exists kind text not null default 'percent';
alter table public.discounts add column if not exists unit_price numeric(12,2);
alter table public.discounts add column if not exists client_types text[];
do $$ begin
  alter table public.discounts add constraint discounts_kind_valid
    check (kind in ('percent','unit_price') and (kind<>'unit_price' or (unit_price is not null and unit_price>=0)));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.discounts add constraint discounts_client_types_valid
    check (client_types is null or client_types <@ array['general','police','sheriff','ems']::text[]);
exception when duplicate_object then null; end $$;

-- Lista oficial. scope: all = todo el menú, burger = hamburguesas, happybox = Caja Feliz, combos = categoría Combos.
create or replace function public.v6_5_apply_convenios(p_store uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare c record; v_names text[]:='{}';
begin
  for c in select * from (values
    ('Talleres','percent',25::numeric,null::numeric,'happybox',null::text[],'25% de descuento en Caja Feliz.',10),
    ('Stop Car','percent',25,null,'happybox',null,'25% de descuento en Caja Feliz.',20),
    ('Auto Exotic','percent',25,null,'happybox',null,'25% de descuento en Caja Feliz.',30),
    ('Overspeed','percent',25,null,'happybox',null,'25% de descuento en Caja Feliz.',40),
    ('Benny''s','percent',25,null,'happybox',null,'25% de descuento en Caja Feliz.',50),
    ('East Customs','percent',25,null,'happybox',null,'25% de descuento en Caja Feliz.',60),
    ('Bandas','percent',25,null,'happybox',null,'25% de descuento en Caja Feliz.',70),
    ('Cerberus','percent',25,null,'happybox',null,'25% de descuento en Caja Feliz.',80),
    ('506','percent',25,null,'happybox',null,'25% de descuento en Caja Feliz.',90),
    ('SecuroServ','unit_price',0,200,'happybox',null,'Caja Feliz a $200 por caja.',100),
    ('Bahamas Club','unit_price',0,250,'happybox',null,'Caja Feliz a $250 por caja.',110),
    ('Redline Mechanics','percent',10,null,'burger',null,'Descuento del 10% en todas las compras de hamburguesas.',120),
    ('EVO Motors','percent',5,null,'burger',null,'Descuento del 5% en todas las compras de hamburguesas.',130),
    ('Top Speed','percent',10,null,'burger',null,'Descuento del 10% en todas las compras de hamburguesas.',140),
    ('Empresa de Eventos','percent',10,null,'burger',null,'Descuento del 10% en todas las compras de hamburguesas.',150),
    ('503','percent',10,null,'burger',null,'Descuento del 10% en todas las compras de hamburguesas.',160),
    ('Kraken','percent',10,null,'burger',null,'Descuento del 10% en todas las compras de hamburguesas.',170),
    ('YKZ','percent',10,null,'all',null,'Beneficio confidencial: aplícalo solo si confirmas que es miembro de YKZ.',180),
    ('Precio Sheriff','unit_price',0,200,'combos',array['police','sheriff'],'Combos a $200 para policías, agentes, oficiales y personal de seguridad.',190)
  ) as v(name,kind,percent,unit_price,scope,client_types,description,sort_order) loop
    v_names:=v_names||lower(c.name);
    update public.discounts
       set kind=c.kind,percent=c.percent,unit_price=c.unit_price,scope=c.scope,client_types=c.client_types,
           description=c.description,exclude_public=false,active=true,sort_order=c.sort_order
     where store_id=p_store and system=false and lower(name)=lower(c.name);
    if not found then
      insert into public.discounts(store_id,name,kind,percent,unit_price,scope,client_types,description,exclude_public,active,system,sort_order)
      values(p_store,c.name,c.kind,c.percent,c.unit_price,c.scope,c.client_types,c.description,false,true,false,c.sort_order);
    end if;
  end loop;
  update public.discounts set active=false
   where store_id=p_store and system=false and active and not (lower(name)=any(v_names));
end $$;

-- Una tienda nueva recibe la lista vigente justo después de sembrar sus convenios iniciales.
create or replace function public.v6_5_seed_convenios() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_store uuid;
begin
  for v_store in select distinct store_id from inserted_discounts where system loop
    perform public.v6_5_apply_convenios(v_store);
  end loop;
  return null;
end $$;
drop trigger if exists trg_v6_5_seed_convenios on public.discounts;
create trigger trg_v6_5_seed_convenios after insert on public.discounts
  referencing new table as inserted_discounts for each statement execute function public.v6_5_seed_convenios();
revoke all on function public.v6_5_apply_convenios(uuid),public.v6_5_seed_convenios() from public,anon,authenticated;

-- Historial: registra también el tipo, el precio especial y los clientes exclusivos.
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
    when 'discounts' then v_fields := array['name','kind','percent','unit_price','scope','client_types','description','exclude_public','active'];
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

-- Aplica la lista a todas las tiendas existentes.
do $$ declare v_store uuid; begin
  for v_store in select id from public.stores loop perform public.v6_5_apply_convenios(v_store); end loop;
end $$;

commit;
notify pgrst, 'reload schema';
