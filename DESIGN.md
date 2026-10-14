---
name: Burger Shot V7.8 · Ofrenda nocturna de referencia
description: Punto de venta con paneles negros, filigrana roja luminosa, tipografía serif y perfiles personales.
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
  night-panel: "rgba(12,4,7,.94)"
  night-line: "rgba(238,58,36,.52)"
  luminous-red: "#ff4c25"
  nav-text: "#f0dfd6"
  nav-active-text: "#fff5e8"
  line-2: "rgba(246,235,217,.17)"
  ticket-paper: "#f6ecdc"
  ticket-ink: "#2b1d1f"
typography:
  display:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "clamp(32px, 2.8vw, 46px)"
    fontWeight: 800
    lineHeight: 1.07
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "43px"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  profile-title:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "38px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  metric:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "clamp(21px, 1.65vw, 28px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
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
  control: "8px"
  sm: "9px"
  panel: "12px"
  hero: "13px"
  profile: "14px"
  modal: "17px"
  auth: "22px"
  pill: "999px"
  avatar: "50%"
spacing:
  control-gap: "8px"
  tight: "10px"
  grid-gap: "14px"
  page-inset: "17px"
  panel-pad: "20px"
  profile-gap: "24px"
  photo-pad: "28px"
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
  dashboard-action:
    textColor: "#200a03"
    rounded: "{rounded.control}"
    padding: "10px 22px"
    height: "43px"
  input:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "42px"
  social-input:
    backgroundColor: "#13070d"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "43px"
  navigation-item:
    textColor: "{colors.nav-text}"
    rounded: "{rounded.control}"
    padding: "9px 13px"
    height: "44px"
  navigation-item-active:
    textColor: "{colors.nav-active-text}"
  period-chip:
    textColor: "#d9c3b6"
    rounded: "{rounded.xs}"
    padding: "8px 15px"
    height: "35px"
  period-chip-active:
    backgroundColor: "#7b2015"
    textColor: "#fff2df"
  dashboard-card:
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
  dashboard-hero:
    backgroundColor: "#100204"
    textColor: "{colors.text}"
    rounded: "{rounded.hero}"
    height: "252px"
  metric-card:
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "12px 17px"
    height: "92px"
  profile-identity:
    textColor: "{colors.text}"
    rounded: "{rounded.profile}"
    padding: "34px 26px 25px"
  profile-avatar:
    textColor: "{colors.text}"
    rounded: "{rounded.avatar}"
    size: "158px"
  effects-choice:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.text}"
    rounded: "11px"
    padding: "18px 14px"
  photo-editor:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.modal}"
    padding: "{spacing.photo-pad}"
    width: "min(720px, calc(100vw - 32px))"
---

# Design System: Burger Shot V7.8 · Ofrenda nocturna de referencia

## Overview

**Creative North Star: "La sucursal durante la ofrenda nocturna"**

Negro profundo, vino casi negro, filigrana roja luminosa y luz naranja de velas y cempasúchil definen la identidad. La captura de dashboard elegida por el usuario el 12 de octubre de 2026 sustituyó la interpretación sobria anterior. El sistema debe reproducir ese carácter ornamental con textos, controles, gráficas e importes funcionales.

El emblema 3D aprobado conserva su arte y proporción. Vollkorn aporta el carácter editorial de bienvenida, titulares e importes destacados del inicio y perfil; Archivo conserva precisión en formularios, navegación, tablas y caja. El acceso centrado mantiene su composición aprobada. Las escenas fotográficas quedan detrás del HTML y dejan oscuras las áreas de lectura.

La fuente final del marco operativo es `reference-dashboard.css`, cargada después de `cinematic.css`. Esta última conserva la paleta compartida y los controles generales; `ofrenda.css`, `sidebar.css`, `auth-scene.css` y `logo.css` aportan la base. La composición específica del inicio y la autoridad visual están en `.impeccable/surfaces/index-html.md` y `docs/REFERENCE_FIDELITY.md`.

**Key Characteristics:**

- Paneles negros y vino con bordes rojos luminosos y esquinas de filigrana.
- Acción naranja y dorada, navegación seleccionada en rojo y estados positivos en verde.
- Vollkorn en titulares y cifras destacadas; Archivo en operación y cifras tabulares.
- Logo 3D grande, papel picado diagonal y escenas de ofrenda en el marco.
- Sidebar de 290 o 260 px, carril de 76 px y cajón móvil; perfil propio accesible.
- Avatares circulares y tres modos de efectos con reducción de movimiento.

## Colors

Los colores del frontmatter registran valores usados en la cascada actual. Los prefijos compartidos `--bs-*` y auxiliares `--o-*` conviven con `--night-panel` y `--night-line` del marco de referencia. Las superficies pueden usar gradientes y transparencias; esos tratamientos completos viven en el sidecar.

### Primary

