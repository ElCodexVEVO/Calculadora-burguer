---
name: Burger Shot V7.7 · Noche cinematográfica
description: Punto de venta nocturno de Día de Muertos y Halloween, con acciones cálidas y perfiles personales.
colors:
  ground: "#0B050B"
  secondary: "#140911"
  wine: "#230910"
  card: "#211217"
  neon: "#FF3038"
  orange: "#FF891C"
  orange-soft: "#FFA63B"
  gold: "#FFB347"
  purple: "#281027"
  text: "#FFF0DF"
  muted: "#BCA9A8"
  success: "#39DFA4"
  surface-2: "#2c1920"
  surface-3: "#38232b"
  inset: "#170d13"
  cream-2: "#ead6c8"
  line: "rgba(246,235,217,.10)"
  line-2: "rgba(246,235,217,.17)"
  line-3: "rgba(246,235,217,.28)"
  mari-ink: "#1c0f05"
  mari-soft: "rgba(242,140,27,.14)"
  mari-line: "rgba(242,140,27,.42)"
  plum-hi: "#a76aac"
  plum-soft: "rgba(167,106,172,.16)"
  teal-soft: "rgba(82,207,170,.13)"
  red: "#ff7a6b"
  red-soft: "rgba(255,122,107,.13)"
  ticket-paper: "#f6ecdc"
  ticket-ink: "#2b1d1f"
typography:
  display:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "35px"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 108"
  headline:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.03em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 750
    lineHeight: 1.25
    fontVariation: "'wdth' 106"
  body:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
  total:
    fontFamily: "Archivo, system-ui, 'Segoe UI', Roboto, sans-serif"
    fontSize: "38px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 108"
rounded:
  xs: "6px"
  sm: "9px"
  md: "13px"
  lg: "17px"
  employee: "15px"
  identity: "18px"
  auth: "22px"
  pill: "999px"
spacing:
  control-gap: "8px"
  tight: "10px"
  grid-gap: "14px"
  panel-gap: "16px"
  panel-pad: "20px"
  profile-gap: "24px"
  page-pad: "28px"
  page-pad-mobile: "14px"
components:
  button-primary:
    textColor: "{colors.wine}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  button-primary-disabled:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "42px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-3}"
  button-danger:
    backgroundColor: "#3a1a1c"
    textColor: "#ffd9d3"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "42px"
  category-tab:
    backgroundColor: "{colors.card}"
    textColor: "{colors.cream-2}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
    height: "40px"
  category-tab-active:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.mari-ink}"
  product-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
  order-panel:
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    width: "372px"
  checkout:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.mari-ink}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "54px"
  navigation-item:
    textColor: "#ddc9bf"
    rounded: "8px"
    padding: "8px 10px"
    height: "46px"
  navigation-item-active:
    backgroundColor: "#ffe1b3"
    textColor: "#31130c"
  profile-avatar:
    textColor: "{colors.text}"
    rounded: "50%"
  effects-choice:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.text}"
    rounded: "11px"
    padding: "18px 14px"
  photo-editor:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "28px"
    width: "min(720px, calc(100vw - 32px))"
---

# Design System: Burger Shot V7.7 · Noche cinematográfica

## Overview

**Creative North Star: "La sucursal durante la ofrenda nocturna"**

Restaurante americano de noche durante Día de Muertos y Halloween: negro profundo, borgoña, rojo neón moderado, cempasúchil y texto crema. La atmósfera acompaña a una caja rápida y legible; los campos, botones, gráficas y cifras son HTML real. El logo 3D aprobado conserva su arte y proporción.

`cinematic.css`, cargado al final en `index.html`, fija la paleta `--bs-*` y adapta los alias `--o-*`. `ofrenda.css` conserva los controles de caja, tablas, festones y escalas; `auth-scene.css`, `logo.css` y `sidebar.css` aportan estructura y estados sujetos a la cascada. El sistema combina el restaurante nocturno del acceso con un marco operativo compacto y perfiles personales.

**Key Characteristics:**
- Carbón y borgoña con superficies separadas, bordes cálidos y luz roja discreta.
- Acción naranja/dorada, navegación seleccionada en crema y éxito en verde.
- Archivo variable, jerarquía por peso y anchura, cifras tabulares.
- Logo 3D intacto; papel picado, velas, niebla y pétalos como ambiente separado.
- Sidebar plegable, avatares circulares y editor de fotografía con vista previa.
- Tres niveles de efectos; movimiento reducido y pausa de la pestaña oculta.

