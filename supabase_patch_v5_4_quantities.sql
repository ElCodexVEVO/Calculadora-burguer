-- BurgerShot V5.4: detalle de cantidades en el historial de cambios.
-- Ejecutar después de supabase_patch_v5_1.sql. No borra eventos existentes.
begin;

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
    when 'profiles' then v_fields := array['name','username','role','active','commission_percent','can_edit_orders','can_manage_catalog','can_manage_employees','can_view_reports','can_manage_payouts','can_view_audit'];
    when 'products' then v_fields := array['name','category','price','active','emoji','tag','restriction'];
    when 'discounts' then v_fields := array['name','percent','scope','description','exclude_public','active'];
    when 'sales' then v_fields := array['sale_number','employee_name','client','client_type','payment','note','items','subtotal','discount_name','discount_percent','discount_amount','total','commission_percent','employee_earnings','business_net','status','payout_id'];
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

notify pgrst, 'reload schema';
commit;
