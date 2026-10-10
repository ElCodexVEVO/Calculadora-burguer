# Burger Shot V7 · Ofrenda nocturna

Renovación visual completa de la caja, el inicio, el acceso y los paneles de gestión. Conserva todas las funciones, reglas de cálculo, permisos y datos de V6.8. No hay cambios de base de datos ni de `config.js`.

## Qué cambia

- **Un solo sistema visual.** `ofrenda.css` y `ofrenda.js` sustituyen ocho capas superpuestas (`premium`, `atelier`, `festival`, `spooky`, `motion`, `polish-motion`, `caja-rapida`, `dashboard`). Fondos carbón, texto crema, acentos naranja cempasúchil, detalles vino y ciruela, y turquesa para confirmaciones. Tipografía única Archivo con cifras tabulares para comparar importes. Decisiones en [DESIGN.md](DESIGN.md).
- **Temporada en el marco.** Papel picado que cuelga de la cabecera y se recoge al desplazar, festones en el ticket, el banner y las ventanas, luz de vela tras el logo y algunos pétalos de cempasúchil detrás de los paneles. Nada decorativo intercepta clics.
- **Logo.** Se mantiene el emblema ilustrado original (`assets/burgershot-muertos.webp`), sin redibujarlo. Se añaden copias redimensionadas del mismo archivo en `assets/logo/` (96, 160, 320 y 512 px, favicon de 32 px e icono táctil de 180 px). Ahora es un componente animado; ver «Sistema de logo».
- **Caja.** Rejilla más densa (3 columnas a 1440 px), fotos 3:2 con marco uniforme, controles de cantidad de 44 px, ticket fijo en escritorio con líneas en dos filas, y tema claro u oscuro del ticket. En móvil y tableta, una **barra de pedido fija** muestra piezas y total real y lleva al ticket.
- **Inicio.** Indicadores en una franja única con icono, rendimiento del equipo, empleado de la semana, actividad semanal a todo el ancho, accesos rápidos y últimas ventas.
- **Cliente de la semana** vuelve a mostrarse, ahora en **Clientes** (no en el inicio): ventas activas de lunes a domingo agrupadas por Cliente / ID, con compras, generado y ticket promedio. Se recuperó el cálculo de V6.4 (commit `e4a52ba`); no usa datos nuevos.
- **Imágenes.** Fotos del menú en WebP (`assets/menu/webp/` y miniaturas en `assets/menu/thumb/`): de 12 MB a 1,7 MB, misma proporción y misma relación con cada producto. Los PNG originales siguen en `assets/menu/`. El fondo del acceso pasa de 1,9 MB a 140 KB (`assets/auth-altar.webp`, con versión de 960 px para móvil).
- **Accesibilidad.** Enlace «Saltar al contenido», foco visible en todos los controles, Escape cierra ventanas y menú devolviendo el foco, iconos SVG en lugar de glifos, etiquetas asociadas a cada campo, títulos de sección para lectores de pantalla y texto mínimo de 12 px.
- **Un solo formato de importes.** Informes, ventas e historial muestran los importes igual que la caja (centavos solo cuando existen). El resumen de cobro omite la fila de descuento cuando es $0.
- **Avisos con resultado real.** Los avisos indican éxito o error con icono y barra de tiempo. Un cobro fallido sacude la ventana de cobro y conserva la orden. Un cobro registrado imprime un ticket animado con el total real.

## Sistema de logo

El logo deja de ser una imagen suelta: es el componente `<burgershot-logo>` (`logo.js` + `logo.css`, sin dependencias). El `<img>` original va dentro del componente y es su respaldo: si el script no carga, se ve igual, solo que quieto.

```html
<burgershot-logo variant="full" animated interactive parallax intro-key="login">…</burgershot-logo>
```

