# BurgerShot V5.0.5 — Punto de Venta

Rework sobre el ZIP completo BurgerShot_V4_4_Professional_Images.zip.

## Corrección V5.0.5

Se corrigieron las tarjetas comprimidas en Todos, Mayoreo y el resto de categorías. Las filas conservan la altura de su contenido y el catálogo se desplaza verticalmente. Las fotografías tienen un espacio reservado que no se reduce al aumentar el número de productos; precios y botones permanecen dentro de cada tarjeta.

Se añadió gestión segura de usuarios desde Administración > Empleados: dar de baja/reactivar conserva el historial y Borrar perfil elimina el acceso solo cuando no existen ventas, cortes, anulaciones, referencias de propietario o cuando no se elimina al último administrador. También se corrigieron las tarjetas comprimidas en Todos, Mayoreo y el resto de categorías.

Los errores de employee-admin ahora muestran el motivo devuelto por Supabase. Si un perfil tiene historial, la pantalla explica que debe darse de baja para conservar sus ventas. Dashboard, Estadísticas y Empleados recibieron una jerarquía visual más clara, métricas más legibles, estados tipo píldora y tarjetas con mejor profundidad. La tabla de Pagos y cortes ahora conserva una escala legible en escritorio y móvil.

Para actualizar desde V5, reemplaza index.html, app.js, styles.css, pos.css, la carpeta assets/ y VISTA_PREVIA.html. Después vuelve a desplegar la función employee-admin incluida en supabase/. No hay migración SQL nueva.

## Actualizar tu app existente

1. Descomprime el proyecto.
2. Reemplaza index.html, app.js y styles.css. Añade pos.css y la carpeta assets/ completa en tu alojamiento actual, respetando la estructura.
3. Conserva tu config.js si ya contiene la URL y la clave pública de Supabase. El archivo recibido para este rework estaba vacío y el incluido sigue vacío.
4. Si configuraste la conexión desde la pantalla de la app, permanece guardada en ese navegador y dominio, usando la misma clave bs_v3_cloud. Si cambias de navegador o dominio, vuelve a introducirla.
5. Recarga con Ctrl + F5.

**No recrees la tienda ni los empleados al actualizar.** La nueva acción de borrado vive en employee-admin y requiere redeploy de esa función.

Si aún no habías habilitado el borrado de órdenes, ejecuta una vez supabase_patch_v4_2.sql en el SQL Editor. Los patches V4.1 y V4.2 son alternativas para el mismo permiso: no necesitas ejecutar ambos. Se corrigió la cláusula duplicada del archivo V4.1 original.

## Nuevo Punto de Venta

- 12 imágenes con aspecto de fotografía comercial: cuatro individuales, cuatro combos, bebida, papitas, helado y caja feliz.
- 24 WebP optimizados: catálogo de 720 px y miniaturas de 160 px; aproximadamente 1 MB en total.
- Cajas EMS/Policía con etiquetas diferenciadas; mayoreo con la cantidad del paquete. La fotografía de mayoreo representa el producto, no todas las unidades del paquete.
- Catálogo con categorías, búsqueda, cantidades añadidas y precios destacados.
- Orden actual con miniatura, nombre, precio unitario, controles −/+, subtotal por producto, eliminación individual y vaciado.
- Convenio, tipo de cliente, total y comisión reunidos junto al botón de cobro.
- Acceso rápido del inicio agrega el producto y abre el POS.
- Protección frente a doble clic, errores al guardar y cambios de precio mientras está abierto el resumen de cobro.
- Reglas de presentación para escritorio, tablet y móvil.

En Administración > Productos > Imagen del producto puedes seleccionar una foto. La opción Automática usa el nombre y la categoría. Los productos existentes no requieren editarse. La selección se guarda como una clave photo:... dentro del campo de texto emoji ya existente; no se añaden columnas. Los valores heredados siguen siendo compatibles.

## Funciones conservadas

Supabase Auth, administrador inicial, acceso de empleados, roles, activación y baja/reactivación, borrado protegido de perfiles, restablecimiento de contraseña mediante Edge Function, comisiones individuales e históricas, convenios y exclusiones, restricciones EMS/Policía, ventas con cliente/nota/método de pago, historial personal/general, exportación CSV, estadísticas, pagos/cortes y Realtime.

Se conservan la anulación y el borrado de órdenes por administrador, incluida la protección que impide borrar una orden ya incluida en un pago. El esquema, employee-admin, config.js y el patch V4.2 son idénticos a los originales recibidos.

## Revisar el diseño sin Supabase

Abre VISTA_PREVIA.html. Es una vista estática del HTML y CSS reales, con datos de ejemplo; sus botones no operan. Para registrar ventas y trabajar usa index.html con tu conexión habitual.

## Instalar desde cero

1. Ejecuta supabase_schema_v3.sql y después supabase_patch_v4_2.sql en Supabase > SQL Editor.
2. Con Supabase CLI configurada, despliega la función incluida:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy employee-admin
```

3. Publica la carpeta como web estática en tu alojamiento o GitHub Pages. La app no necesita compilación ni npm. Incluye assets/ y pos.css.
4. Configura Project URL y publishable/anon key desde la app o config.js. No uses la service role en el navegador.
5. Pulsa Crear administrador inicial y usa un correo real. Si se solicita confirmación por correo, complétala y vuelve a iniciar sesión para terminar de crear la tienda.
6. Crea empleados y asigna sus comisiones en Administración > Empleados.

La Edge Function utiliza las variables de Supabase del entorno del servidor; la service role no se incorpora al frontend. Para actualizar un proyecto existente, ejecuta `supabase functions deploy employee-admin` después de enlazar tu proyecto.

Para trabajar localmente, si tienes Python 3 instalado:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Abre http://localhost:8000 en tu navegador. Opera la app mediante HTTP/HTTPS; la vista previa estática puede abrirse directamente como archivo.

## Verificación y alcance

Consulta VERIFICACION.md. Se probaron 28 escenarios con datos simulados. El ZIP recibido no incluía configuración de acceso a Supabase: no se realizaron operaciones sobre tu base real.

La comprobación visual en navegador quedó bloqueada en el entorno de entrega. Se incluye VISTA_PREVIA.html para revisar el resultado. La app operativa utiliza Supabase y no carga el simulador de pruebas.
