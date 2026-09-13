-- BurgerShot V4.2
-- Permite que administradores eliminen órdenes
drop policy if exists sales_delete on public.sales;

create policy sales_delete
on public.sales
for delete
to authenticated
using (public.is_admin(store_id));
