# V9 · Pulido de interfaz

Base: `Calculadora-burguer-main (5).zip`. No cambia lógica, precios, convenios, Supabase ni permisos.

## Qué cambió
- **Tipografía:** Fraunces (títulos y cifras destacadas) + Figtree (interfaz y caja), autoalojadas en `assets/fonts/` y declaradas en `fonts.css`. Se retiran Vollkorn, Archivo (Google Fonts) y las referencias sueltas a Manrope/Inter/Georgia. Las cifras ahora son lineales y tabulares (Vollkorn usaba cifras antiguas: «$13,440» se leía «$I3,440»).
- **Neón** rojo/naranja en palabras clave, con encendido de letrero al entrar y respiración suave.
- **Movimiento:** coreografía del inicio, transición entre módulos (View Transitions), revelado al bajar, progreso de lectura, luz de cursor, micro-interacciones.
- **Acceso:** tarjeta de cristal con flotación.
- **Correcciones:** guirnalda recortada en seco, reloj tapado por la guirnalda, línea que cruzaba la tarjeta «Día de Muertos», números «01/02» y rótulo «Edición de temporada» sin función, encabezado de tableta apilado, rótulos de 9–10 px.

## Archivos nuevos
`fonts.css`, `polish.css`, `polish.js`, `assets/fonts/{Fraunces,Figtree}-*.woff2` y sus licencias OFL.

## Cómo desactivarlo
Quitar `polish.css` y `polish.js` de `index.html` y regenerar demos con `node demo/build-demos.cjs` devuelve el movimiento a V7.8 (la tipografía vive en `fonts.css`).

## Resto de pantallas (V9.1)
Caja, Caja auxiliar, Ventas, Estadísticas, Registro de ventas, Clientes, Equipo, Pagos y cortes, Auditoría, Convenios, Productos, Administración, Promociones, Mi perfil, Ajustes y el modal de cobro usan el mismo sistema:
- Títulos y cifras en Fraunces; porcentajes de convenios y promociones, y totales, con neón naranja.
- Paneles, filtros y métricas con cristal suave; tarjetas de empleado, convenio y promoción se elevan al pasar el cursor.
- Cascada de entrada en métricas, tarjetas y primeras filas de tabla; resalte de fila al pasar el cursor.
- Un grupo pequeño de vela y cempasúchil junto al menú (solo pantallas amplias, fuera de Inicio, Caja y Caja auxiliar), que se retira al bajar.

## V9.2 · Emblema del menú y luces
- **Logo del panel lateral** reemplazado por el esqueleto charro (`design/logo-charro/charro-original.webp`; capas generadas con `py design/logo-charro/build.py` → `assets/logo/charro-*`). Solo ese lugar: la Caja, la Caja auxiliar, el acceso y el favicon conservan el logo anterior.
- **Animación «letrero embrujado»:** neón que parpadea como tubo averiado, llamas de las velas que titilan, ojos que se encienden de vez en cuando y al pasar el cursor, niebla, flotación lenta y un destello de tormenta cada ~14 s. Carril plegado: medalla circular.
- **Caja estable:** el panel «Tu pedido» ya no cambia de altura al agregar productos (la lista se desplaza por dentro) y las confirmaciones de «agregar» ya no escalan (antes hasta 1,15×).
- **Luces de fondo** que parpadean en Actividad semanal, Rendimiento del equipo y Empleado de la semana (velas y brasas), solo mientras el panel está a la vista.
- **Primer plano mejorado:** vela con llama parpadeante y luz propia, balanceo suave, y retirada correcta al bajar (la animación de entrada pisaba la de retirada).
- **Variantes del logo disponibles** en `assets/logo/`: `charro-rotulo`, `charro-wordmark`, `charro-busto`, `charro-medalla`, `charro-sello`, `charro-base/neon/llamas`.