## Colors

La paleta normativa son los doce primeros colores del frontmatter, extraídos de `--bs-*`. Los demás registran auxiliares realmente utilizados por `--o-*`; no son una segunda paleta propuesta.

### Primary
- **Cempasúchil intenso y suave** (`orange`, `orange-soft`): acciones, categorías y bordes de foco. El botón principal general mezcla oro y naranja; Cobrar y Añadir mantienen naranja sólido.
- **Dorado de vela** (`gold`): total, precios de caja auxiliar, reconocimiento semanal y foco visible.
- **Rojo neón** (`neon`): filo del acceso, bordes del marco y resplandores ambientales; el coral conserva el error.

### Secondary
- **Verde positivo** (`success`): éxito confirmado, conexión y cuenta activa. `teal-soft` conserva el velo auxiliar heredado.

### Tertiary
- **Morado profundo** (`purple`) y **borgoña oscuro** (`wine`): ambiente y profundidad. Los auxiliares ciruela siguen en gráficas y ranking.
- **Coral de error** (`red`, `red-soft`): mensajes inválidos, anulación y acciones de quitar. El botón destructivo conserva su fondo vino y texto coral claro.

### Neutral
- **Negro nocturno**, **fondo secundario** y **superficie de tarjeta** (`ground`, `secondary`, `card`): página, marco y paneles. `surface-2`, `surface-3` e `inset` separan controles, hover y campos.
- **Crema y texto secundario** (`text`, `cream-2`, `muted`): lectura sobre oscuro. `--o-faint` resuelve al mismo texto secundario.
- **Líneas crema** (`line`, `line-2`, `line-3`): divisores y controles heredados. Paneles nuevos usan borde dorado translúcido; la navegación activa tiene relleno crema.
- **Papel y tinta** (`ticket-paper`, `ticket-ink`): variante clara del ticket, con sus propios alias locales para contraste.

**La regla de la acción.** El naranja y el dorado guían la operación; el rojo neón ilumina el marco. Una selección de navegación usa crema.

**La regla del éxito.** El verde señala éxito o conexión; importes y comisiones conservan crema, y el total destaca en oro.

## Typography

**Display Font:** Archivo variable, ejes `wdth` 62–125 y `wght` 400–900.
**Body Font:** Archivo a anchura normal, con respaldo system-ui, Segoe UI y Roboto.

El carácter procede del rótulo de restaurante y de pesos anchos; el lettering completo de la marca vive en el emblema 3D. La bienvenida usa el rol display (31px en móvil; 30px en escritorio bajo); títulos de página usan headline (24px en móvil). Paneles usan title; productos, 750/16px. El cuerpo sube a 15px bajo 760px y los campos operativos a 16px; los campos del acceso conservan 14px. El total del ticket usa el rol total; cifras de Mi perfil, 750/29px (24px en móvil).

**La regla tabular.** Toda cifra que cambia o se alinea usa `font-variant-numeric: tabular-nums`; ningún efecto altera el número real para animarlo.

## Layout

- **Marco:** sidebar fijo de 252px o carril de 76px en escritorio (>1100px), con preferencia local persistente. A ≤1100px pasa a cajón de `min(280px, calc(100vw - 40px))`, con velo, cierre y contención del foco. Cabecera de 64px (58px a ≤760px), sección, búsqueda, cuenta y reloj; fecha/hora se ocultan a ≤800px. El disparador de búsqueda móvil aparece a ≤760px.
- **Página y caja:** ancho máximo de 1720px; relleno de página `50px 28px 40px`, y `40px 14px 36px` a ≤760px. Caja en `minmax(0,1fr) 372px` (344px a ≤1380px), con hueco de 20px. Catálogo automático de mínimo 212px, compacto 176px; dos columnas a ≤760px. Ticket en flujo y barra de pedido fija a ≤1100px; el ticket también pasa a flujo en escritorio de poca altura o al expandir opciones.
- **Perfil:** identidad y contenido en `minmax(220px,.75fr) minmax(0,2fr)`, hueco de 28px; identidad de 240px a ≤1100px, una columna a ≤700px. Estadísticas propias en dos columnas; opciones de efectos en tres, una a ≤1100px.
- **Acceso:** composición centrada de hasta 440px, relleno `30px 34px 32px`, sobre `assets/restaurant-night.webp`; variante `restaurant-night-960.webp` a ≤960px. En móvil, relleno `26px 26px 28px`; el fondo se encuadra al 38%. Pantallas bajas permiten desplazamiento vertical.
- **Ritmo y tacto:** 8px entre controles, 10–14px en catálogo, 16–28px entre paneles. En caja móvil: cantidades de 40px, Añadir/campos de 46px, Cobrar y barra de pedido de 58px. Las tablas desplazan su propio contenido horizontal.

