# Reproducción del inicio elegido

La captura adjunta `codex-clipboard-86a09005-98cd-413b-a927-3e1cad5216fc.png` (1672 × 941), elegida por el usuario el 12 de octubre de 2026, es la autoridad visual. El usuario rechazó la interpretación sobria previa y pidió una reproducción cercana. Se mantiene una interfaz funcional desde código sobre el producto existente.

## Mapa de referencia

| Región a 1672 × 941 | Composición elegida | Medio implementado |
| --- | --- | --- |
| Sidebar, x0–290 | Logo grande, selección roja luminosa, operación/gestión, promoción de ofrenda y cuenta | HTML, emblema aprobado y `season-altar-card.webp` |
| Entorno | Luna arriba, palmeras, velas/flores/calaveras en los bordes | `dashboard-night.webp` |
| Cabecera, x307/y15 | Búsqueda amplia y cuenta a la derecha | HTML |
| Bienvenida, y80–150 | Titular serif y reloj a la derecha | HTML y datos del producto |
| Héroe, x307/y167, 1340 × 254 | Texto serif, énfasis rojo, burger con calavera, papas y marco rojo | HTML, `traditions-feast.webp` y filigrana SVG |
| Indicadores, y435–526 | Cuatro placas independientes con iconos y minigráficas | HTML y SVG calculados con ventas disponibles |
| Equipo y empleado, y540–762 | Ranking compacto, retrato destacado, serif y flores | HTML, fotos o iniciales y ambiente |
| Actividad, desde y772 | Gráfica semanal visible en el primer viewport | HTML y datos existentes |

La cascada final se define en `reference-dashboard.css`, cargada después de `cinematic.css`. Vollkorn se sirve desde `assets/fonts/Vollkorn.ttf`; Archivo permanece en los controles. La licencia está en `assets/fonts/Vollkorn-OFL.txt`.

## Adaptaciones funcionales

Importes, usuarios, fotos y ventas pertenecen al producto o a la demo indicada; no se copian cifras ficticias de la captura. Iniciales respaldan empleados sin foto. La demo conserva un aviso breve de datos simulados. Ajustes, Mi perfil y destinos adicionales siguen en Más herramientas y la cuenta.

La sidebar usa 290 px en escritorio grande, 260 px entre 1101 y 1450 px y 76 px plegada. El carril compacto conserva un acceso directo a Mi perfil. En móvil, la navegación es cajón, las métricas se agrupan en dos columnas y el contenido pasa a una columna. El acceso centrado conserva su composición aprobada.

Mi perfil añade redes opcionales propias y un selector Esta semana / Total que aplica a las cuatro métricas sin ventas anuladas ni ajenas. La caja auxiliar amplia usa catálogo/ticket y mantiene su ventana compacta. Su revisión es de una columna y no incorpora OCR ni importe recibido.

Los efectos respetan `prefers-reduced-motion`, pestaña oculta y los tres modos por cuenta. No alteran importes ni confirmaciones del servidor.

## Procedencia

| Recurso nuevo | Uso | Registro exacto |
| --- | --- | --- |
| `assets/season/dashboard-night.webp` | Entorno oscuro con ofrenda en los extremos | `dashboard-night.webp.json` |
| `assets/season/traditions-feast.webp` | Banner de comida con calavera y papas | `traditions-feast.webp.json` |
| `assets/season/season-altar-card.webp` | Promoción lateral y ambiente del empleado | `season-altar-card.webp.json` |

Los sidecars guardan el prompt exacto de generación y su fecha; los rasters son placas de ambiente, sin controles ni texto de interfaz. El marco de filigrana y papel picado se dibuja con SVG. El arte del emblema aprobado no se modificó.

## Evidencia y estado

En el viewport lógico de 1672 × 941 se midió el héroe en x307/y169, altura 255 px, y el inicio de actividad semanal en y774. Esto verifica geometría DOM cercana a las regiones objetivo; no demuestra por sí solo fidelidad visual de todas las regiones.

Las [diez capturas finales versionadas](screenshots/v7-8/README.md) cubren Inicio, sidebar compacta, perfil, auxiliar y cobro en escritorio 1240 × 900; Inicio, perfil y cobro en móvil 390 × 844; y perfil/auxiliar en tablet 820 × 1000. Cada una conserva su sidecar de origen y dimensiones; la tabla completa está en [QA](CINEMATIC_QA.md). Se recapturaron con CSS 7.8.4 tras corregir alineación del encabezado de perfil y ampliar los textos funcionales señalados. Los bitmaps pueden estar ligeramente escalados. No se dispone de screenshot completo a 1672 px; no se afirma comparación visual pixel a pixel a ese tamaño.

La revisión completa confirmó tipografía, material, composición, navegación, banner, métricas, perfil, auxiliar y adaptaciones declaradas; solicitó dos ajustes. Tras corregirlos y recapturar las diez vistas, la confirmación emitió **VERDICT PASS — `disposition: ship`** para ambos puntos resueltos, sin regresiones visibles. Este resultado cubre esos ajustes y no acredita coincidencia pixel a pixel a 1672 px ni una aprobación universal. El antiguo `ship` de la dirección sustituida no se usa como evidencia. Pruebas, activación cloud y límites: [CINEMATIC_QA.md](CINEMATIC_QA.md).
