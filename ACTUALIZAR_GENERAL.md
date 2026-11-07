# Actualizar a Burger Shot 14.8

## Interfaz

Publica los archivos de esta versión, incluyendo general.css, base-shell.css, ui-shell.js, dashboard-plus.css, dashboard-plus.js, navigation.css, navigation.js, atmosphere.css, assets/menu-general/, assets/brand/ y los iconos de assets/. Conserva tu config.js si otra instalación utiliza una conexión diferente.

La edición general conserva la identidad nocturna original: fondo, tipografía, bordes luminosos y animaciones. Retira decoraciones de temporada, filigranas, accesos sueltos, acceso rápido y últimas ventas. Conserva la caja, la caja auxiliar, el restaurante 3D y los reportes.

## Permisos de gerente

1. En una instalación distinta, aplica supabase_patch_v14_manager.sql después de las migraciones V6.
2. Despliega supabase/functions/employee-admin/index.ts conservando la verificación JWT.
3. Sincroniza las cuentas y asigna Gerente desde Equipo → empleado → Rol; solo el administrador puede hacerlo.

El gerente gestiona empleados normales (nombre, usuario, comisión y estado), crea sus accesos, consulta ventas por empleado y modifica descuentos. No puede crear roles privilegiados, modificar administradores u otros gerentes, ni eliminar cuentas. Los permisos se validan también en el servidor. Las ventas y sus importes históricos se conservan.

La instalación conectada a este repositorio ya recibió la migración y la función actualizada durante esta entrega. No asignes permisos a otra persona hasta elegir su cuenta explícitamente.

## Comprobación

Las pruebas usan registros simulados y PostgreSQL local/PGlite. No se crearon empleados reales ni se registraron ventas para verificar la entrega. Después de publicar, recarga la página con Ctrl + F5.