- **Rojo de filigrana** (`luminous-red`, `neon`, `night-line`): marcos, ornamentos, navegación seleccionada y luz del entorno.
- **Cempasúchil** (`orange`, `orange-soft`): acciones de caja, iconos, barras y detalles de temporada.
- **Dorado de vela** (`gold`): acción principal general, foco, precios y reconocimiento.

### Secondary

- **Verde positivo** (`success`): éxito confirmado, conexión, cuenta activa y métricas que lo emplean. No sustituye la lectura explícita del estado.

### Tertiary

- **Ciruela y vino** (`purple`, `wine`): profundidad y ambiente. Los acentos magenta y turquesa de las minigráficas distinguen series existentes.

### Neutral

- **Negro nocturno** (`ground`, `secondary`, `night-panel`): fondo y paneles de lectura.
- **Carbón vino** (`card`, `surface-2`, `surface-3`, `inset`): formularios, controles y estados de superficie.
- **Crema** (`text`, `cream-2`, `nav-text`, `nav-active-text`): títulos, navegación y texto.
- **Ceniza cálida** (`muted`): ayudas y metadatos; `line-2` conserva divisores secundarios.
- **Papel de ticket** (`ticket-paper`, `ticket-ink`): variante clara local del ticket.

**The Luz Roja Rule.** El rojo luminoso y la filigrana son parte esencial de la dirección elegida; deben conservarse en el marco y la selección de navegación.

**The Estado Legible Rule.** Cada color de estado acompaña texto o icono comprensible; la confirmación de una venta llega después de la respuesta del servidor.

## Typography

**Display Font:** Vollkorn, con Georgia y serif como respaldo. Se sirve desde `assets/fonts/Vollkorn.ttf`, pesos 400–900 y `font-display: swap`. Licencia en `assets/fonts/Vollkorn-OFL.txt`; procedencia oficial Google Fonts.

**Body Font:** Archivo variable, con fuentes de sistema como respaldo. Conserva los controles y la caja.

**Character:** Serif robusta y cálida en el marco ornamental; sans serif compacta para operar con rapidez. El acceso conserva la jerarquía Archivo aprobada.

### Hierarchy

- **Display:** bienvenida del inicio; usa el token `display`. Pasa a 36 px bajo 1100 px y a 29 px bajo 760 px.
- **Headline:** título del banner; usa `headline`. Pasa a 38 px en escritorio intermedio y a 33 px en móvil.
- **Title:** títulos de panel del inicio; usa `title`. Los títulos de panel de perfil usan 23 px.
- **Profile title:** encabezado de Mi perfil; usa `profile-title`, con 31 px bajo 600 px.
- **Metric:** importes destacados del inicio; usa `metric`. El perfil usa `clamp(24px, 2.1vw, 34px)` y 28 px bajo 600 px.
- **Body / Label:** controles, texto de operación y navegación. La navegación usa 13 px, peso 500 en reposo y 700 activa.
- **Total:** total principal de caja en Archivo. La caja auxiliar amplia usa Vollkorn a 31 px.

**The Cifra Real Rule.** Las cifras alineadas usan números tabulares y muestran el valor calculado real; los efectos no retrasan, ocultan ni alteran importes.

## Layout

El marco de escritorio usa sidebar de 290 px; entre 1101 y 1450 px usa 260 px. El carril plegado mantiene 76 px. Bajo 1101 px la navegación se convierte en cajón, con ancho máximo de 290 px y margen de seguridad respecto al viewport. La preferencia de plegado, nombres accesibles, ayudas al pasar o enfocar y control de foco se conservan.

El encabezado mide 68 px en escritorio, 66 px bajo 1101 px y 60 px bajo 761 px. La búsqueda alcanza 600 px en escritorio y se despliega desde un botón en móvil. El inicio usa margen izquierdo interno de 17 px y derecho de 24 px; la separación de bloques es de 14 px. Cuatro métricas independientes pasan a dos columnas bajo 1101 px. Equipo y empleado destacado pasan a una columna; en móvil el banner mantiene el arte y adapta la lectura vertical.

Mi perfil organiza identidad y contenido en dos columnas con separación de 24 px; bajo 901 px pasa a una columna. Las cuatro métricas comparten el periodo elegido y pasan a dos columnas bajo 1301 px. El encabezado de perfil se alinea al inicio entre 601 y 980 px. Las redes usan dos columnas de campos y una bajo 601 px. La caja auxiliar amplia usa catálogo y ticket lateral de 340 px desde 961 px; conserva la ventana compacta existente. Su revisión de cobro es de una columna y ancho máximo de 520 px.

Los valores `height` del frontmatter para controles y tarjetas describen mínimos observados cuando la implementación usa `min-height`; el contenido puede crecer. La geometría exacta del inicio de referencia es una regla de esa superficie, documentada en `docs/REFERENCE_FIDELITY.md`.

## Elevation & Depth

