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

## V10 · Textos, tablas y estados
- **Saludo según la hora** («¡Buenos días / Buenas tardes / Buenas noches, Nombre!»).
- **Tablas:** encabezados en versalitas, importes y cantidades alineados a la derecha (cifras tabulares), más aire y tipografía algo mayor. Se corrigió un desplazamiento horizontal que ya existía en «Registro de ventas» a 1280 px.
- **Estados vacíos:** centrados, con el sello de fondo y, si hay filtros aplicados, un botón «Limpiar filtros».
- **Caja:** botón «Copiar» junto a «Total a cobrar» (copia «Tu pedido son $X.», el mismo mensaje de la caja auxiliar; lee el total mostrado, no recalcula).
- **Ajustes:** textos de los modos de efectos corregidos (ya no mencionan pétalos), tarjetas con marca de selección y mejor alineación.
- **Rendimiento en modo Cinematográfico:** se elimina la sombra pulsante de las métricas (repintado continuo) y el recorte animado de las cifras en cada actualización de datos.

## V11 · Paneles
- **Una sola familia de paneles:** degradado vino con un hilo de brasa en el borde superior y borde cálido en paneles, tarjetas (empleados, convenios, promociones), tiras de métricas, filtros y tablas. El ticket de Caja (papel claro) y la Caja auxiliar quedan fuera a propósito.
- **Inicio:** «Acceso rápido» y «Últimas ventas» ganan el marco de filigrana y la ficha de icono de las cabeceras de arriba; «Últimas ventas» muestra la ficha con las iniciales de quien vendió y el folio bajo el nombre; «Rendimiento del equipo» tiene podio (oro, plata y bronce) y una punta luminosa en cada barra.
- **Tiras de métricas** del resto de pantallas con la marca de color de Inicio (naranja, rojo, magenta, turquesa).
- **Equipo:** el anillo del avatar indica el estado (verde activo) y la cuenta inactiva se atenúa.
- **Menú lateral:** el borde inferior se difumina cuando hay más opciones por ver (antes se cortaba «Promociones» en seco).
- **Herramienta nueva:** `tests/contrast-scan.py` recorre todas las pantallas y avisa de texto con contraste insuficiente frente a su fondo sólido. Sin hallazgos reales en esta versión.
- Rendimiento: CPU en reposo de Inicio ~5 %, al desplazar ~8 %, en Caja ~8 % (medido en Edge).

## V12 · Gráfica comparativa, indicadores deslizantes, viaje del logo y barrido visual
- **Actividad semanal con comparación:** barra fantasma del mismo día del periodo anterior, leyenda con el total anterior y la variación (o «Sin ventas del periodo anterior para comparar»), y selector **Semana / Mes**. La vista mensual muestra los 31 días con los futuros atenuados. Solo lee ventas activas ya cargadas; no cambia ningún cálculo existente (los datos de la vista semanal son los mismos y las pruebas del tablero pasan).
- **Indicador deslizante** en «Esta semana / Total» (Perfil), «Semana / Mes» (gráfica) y las pestañas de Administración. Las categorías de Caja no lo llevan (se usan decenas de veces al día).
- **Viaje del logo:** al terminar el acceso, el logo del cargador cruza la pantalla y aterriza en el emblema del menú (una vez por sesión; no en móvil con el menú cerrado ni con movimiento reducido).
- **`tests/visual-sweep.py`:** recorre las 16 pantallas en 5 anchos (390 a 1920 px) con datos normales y con todos los importes sustituidos por «$2,251,720», y avisa de desplazamiento horizontal, texto cortado y errores de JavaScript. `--compare <carpeta>` da el % de píxeles distintos frente a otra corrida. Ya detectó un fallo real al estrenarse (ver abajo). Las capturas (≈57 MB) van a `preview/sweep/`, ignorada por git.
- **Correcciones:** el total de la caja se cortaba con importes de 7 dígitos y el botón «Copiar» (ahora el importe pasa a una segunda línea); los paneles «Rendimiento del equipo» y «Empleado de la semana» entraban con retardos distintos y rompían la prueba de alineación del tablero; `cinematic.js` creaba animaciones de métricas aunque «Animaciones suaves» estuviera desactivado.
- **Pruebas de navegador de Node** (`dashboard-browser.cjs`, `caja-rapida-browser.cjs`): pasan. Necesitan el paquete `playwright`, que no está en `tests/package.json`. `auth-browser.cjs` y `v7-browser.py` fallan igual en el ZIP original (esperan una variante de logo que ya no se usa).
