-- BurgerShot V4.1 patch
-- Permite borrar órdenes desde administradores

drop policy if exists sales_delete on public.sales;
create policy sales_delete
on public.sales
for delete
to authenticated
using (public.is_admin(store_id));