El sistema combina superficies negras translúcidas, gradientes vino y luz roja difusa. La luz recorre bordes y esquinas; el fondo aporta velas, flores y calaveras alrededor de la operación. Las sombras separan capas y acciones, manteniendo los campos y cifras legibles.

### Shadow Vocabulary

- **Hero:** luz interior roja y halo exterior alrededor del banner.
- **Navegación seleccionada:** resplandor interior y halo rojo bajo el elemento activo.
- **Panel de trabajo:** sombra negra difusa en controles generales.
- **Avatar destacado:** aro cálido y halo rojo, con corona separada en el empleado de la semana.

Los valores exactos, transiciones y puntos de quiebre están en `.impeccable/design.json`.

**The Luz Enmarcada Rule.** Los resplandores y ornamentos enmarcan la lectura y no interceptan clics; los motivos decorativos permanecen fuera del orden de foco.

## Shapes

Paneles suavemente redondeados, controles compactos y avatares circulares. Las esquinas de filigrana usan SVG y `border-image`; no forman parte del raster de fondo. El banner, las métricas y los paneles del inicio usan radios propios del frontmatter. La navegación activa mantiene su placa roja con borde naranja luminoso. El logo conserva su silueta original; el recorte circular pertenece a las fotos personales.

## Components

### Buttons

Acciones cálidas y precisas. El botón principal general mezcla dorado y naranja; el acceso conserva su altura de 48 px. El CTA del banner usa su variante cálida. Los secundarios mantienen superficie carbón vino. Hover ilumina el borde o aumenta levemente el brillo; foco visible usa aro dorado de 2 px y separación de 3 px. Las acciones deshabilitadas conservan texto legible y no responden.

### Chips

El selector Esta semana / Total es un grupo de botones con `aria-pressed`. La opción elegida usa vino rojo; la etiqueta de periodo confirma el rango de fechas o historial completo. Las categorías y etiquetas existentes conservan sus estados operativos.

### Cards / Containers

Paneles negros o vino casi negro con borde rojo y filigrana en los lugares del marco de referencia. Las métricas son cuatro placas separadas, cada una con icono, cifra y minigráfica calculada con datos disponibles. Los listados de equipo y actividad conservan filas compactas y divisores. Mi perfil usa una placa de identidad y paneles de contenido relacionados.

### Inputs / Fields

Campos oscuros con borde cálido, texto crema y foco dorado. Las redes sociales son opcionales y están dentro de un editor desplegable. Instagram, Discord, TikTok y Twitch muestran solo valores guardados de la cuenta; errores permanecen junto a la acción de guardar. Los formularios preservan lo escrito durante errores recuperables.

### Navigation

Logo aprobado grande sobre los grupos Operación y Gestión, placa seleccionada roja, promoción de ofrenda y cuenta inferior. El carril compacto conserva iconos, ayudas y un acceso directo a Mi perfil; la cuenta también abre el perfil. Más herramientas conserva los destinos adicionales y sus permisos. En móvil se usa cajón con Escape y retorno de foco.

### Profile and photo editor

Avatar circular con iniciales de respaldo. Las métricas Ventas activas, Total vendido, Mis comisiones y Ticket promedio usan el mismo periodo propio; se excluyen ventas anuladas y ajenas. El historial identifica el estado de cada venta. El editor de foto conserva recorte, zoom, reposición, vista circular, validación, progreso y eliminación.

### Effects and checkout

Cinematográfico, Equilibrado y Rendimiento tienen estado seleccionado visible y persistencia por cuenta. Se respeta `prefers-reduced-motion` y la pausa con pestaña oculta. La revisión de caja auxiliar muestra resumen, cliente, método de pago, nota y confirmación de pago en una columna. Cliente puede completarse al cobrar y es obligatorio para registrar.

## Do's and Don'ts

### Do:

- **Do** usar la cascada final de `reference-dashboard.css` para el marco de referencia.
- **Do** conservar negro, filigrana roja luminosa, acción cálida y selección roja.
- **Do** usar Vollkorn en titulares del inicio y perfil, y Archivo en controles y caja.
- **Do** conservar el arte y la proporción del logo 3D aprobado.
- **Do** mantener cifras tabulares, datos propios reales, foco visible y nombres accesibles.
- **Do** separar decoración de controles y respetar efectos por cuenta y movimiento reducido.
- **Do** documentar el prompt exacto de cada nuevo raster y la licencia de las fuentes.

### Don't:

- **Don't** restablecer la interpretación sobria ni la selección crema que la nueva referencia sustituyó.
- **Don't** redibujar, recolorear ni recortar el emblema aprobado.
- **Don't** insertar texto, cifras o controles dentro del arte ambiental.
- **Don't** inventar ventas, tendencias, fotografías, reconocimientos o fechas de incorporación.
- **Don't** animar cálculos financieros ni confirmar ventas antes del servidor.
- **Don't** presentar OCR ni un campo de importe recibido como parte de la caja auxiliar actual.
- **Don't** presentar pruebas simuladas como validación autenticada real entre dispositivos.