## Elevation & Depth

La profundidad combina superficies oscuras, bordes translúcidos y sombras blandas. Los degradados describen luz cálida o vino; los resplandores se reservan al marco, interacción y estados.

### Shadow Vocabulary
- **Panel moderno:** `0 12px 32px -22px #000`; hover de métricas, empleados y promociones con `0 14px 32px -22px rgba(255,48,56,.55)`.
- **Acción principal:** `0 7px 20px -13px #ff891c`; hover con `0 9px 26px -12px #ff891c` y brillo 1.06.
- **Elevado heredado:** `--o-shadow-2`, para caja auxiliar; **flotante heredado:** `--o-shadow-pop`, para avisos y cajón. Ticket y ventanas reciben la sombra moderna por la cascada final, conservando sus degradados locales.
- **Acceso:** `0 26px 65px -15px rgba(0,0,0,.85), 0 0 0 4px rgba(255,48,56,.025)`, con filo rojo luminoso superior.

**La regla de la luz blanda.** Los resplandores separan e iluminan sin competir con la lectura ni introducir sombras duras desplazadas.

## Shapes

Se conservan radios `xs`–`lg` en controles, ticket y paneles; empleados, identidad y acceso usan sus radios específicos del frontmatter. Avatares circulares, categorías y etiquetas en píldora. Bordes de 1px predominan; el retrato y la foto del empleado de la semana tienen borde de 2px. Recibos y líneas de pedido usan separadores discontinuos.

El festón de papel picado (`--papel-edge`) permanece en ticket, separadores de cobro, ventanas y franja del inicio. El acceso actual usa un filo de neón en la composición exterior y oculta el festón de la tarjeta interior. Los motivos decorativos no interceptan clics.

## Components

### Buttons
Botón general: mínimo 42px, radio `sm`, relleno `10px 16px`, Archivo 700/14px. Principal con degradado de 110° entre oro y naranja, texto borgoña y borde naranja suave; secundario en `surface-2`; peligro en vino oscuro. Hover sube 1px y pulsación reduce a .97 durante 80ms. Principal deshabilitado: `surface-3`, texto secundario, opacidad plena y sin sombra. El botón específico del acceso conserva mínimo 54px y sus degradados propios: `linear-gradient(110deg,#ffb049,#f28c1b)`, y `linear-gradient(110deg,#ffbd63,#ff9d2e)` en hover; son estilos locales heredados, no tokens de la paleta global.

### Inputs / Fields
Campos operativos: mínimo 42px, radio `sm`, relleno `10px 12px`, fondo `inset`; foco naranja con anillo heredado y error coral. El foco global usa oro (2px, desplazamiento de 3px); los selectores conservan su tratamiento heredado. Acceso: 48px y radio 9px. Búsqueda global: 40px, icono SVG, resultados flotantes y acceso a productos/secciones permitidas.

### Chips
Categorías en píldoras de mínimo 40px, activa naranja. Etiquetas de estado de mínimo 24px con punto: verde para activo, coral para anulado/error, oro para destacado. Las pestañas internas mantienen fondo elevado y filo naranja inferior.

### Cards / Containers
Paneles sobre `card`, borde dorado translúcido y sombra moderna; las métricas conservan la franja dividida existente. Listas e historial usan filas con divisores. Tarjeta de producto: fotografía 16:9 (2:1 compacta), precio crema de 22px (20px móvil), cantidad y Añadir, atajos +5/+10/+25/+50; la vista previa y la confirmación aparecen sobre la foto sin mover controles. Tarjetas de empleados: radio 15px, relleno 22px (20px móvil), avatar 64px y hover de −3px; entrada de 400ms con escalón de 35ms.

