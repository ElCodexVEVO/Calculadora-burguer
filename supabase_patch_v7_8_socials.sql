-- Redes opcionales del perfil. Conserva fotografías, efectos, ventas y comisiones.
begin;
alter table public.employee_appearance add column if not exists social_links jsonb not null default '{}'::jsonb
  check (jsonb_typeof(social_links)='object');

create or replace function public.set_my_social_links(p_user_id uuid,p_links jsonb)
returns public.employee_appearance language plpgsql security definer set search_path='' as $$
declare p public.profiles; result public.employee_appearance; v_key text; v_value text; clean jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then raise exception 'Sesión inválida'; end if;
  select * into p from public.profiles where user_id=auth.uid() and active for share;
  if p.user_id is null then raise exception 'Sesión inválida'; end if;
  if p_links is null or jsonb_typeof(p_links)<>'object' or length(p_links::text)>512 then raise exception 'Redes sociales inválidas'; end if;
  for v_key,v_value in select * from jsonb_each_text(p_links) loop
    if v_key not in ('instagram','discord','tiktok','twitch') or jsonb_typeof(p_links->v_key)<>'string' then raise exception 'Red social inválida'; end if;
    v_value := btrim(v_value);
    if v_value='' then continue; end if;
    if v_key='discord' then
      if v_value !~ '^[A-Za-z0-9_.]{2,32}(#[0-9]{4})?$' then raise exception 'Usuario de Discord inválido'; end if;
    else
      if v_value !~ '^[A-Za-z0-9_.]+$' or length(v_value) > (case v_key when 'instagram' then 30 when 'tiktok' then 24 else 25 end) then raise exception 'Usuario de red social inválido'; end if;
    end if;
    clean := clean || jsonb_build_object(v_key,v_value);
  end loop;
  insert into public.employee_appearance(user_id,store_id,social_links) values(p.user_id,p.store_id,clean)
  on conflict(user_id) do update set social_links=excluded.social_links,updated_at=now()
  returning * into result;
  if result.store_id<>p.store_id then raise exception 'Tienda inválida'; end if;
  return result;
end $$;
revoke all on function public.set_my_social_links(uuid,jsonb) from public,anon;
grant execute on function public.set_my_social_links(uuid,jsonb) to authenticated;
commit;