| Variante | Uso | Comportamiento |
| --- | --- | --- |
| `full` | Acceso y configuración | Entrada completa de ≈1,2 s la primera vez de cada sesión: silueta → color → letras una a una → reflejo que cruza el emblema → sombra y profundidad → quieto. Después, entrada breve de 380 ms |
| `compact` | Cabecera y menú lateral | Entrada de 360 ms (opacidad y −4 px). Al pasar el cursor: reflejo y escala 1,015. Al pulsar: 0,98 |
| `icon` | Pedido vacío | Estático |
| `loader` | Pantalla de carga | El emblema se «construye»: la silueta se rellena de color de abajo arriba cada 900 ms. Sustituye al spinner genérico y a la órbita de flores |
| `mobile` | Compacto reducido | Sin interacción |

- **Profundidad 2.5D con CSS**, sin WebGL: sombra de contacto, luz y un reflejo recortado a la silueta con una máscara del propio logo. Cerca del cursor (solo escritorio) se inclina como máximo 2,5° con amortiguación; el bucle se detiene en reposo.
- **En reposo queda quieto.** No hay giros, rebotes ni brillos constantes.
- **Temporada separada de la marca:** `<html data-season="dia-de-muertos halloween">` añade solo una luz cálida detrás del emblema (y un tinte morado muy leve). Sin el atributo queda la marca base, válida todo el año. Nuevas temporadas se registran en `SEASONS` de `logo.js` y en su bloque de `logo.css`.
- **Respaldo:** si las copias de `assets/logo/` no cargan, usa el original; si no carga ninguno, muestra el monograma «BS». Mientras carga hay un marcador del tamaño final, sin saltos.
- **API desde código:** `BurgerShotLogo.create({variant, animated, interactive, parallax, introKey})`, `BurgerShotLogo.Animated()`, `.Compact()`, `.Icon()`, `.Loader()`, `.Mobile()` y `BurgerShotLoader()`.
- **Movimiento reducido:** solo un fundido de 200 ms; sin inclinación, reflejo ni velo; cargador estático.

Para el logo se evaluaron Blender (.glb), React Three Fiber y Spline y no se usaron: el proyecto no usa React ni bundler y el logo es una ilustración con el sombreado pintado, así que un modelo 3D obligaría a redibujar la marca y a cargar cientos de KB para un efecto que CSS resuelve con respaldo inmediato.

## Insignia de temporada en 3D

El bloque «Día de Muertos y Halloween» del menú lateral es ahora una insignia compacta con una pequeña escena 3D de vela, cempasúchil y calabaza. Los cuatro textos siguen siendo HTML.

- **Ruta elegida:** Blender → `.glb` → Three.js. El proyecto no usa React ni bundler, así que React Three Fiber no aplica, y Spline exigiría alojar la escena en su editor y cargar su propio runtime; se evaluaron y se descartaron.
- **Modelo:** `design/temporada/escena_3d.py` construye la escena por código en Blender (sin texturas) y exporta `assets/season/escena-temporada.glb` (≈9.300 triángulos, 194 KB). Para regenerarlo:

```
blender --background --python design/temporada/escena_3d.py -- assets/season/escena-temporada.glb
```

- **Web:** `season-scene.js` (módulo ES) con Three.js r170 incluido en `assets/vendor/three/` (licencia MIT, sin CDN). Se descarga solo cuando la insignia entra en pantalla.
- **Movimiento:** la llama y su luz oscilan de forma irregular; el cursor cambia la perspectiva unos grados con amortiguación; al pasar el cursor sube la luz. El texto no se mueve.
- **Ahorro:** 30 fps y pausa cuando la insignia no se ve, la pestaña está oculta o las animaciones están apagadas.
- **Movimiento reducido y respaldo:** con `prefers-reduced-motion`, ahorro de datos o poca memoria no se carga el 3D y queda `assets/season/escena-temporada.webp` (22 KB), que también se muestra si falla el modelo, Three.js o WebGL.
- La esquina de papel picado se regenera con `py design/temporada/build_season.py assets/season`.

## Movimiento

