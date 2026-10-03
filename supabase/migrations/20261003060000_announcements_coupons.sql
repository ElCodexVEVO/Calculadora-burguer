-- Apply once to the existing BurgerShot database. Does not recreate users or sales.
begin;
create schema if not exists burgershot_private;
revoke all on schema burgershot_private from public, anon, authenticated;

create table public.marketing_announcements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  body text not null check (length(trim(body)) between 1 and 1800),
  created_at timestamptz not null default now()
);
create table public.marketing_coupons (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{2,31}$'),
  name text not null check (length(trim(name)) between 1 and 80),
  type text not null check (type in ('percent','fixed')),
  amount numeric(12,2) not null check (amount > 0 and amount <= 999999),
  min_subtotal numeric(12,2) not null default 0 check (min_subtotal >= 0),
  scope text not null default 'all' check (scope in ('all','burger')),
  exclude_public boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses integer check (max_uses > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (store_id,code),
  check (type <> 'percent' or amount <= 100),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
alter table public.sales add column coupon_id uuid references public.marketing_coupons(id);
alter table public.sales add column coupon_code text;
alter table public.sales add column coupon_request_id uuid;
create table public.marketing_coupon_uses (
  request_id uuid primary key,
  coupon_id uuid not null references public.marketing_coupons(id),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid unique references public.sales(id) on delete set null,
  created_by uuid not null references auth.users(id),
  request_data jsonb not null,
  discount_amount numeric(12,2) not null,
  total numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index marketing_coupon_uses_coupon on public.marketing_coupon_uses(coupon_id);

alter table public.marketing_announcements enable row level security;
alter table public.marketing_coupons enable row level security;
alter table public.marketing_coupon_uses enable row level security;
revoke all on public.marketing_announcements, public.marketing_coupons, public.marketing_coupon_uses from anon, authenticated;
grant select, insert, update, delete on public.marketing_announcements to authenticated;
grant select, insert, update on public.marketing_coupons to authenticated;
grant select on public.marketing_coupon_uses to authenticated;
create policy announcements_read on public.marketing_announcements for select to authenticated using (public.is_member(store_id));
create policy announcements_admin on public.marketing_announcements for all to authenticated using (public.is_admin(store_id)) with check (public.is_admin(store_id));
create policy coupons_read on public.marketing_coupons for select to authenticated using (public.is_admin(store_id));
create policy coupons_insert on public.marketing_coupons for insert to authenticated with check (public.is_admin(store_id));
create policy coupons_update on public.marketing_coupons for update to authenticated using (public.is_admin(store_id)) with check (public.is_admin(store_id));
create policy coupon_uses_read on public.marketing_coupon_uses for select to authenticated using (public.is_admin(store_id));

-- A stable fingerprint ignores client-supplied prices and item order.
create function burgershot_private.coupon_request_data(p_code text, p_items jsonb, p_type text, p_client text, p_payment text, p_note text, p_total numeric)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('code',upper(trim(p_code)), 'items',
    (select jsonb_agg(jsonb_build_object('id',x->>'id','qty',(x->>'qty')::numeric) order by x->>'id') from jsonb_array_elements(p_items) x),
    'client_type',p_type,'client',trim(p_client),'payment',trim(p_payment),'note',trim(coalesce(p_note,'')),'total',p_total);
$$;

create function burgershot_private.calculate_coupon(p_store uuid, p_code text, p_items jsonb, p_client_type text)
returns jsonb language plpgsql set search_path = '' as $$
declare
  c public.marketing_coupons%rowtype; p public.products%rowtype;
  item jsonb; qty integer; ids uuid[] := '{}'; pid uuid;
  subtotal numeric := 0; eligible numeric := 0; discount numeric; used bigint;
  canonical jsonb := '[]';
begin
  if p_client_type is null or p_client_type not in ('general','police','sheriff','ems') then raise exception 'Tipo de cliente inválido'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Productos inválidos'; end if;
  if jsonb_array_length(p_items) not between 1 and 200 then raise exception 'Agrega entre 1 y 200 productos'; end if;
  select * into c from public.marketing_coupons where store_id=p_store and code=upper(trim(p_code));
  if not found then raise exception 'El cupón no existe'; end if;
  if not c.active then raise exception 'Este cupón está pausado'; end if;
  if c.starts_at > clock_timestamp() then raise exception 'El cupón todavía no está vigente'; end if;
  if c.ends_at <= clock_timestamp() then raise exception 'Este cupón venció'; end if;
  if c.exclude_public and p_client_type in ('police','sheriff','ems') then raise exception 'El cupón no aplica a este tipo de cliente'; end if;
  select count(*) into used from public.marketing_coupon_uses where coupon_id=c.id;
  if c.max_uses is not null and used >= c.max_uses then raise exception 'Este cupón agotó sus usos'; end if;
  for item in select value from jsonb_array_elements(p_items) order by value->>'id' loop
    if jsonb_typeof(item) <> 'object' or coalesce(item->>'id','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or coalesce(item->>'qty','') !~ '^[0-9]{1,4}$' then raise exception 'Producto o cantidad inválida'; end if;
    pid := (item->>'id')::uuid; qty := (item->>'qty')::integer;
    if qty < 1 or pid = any(ids) then raise exception 'Cantidad inválida o producto repetido'; end if;
    ids := array_append(ids,pid);
    select * into p from public.products where id=pid and store_id=p_store and active for share;
    if not found then raise exception 'Un producto ya no está disponible'; end if;
    if p.restriction is not null and p.restriction <> '' and p.restriction <> p_client_type then raise exception 'Un producto no corresponde al tipo de cliente'; end if;
    subtotal := subtotal + p.price*qty;
    if p.tag <> 'none' and (c.scope='all' or p.tag=c.scope) then eligible := eligible+p.price*qty; end if;
    canonical := canonical || jsonb_build_array(jsonb_build_object('id',p.id,'name',p.name,'price',p.price,'qty',qty,'lineTotal',p.price*qty));
  end loop;
  if subtotal < c.min_subtotal then raise exception 'La compra mínima para este cupón es %',c.min_subtotal; end if;
  if eligible <= 0 then raise exception 'No hay productos elegibles para este cupón'; end if;
  discount := least(eligible,case when c.type='percent' then round(eligible*c.amount/100,2) else c.amount end);
  return jsonb_build_object('coupon_id',c.id,'code',c.code,'name',c.name,'type',c.type,'amount',c.amount,
    'subtotal',subtotal,'discount_amount',discount,'total',subtotal-discount,'items',canonical,'uses',used,'max_uses',c.max_uses);
end;
$$;

create function public.quote_burgershot_coupon(p_code text, p_items jsonb, p_client_type text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor public.profiles%rowtype;
begin
  select * into actor from public.profiles where user_id=auth.uid() and active;
  if not found then raise exception 'Inicia sesión con una cuenta activa'; end if;
  return burgershot_private.calculate_coupon(actor.store_id,p_code,p_items,p_client_type);
end;
$$;

-- This also protects direct REST inserts. Alphabetically precedes the commission trigger.
create function burgershot_private.apply_coupon_sale()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor public.profiles%rowtype; q jsonb;
begin
  if tg_op='UPDATE' then
    if old.coupon_id is not null or new.coupon_id is not null or old.coupon_code is not null or new.coupon_code is not null or old.coupon_request_id is not null or new.coupon_request_id is not null then
      if row(new.store_id,new.created_by,new.items,new.subtotal,new.discount_id,new.discount_name,new.discount_percent,new.discount_amount,new.total,new.coupon_id,new.coupon_code,new.coupon_request_id,new.commission_percent,new.employee_earnings,new.business_net)
        is distinct from row(old.store_id,old.created_by,old.items,old.subtotal,old.discount_id,old.discount_name,old.discount_percent,old.discount_amount,old.total,old.coupon_id,old.coupon_code,old.coupon_request_id,old.commission_percent,old.employee_earnings,old.business_net) then
        raise exception 'Una venta con cupón conserva sus importes originales; anula la orden si necesitas corregirla';
      end if;
    end if;
    return new;
  end if;
  if new.coupon_code is null then
    if new.coupon_id is not null or new.coupon_request_id is not null then raise exception 'Falta el código del cupón'; end if;
    return new;
  end if;
  select * into actor from public.profiles where user_id=auth.uid() and active for share;
  if not found or new.created_by <> actor.user_id or new.store_id <> actor.store_id then raise exception 'Empleado no autorizado'; end if;
  if new.coupon_request_id is null or new.status <> 'active' or new.payout_id is not null then raise exception 'Solicitud de cupón inválida'; end if;
  -- Serializes consumers of the last available use, including direct inserts.
  perform id from public.marketing_coupons where store_id=actor.store_id and code=upper(trim(new.coupon_code)) for update;
  q := burgershot_private.calculate_coupon(actor.store_id,new.coupon_code,new.items,new.client_type);
  if new.total is distinct from (q->>'total')::numeric then raise exception 'El precio cambió. Vuelve a aplicar el cupón y revisa el cobro'; end if;
  new.employee_name := actor.name;
  new.coupon_id := (q->>'coupon_id')::uuid; new.coupon_code := q->>'code';
  new.items := q->'items'; new.subtotal := (q->>'subtotal')::numeric;
  new.discount_id := null; new.discount_name := 'Cupón '||new.coupon_code;
  new.discount_percent := case when q->>'type'='percent' then (q->>'amount')::numeric else 0 end;
  new.discount_amount := (q->>'discount_amount')::numeric;
  return new;
end;
$$;
create trigger trg_00_coupon_sale before insert or update on public.sales for each row execute function burgershot_private.apply_coupon_sale();

create function burgershot_private.record_coupon_use()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.coupon_id is not null then
    insert into public.marketing_coupon_uses(request_id,coupon_id,store_id,sale_id,created_by,request_data,discount_amount,total)
    values(new.coupon_request_id,new.coupon_id,new.store_id,new.id,new.created_by,
      burgershot_private.coupon_request_data(new.coupon_code,new.items,new.client_type,new.client,new.payment,new.note,new.total),new.discount_amount,new.total);
  end if;
  return new;
end;
$$;
create trigger trg_coupon_use after insert on public.sales for each row execute function burgershot_private.record_coupon_use();

create function public.redeem_burgershot_coupon(p_request_id uuid, p_code text, p_items jsonb, p_client_type text, p_client text, p_payment text, p_note text, p_expected_total numeric)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor public.profiles%rowtype; previous public.marketing_coupon_uses%rowtype; fingerprint jsonb; saved public.sales%rowtype;
begin
  select * into actor from public.profiles where user_id=auth.uid() and active for share;
  if not found then raise exception 'Inicia sesión con una cuenta activa'; end if;
  if p_request_id is null or p_code is null or upper(trim(p_code)) !~ '^[A-Z0-9][A-Z0-9_-]{2,31}$' or p_expected_total is null or p_expected_total < 0 then raise exception 'Solicitud de cupón inválida'; end if;
  if p_client is null or length(trim(p_client)) not between 1 and 120 then raise exception 'Cliente / ID es obligatorio (máximo 120 caracteres)'; end if;
  if p_payment is null or length(trim(p_payment)) not between 1 and 80 or length(coalesce(p_note,'')) > 500 then raise exception 'Revisa el pago y la nota'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then raise exception 'Productos inválidos'; end if;
  fingerprint := burgershot_private.coupon_request_data(p_code,p_items,p_client_type,p_client,p_payment,p_note,p_expected_total);
  perform pg_advisory_xact_lock(hashtextextended(actor.user_id::text||p_request_id::text,0));
  select * into previous from public.marketing_coupon_uses where request_id=p_request_id;
  if found then
    if previous.created_by <> actor.user_id or previous.store_id <> actor.store_id or previous.request_data is distinct from fingerprint then raise exception 'El identificador corresponde a otra orden'; end if;
    if previous.sale_id is null then raise exception 'Esta venta ya fue registrada y después eliminada'; end if;
    return jsonb_build_object('id',previous.sale_id,'total',previous.total,'already_saved',true);
  end if;
  insert into public.sales(store_id,created_by,employee_name,client,client_type,payment,note,items,total,status,coupon_code,coupon_request_id)
  values(actor.store_id,actor.user_id,actor.name,trim(p_client),p_client_type,trim(p_payment),trim(coalesce(p_note,'')),p_items,p_expected_total,'active',upper(trim(p_code)),p_request_id)
  returning * into saved;
  return jsonb_build_object('id',saved.id,'total',saved.total,'already_saved',false);
end;
$$;

create function public.list_burgershot_coupons()
returns setof jsonb language plpgsql security definer set search_path = '' as $$
declare actor public.profiles%rowtype;
begin
  select * into actor from public.profiles where user_id=auth.uid() and active and role='admin';
  if not found then raise exception 'Solo administradores pueden gestionar cupones'; end if;
  return query select to_jsonb(c)||jsonb_build_object('uses',(select count(*) from public.marketing_coupon_uses u where u.coupon_id=c.id)) from public.marketing_coupons c where c.store_id=actor.store_id order by c.created_at desc,c.id;
end;
$$;
revoke all on all functions in schema burgershot_private from public, anon, authenticated;
revoke all on function public.quote_burgershot_coupon(text,jsonb,text), public.redeem_burgershot_coupon(uuid,text,jsonb,text,text,text,text,numeric), public.list_burgershot_coupons() from public, anon, authenticated;
grant execute on function public.quote_burgershot_coupon(text,jsonb,text), public.redeem_burgershot_coupon(uuid,text,jsonb,text,text,text,text,numeric), public.list_burgershot_coupons() to authenticated;
notify pgrst, 'reload schema';
commit;
