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

## V9.3 · Rendimiento, modelos nuevos y correcciones
- **Rendimiento** (medido en Edge, Inicio a 1672×941, CPU de un núcleo en reposo): 43 % → 8 %; al desplazar 49 % → 11 %; en Caja 22 % → 13 %. Causas: 121 desenfoques de fondo (tarjetas, insignias, paneles) → 17; 79 animaciones activas → 27; 53 capas con mezcla → 5; animaciones de `text-shadow`, `filter` y propiedades personalizadas (repintaban cada fotograma) sustituidas por opacidad/transformación; luz de cursor y parallax eliminados.
- **Partículas de Inicio eliminadas:** pétalos que caen y orbes de las luces. Se ocultan también el interruptor «Pétalos en el ambiente».
- **Modelos 3D nuevos** (`design/props-source/`, script `build_props.py` → `assets/season/props/`): velas con calavera y cempasúchil (esquina izquierda), guirnalda con velas y papel picado (final de Inicio), esquinas de flores y velas (tarjeta del acceso y tarjeta de temporada del menú). Cada llama tiene su halo que parpadea. Se descartó el modelo de la calavera con flores.
- **Banner:** la foto se funde con degradado, sin corte vertical en pantallas anchas.
- **Métricas:** el marco de filigrana ocupa toda la tarjeta (una regla antigua lo dejaba como un recuadro de 148×34 px sobre el texto).
- **Actividad semanal:** las etiquetas de día vuelven a verse (las filas de las barras eran más altas que la gráfica y se recortaban); luces tenues de vela.
- **Redes sociales:** insignias de marca (Instagram, Discord, TikTok, Twitch; glifos Simple Icons, CC0), una fila por red.