### Ticket, ventanas y avisos
Ticket de radio `lg`, degradado oscuro heredado, festón superior y subtotales separados; total oro, Cobrar al pie y variante clara de papel. La altura se ajusta para mantener el cobro disponible. Barra móvil a 12px de los bordes y zona segura inferior. Ventanas con velo y foco contenido; acciones destructivas separadas a la izquierda. Avisos inferiores con icono SVG, texto claro y color de estado; éxito únicamente tras confirmar la operación. Tablas con cabecera pegajosa, texto sin mayúsculas y cifras tabulares.

### Navigation
Elementos de mínimo 46px, radio 8px, relleno `8px 10px`; hover rojo translúcido, activo crema con tinta oscura. Iconos SVG de trazo, nombre accesible y `aria-current`; el carril compacto conserva nombres mediante tooltip al hover y al foco. La cuenta del sidebar abre Mi cuenta, con acceso a Mi perfil; la del encabezado abre Mi perfil directamente. La insignia 3D estacional anterior del sidebar está oculta en esta composición.

### Perfil y editor de fotografía
Avatar reutilizado en encabezado, sidebar, cuenta, perfil, empleados, reconocimiento semanal y clasificaciones; foto en `cover` o iniciales si falta/falla. Retrato de 156px (120px móvil), vista previa de 92px (72px móvil), aro naranja y énfasis dorado para empleado de la semana. Identidad sobre degradado vino con filo rojo; actividad y preferencias en paneles adyacentes.

Editor de hasta 720px con dos columnas, recorte cuadrado de 300px y guía circular, vista previa, zoom 1–3 y reposición por arrastre o controles. Una columna a ≤700px; eliminar se separa de cancelar/guardar. Conserva progreso, error corregible y foto previa si falla. La disponibilidad real del backend se documenta en `PRODUCT.md` y `docs/PROFILE_DEPLOYMENT.md`.

### Marca, ambiente y movimiento
`<burgershot-logo>` conserva `assets/logo/burgershot-3d-*.webp`, originales y monograma de respaldo; variantes full, compact, mobile, icon y loader. Luz, sombra, reflejo y parallax son capas externas al arte. En acceso, el emblema mide 150×126px (118×100px en escritorio bajo), flota en 7.2s y la bienvenida ondula en 4.8s; campos y acciones permanecen estables. Papel picado y velas acompañan la escena del restaurante.

Estados heredados usan `--o-fast` (160ms), `--o-base` (220ms) y salida `cubic-bezier(.22,1,.36,1)`; cierres usan la curva de entrada. Sidebar cambia en 240ms, entradas modernas usan `cubic-bezier(.16,1,.3,1)`. Los contadores se revelan mediante recorte o entrada del elemento, sin sustituir importes. Éxito, error y recibo acompañan el resultado real.

Cinematográfico activa niebla de 28s y luz ambiental de métricas de 5s; Equilibrado limita a diez pétalos de inicio y cuatro del acceso, sin niebla; móvil limita inicio a ocho. Rendimiento elimina partículas, parallax, animaciones y transiciones. `prefers-reduced-motion` desactiva movimiento; `visual-paused` pausa animaciones con la pestaña oculta. Los pétalos del marco solo aparecen en Inicio, nunca en caja ni caja auxiliar.

## Do's and Don'ts

### Do:
- **Do** usar la paleta de `cinematic.css` y respetar los alias locales del ticket claro.
- **Do** conservar la acción cálida, la selección crema y el éxito verde.
- **Do** mantener cifras tabulares y mostrar el total real antes de cualquier efecto.
- **Do** usar SVG de trazo, nombres accesibles, foco visible y divisores en listas.
- **Do** conservar el logo 3D aprobado, su proporción y sus recursos de respaldo.
- **Do** mantener decoración con `pointer-events: none` y `aria-hidden`, respetar los modos de efectos y la reducción de movimiento.

### Don't:
- **Don't** reintroducir el antetítulo ni la leyenda estacional retirados del formulario de acceso.
- **Don't** usar emoji o glifos como sustitutos de iconografía profesional.
- **Don't** redibujar, recolorear ni recortar el arte del emblema.
- **Don't** extender los bucles ambientales al catálogo, ticket, tablas o caja auxiliar.
- **Don't** introducir sombras duras ni cajas anidadas para filas de una lista.
- **Don't** ocultar, retrasar o recalcular un importe para producir una animación.
