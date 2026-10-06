# BurgerShot · Empleado de la semana V5.5

## 1. Actualizar GitHub

Descomprime el ZIP y reemplaza/agrega estos archivos en el mismo repositorio:

- `index.html`
- `app.js`
- `pos.css`

Conserva `config.js` con tu conexión pública actual y conserva el resto de `assets/`, `companion*`, `reports.css` y las funciones de Supabase que ya funcionan. Después de guardar el commit, espera a que GitHub Pages termine y pulsa `Ctrl + F5`.

## 2. Aplicar Supabase

En Supabase → **SQL Editor**, ejecuta una sola vez `supabase_patch_v5_5_employee_week.sql`, después de los parches V5.1, V5.2, V5.3 y V5.4. El parche crea:

- La tabla `employee_of_week`, con la elección más reciente por tienda y la semana a la que corresponde; no guarda un historial de ganadores.
- RLS: todos los miembros pueden leer; solo administradores pueden guardar o borrar.
- El bucket público `employee-week`. Las subidas y reemplazos requieren una sesión de administrador y se guardan dentro de la carpeta de la tienda.
- Realtime para que el reconocimiento se actualice en las sesiones abiertas.

Si el SQL devuelve un error, no ejecutes el nombre del archivo dentro del editor: abre el archivo, copia todo su contenido y pégalo. No hace falta ejecutar V4.1 si ya aplicaste V4.2.

## 3. Usarlo como administrador

1. Entra al **Dashboard**.
2. En **Empleado de la semana**, pulsa **Configurar**.
3. Selecciona un empleado activo.
4. Opcionalmente pega una URL `https://…` o elige una imagen PNG/JPG/WebP de hasta 8 MB. La imagen se reduce en tu dispositivo y se sube como WebP.
5. Pulsa **Guardar reconocimiento**.

El panel calcula la semana local de lunes a domingo y muestra ventas activas, generado, comisión, ticket promedio, barras por día y ranking. Las ventas anuladas no cuentan. Si no hay una elección manual para la semana actual, se elige automáticamente el empleado con mayor generado.

Los empleados pueden ver el reconocimiento y sus métricas, pero no ven el botón **Configurar**. La foto puede quedar sin URL; en ese caso aparece un avatar con iniciales.

La foto subida es pública para quien tenga su enlace. Usa una imagen destinada a mostrarse al equipo, como la de su personaje. El resto del reconocimiento requiere iniciar sesión.

No necesitas subir el SQL a GitHub ni volver a desplegar las Edge Functions para esta función. Solo copia el contenido completo del parche al SQL Editor de tu proyecto actual.

## 4. Si quieres quitar la foto

Vuelve a **Configurar**, deja vacía la URL, no elijas archivo y guarda. Se conservará el reconocimiento con avatar de iniciales. Para eliminar un archivo antiguo del bucket puedes hacerlo desde Storage de Supabase como propietario del proyecto.