| Momento | Comportamiento | Con movimiento reducido o «Animaciones suaves» desactivado |
| --- | --- | --- |
| Abrir la app | Cabecera y logo entran en 360 ms sin bloquear controles | Fundido de 200 ms |
| Cambiar de sección | Fundido de 240 ms y el título sube 8 px | Instantáneo |
| Ventanas | Entrada 280 ms (escala y opacidad), salida 150 ms | Instantáneas |
| Agregar producto | Destello en la tarjeta, aviso breve sobre la foto, foto que vuela al contador o a la barra móvil y contador que late | Sin vuelo; el total cambia al instante |
| Cambiar cantidades o totales | «Tic» de 260 ms en el importe que cambió | Sin tic |
| Datos que cargan | Barras que crecen, filas del ranking y Cliente de la semana que aparecen escalonados | Visibles de inmediato |
| Ambiente | Papel picado que se mece, llama de la vela del menú lateral y cinco pétalos detrás de los paneles solo en el inicio (≥1101 px) | Todo quieto; sin pétalos |
| Resultado | Ticket «PAGADO» y pétalos al cobrar; sacudida en error de acceso o de cobro | Solo el aviso de texto |

El total y los importes siempre muestran el valor calculado desde el primer instante: las animaciones solo acompañan.

## Archivos

Nuevos: `ofrenda.css`, `ofrenda.js`, `logo.css`, `logo.js`, `tests/logo-browser.py`, `assets/logo/`, `assets/menu/webp/`, `assets/menu/thumb/`, `assets/auth-altar.webp`, `assets/auth-altar-960.webp`, `demo/build-demos.cjs`, `tests/v7-browser.py`, `tests/capture-screens.py`, `PRODUCT.md`, `DESIGN.md`, `.impeccable/`.

Modificados: `index.html`, `app.js` (avisos con tono, evento de cobro fallido, fotos WebP, Cliente de la semana), `auth-scene.css`, `auth-scene.js`, `companion.js`, `dashboard.js`, `DEMO_V6.html`, `DEMO_ACCESO.html` y las pruebas que comprobaban rutas o la ubicación de Cliente de la semana.

Eliminados (sustituidos por `ofrenda.*`): `premium.css`, `atelier.css`, `atelier.js`, `festival.css`, `festival.js`, `spooky.css`, `motion.css`, `motion.js`, `polish-motion.css`, `polish-motion.js`, `caja-rapida.css`, `dashboard.css`.

## Instalar sobre V6.8

Reemplaza o añade los archivos anteriores y elimina las capas retiradas. Conserva tu `config.js`. GitHub Pages publica el cambio al integrarse en `main`; los archivos llevan `?v=7.0.0` para renovar la caché.

Si cambias `index.html`, regenera las demos con:

```
node demo/build-demos.cjs
```

## Verificación

- 139 comprobaciones lógicas existentes (cálculos, convenios, reportes, edición de órdenes, caja auxiliar, base de datos en PGlite).
- 44 escenarios de navegador existentes: acceso (21), caja por cantidades (11) y panel (12).
- 13 escenarios del sistema de logo en `tests/logo-browser.py`: duración y FPS de la entrada, escalonado del acceso, entrada breve al recargar, paralaje con amortiguación, cabecera, 30 navegaciones sin duplicados ni fuga de memoria, redimensionado, API y temporada, móvil táctil, movimiento reducido, respaldo con imágenes bloqueadas y conexión lenta.
- 10 escenarios de la insignia 3D en `tests/season-browser.py`: bloque compacto y textos sin cortes, un solo lienzo cargado bajo demanda, oscilación de la luz, perspectiva con tope, luz al pasar el cursor, pausa y reanudación, movimiento reducido, respaldo sin modelo, sin Three.js y sin WebGL, y menú móvil de 390 px.
- 23 escenarios nuevos en `tests/v7-browser.py` (Playwright para Python): acceso válido e inválido, cierre de sesión, permisos de cajera, agregar, cambiar, quitar y vaciar, seis pedidos contrastados con las reglas de convenio y comisión, cobro fallido y correcto con historial, gráficas, Cliente de la semana, teclado, animaciones normales y reducidas, capas decorativas sin interceptar clics, tareas largas, anchos 390, 768 y 1440 px, logo, favicon y proporción de fotos.

Todo con datos simulados de `demo/`; no se tocó el Supabase real. La escena 3D se probó en Edge sin interfaz con WebGL por software; la fluidez en una tarjeta gráfica real no se midió. La ventana de escritorio junto a FiveM y las notificaciones de Discord no se probaron en este entorno.
