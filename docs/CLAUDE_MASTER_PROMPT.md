# Prompt para Claude · Burger Shot

Actúa como diseñador de producto, especialista en animación web e ingeniero frontend. Continúa mejorando Burger Shot desde su versión actual, con acabado profesional y fidelidad a la referencia aprobada. Trabaja sobre el proyecto existente y entrega cambios implementados, verificados y documentados.

## Proyecto y estado que debes comprobar primero

- Repositorio: https://github.com/ElCodexVEVO/Calculadora-burguer
- Checkout local: `C:/Users/Mateo/Documents/ChatGPT/burguershot/github-upload`.
- Rama de trabajo: `codex/cinematic-profiles`. El PR #11 de V7.7 ya está integrado; consulta el PR actual de V7.8 y sus commits antes de trabajar. Conserva mis cambios locales y protege `main`; no hagas reset, force push ni merges automáticamente.
- Stack: HTML, CSS y JavaScript vanilla, Supabase y Electron. Conserva la arquitectura y la lógica financiera. No migres el producto a React ni añadas un framework para obtener efectos visuales.
- Lee `PRODUCT.md`, `DESIGN.md`, `.impeccable/surfaces/index-html.md`, `docs/REFERENCE_FIDELITY.md`, `docs/CINEMATIC_DIRECTION.md`, `docs/CINEMATIC_QA.md` y `docs/PROFILE_DEPLOYMENT.md`.
- La referencia visual autoritativa es `C:/Users/Mateo/AppData/Local/Temp/codex-clipboard-86a09005-98cd-413b-a927-3e1cad5216fc.png`. Respeta su composición, no la reduzcas a una inspiración de colores. Si no está disponible, usa las capturas finales en `C:/Users/Mateo/Documents/ChatGPT/burguershot/.visual-review/` y pide la referencia solo si te impide reproducir un detalle esencial.
- El repositorio conserva copias de las capturas y sus dimensiones en `docs/screenshots/v7-8/`, disponibles también al clonar en otro equipo.

## Dirección visual obligatoria

Conserva Día de Muertos y Halloween: negro profundo, rojo neón ornamentado, naranja de cempasúchil, crema legible, velas, calaveras, calabazas, palmeras nocturnas y papel picado. Usa el logo 3D aprobado, no lo sustituyas ni lo reconstruyas por iniciativa propia.

El inicio tiene logo grande en el sidebar, selección roja luminosa, promoción de temporada ilustrada, búsqueda superior, bienvenida serif, reloj, banner con pan de calavera y papas decoradas, cuatro indicadores separados, ranking, empleado de la semana y actividad semanal. Sigue la jerarquía y las proporciones medidas de la referencia. Vollkorn es el display; Archivo es la tipografía operativa.

El acceso centrado, el formulario y el logo ya están implementados. Mantén su temática y evita reincorporar la leyenda inferior de temporada que retiré. No conviertas la interfaz en una imagen: todos los controles, textos, cifras y gráficos deben seguir siendo reales y accesibles.

## Funciones que ya existen y debes preservar

1. Sidebar expandido/contraído, nombres accesibles, tooltips, acceso directo al perfil en el carril y cajón móvil.
2. Fotografías propias con recorte, zoom, arrastre, vista previa, guardado privado, eliminación y respaldo con iniciales. No inventes retratos, fechas de incorporación ni reconocimientos.
3. Mi perfil con Instagram, Discord, TikTok y Twitch opcionales. Instagram/TikTok/Twitch usan enlaces HTTPS seguros; Discord muestra y permite copiar el usuario. Solo cada cuenta puede guardar sus propias redes. Vaciar un campo elimina esa red.
4. Mi rendimiento con dos vistas: Esta semana y Total. Cada vista muestra ventas activas, total vendido, comisiones y ticket promedio del mismo periodo y de la misma persona. Excluye ventas anuladas y ajenas. Semana de lunes a domingo en hora local.
5. Caja auxiliar sencilla: catálogo y ticket en escritorio; ventana compacta conservada. El checkout contiene resumen, cliente obligatorio al registrar, método de pago, nota opcional y confirmación manual del pago. No reincorpores OCR, lectura de capturas ni importe recibido. Las plantillas son opcionales y están plegadas.
6. Cálculos, convenios, descuentos, cupones, promociones, restricciones, permisos, auditoría, cortes y notificaciones existentes. Conserva bloqueo de doble registro, recuperación tras errores y revisión cuando cambia el precio.
7. Efectos Cinematográfico, Equilibrado y Rendimiento por cuenta, reducción de movimiento y pausa al ocultar la pestaña. El movimiento nunca debe impedir cobrar ni leer.

Supabase ya tiene activados `supabase_patch_v7_7_appearance.sql`, `profile-photo` y `supabase_patch_v7_8_socials.sql`. Verifica el esquema antes de proponer otra migración. La comprobación de redes propia/ajena se hizo con rol autenticado en una transacción revertida. El ciclo completo de fotografía autenticada entre dos dispositivos sigue sin acreditarse: no lo des por probado porque pase un mock.

## Mejoras que debes abordar

Primero ejecuta la aplicación y audita el resultado actual. Corrige los problemas visibles y funcionales que encuentres; preserva los detalles aprobados. Prioriza:

- Fidelidad de composición y acabado a la referencia, incluso en ventanas estrechas. Ningún título, cifra, control ni avatar debe quedar cortado o tapado por decoración.
- Animación coordinada del logo con flotación suave y sombra de contacto, sin saltos ni halos desproporcionados. Conserva una versión estática cuando se reduzca el movimiento.
- Movimiento ambiental convincente de pétalos, papel picado y luz de velas; profundidad en capas sin invadir los datos. Evita destellos bruscos y exceso de bucles simultáneos.
- Transiciones útiles al navegar, agregar productos, actualizar cantidades y confirmar una venta. Muestra éxito solo después de la respuesta del servidor.
- Estados de carga, error, vacío, hover y foco con el mismo acabado visual. Cuida selectores nativos, menús, teclado y áreas táctiles.
- Rendimiento: imágenes optimizadas, carga diferida donde corresponda y efectos que se detengan fuera de pantalla. No cargues WebGL o vídeo pesado en cada tarjeta.

Si un render 3D o un clip mejora materialmente un área, prodúcelo como recurso aislado y optimizado. Comprueba primero que Blender/Remotion y sus dependencias estén disponibles: una skill instalada no sustituye al runtime. No alteres la marca ni inventes productos para justificar usar una herramienta.

## Uso de las skills instaladas

Abajo está el inventario leído del disco. Comprueba cuáles sigue exponiendo Claude y lee el `SKILL.md` relevante antes de aplicarlo. Inclúyelas en tu planificación, pero usa cada una donde aporte: no fuerces todas en la página ni abras trabajos ajenos al punto de venta.

- Dirección, acabado y revisión: `impeccable`, `emil-design-eng`, `web-design-guidelines`.
- Calidad web: `accessibility`, `best-practices`, `performance`, `core-web-vitals`, `web-quality-audit`, `webapp-testing`; SEO solo donde corresponda a una superficie pública, sin indexar información privada.
- Movimiento web: `animation-quality-gate`, `texture-state-animation`, `threejs-shaders` y `orbital-hud-motion` si aportan a un efecto concreto. No conviertas el dashboard en un HUD de ciencia ficción.
- Blender: empieza por el flujo profesional y la coordinación de skills; usa análisis de referencia, modelado, materiales, iluminación, cámaras, texturizado, animación, render y exportación según el recurso. Los ajustes UV, multivista y reparación son condicionales a una necesidad real.
- Remotion: documentación y buenas prácticas primero; creación, multimedia, estudio, interactividad y render cuando se necesite un clip. Captions, maps, SaaS, markup y upgrade solo si la tarea concreta los requiere. Remotion no reemplaza la interfaz vanilla.
- Skills de documentos y hojas: úsalas para entregables solicitados, no para añadir integraciones ni transmitir información del negocio.

Respeta los pasos de análisis, implementación, revisión y documentación de Impeccable. Si una captura mía contradice el resultado, úsala como evidencia principal. Registra la procedencia y los prompts exactos de los recursos nuevos. Haz revisiones acotadas con correcciones agrupadas, no un bucle interminable de retoques.

## Verificación y entrega

- Ejecuta `node demo/build-demos.cjs` cuando cambie `index.html`; no edites las demos a mano. Las demos usan datos simulados y deben indicarlo.
- Ejecuta `npm test` desde `tests`. Hay 182 escenarios en la versión de partida; no elimines pruebas para conseguir un resultado verde. Añade pruebas cuando cambie una regla, autorización, persistencia o flujo de cobro.
- Revisa en navegador escritorio, móvil y un tamaño intermedio. Comprueba el menú compacto, perfil, redes, los dos periodos y checkout auxiliar. Captura las vistas reales y valida que correspondan a su viewport; no presentes una captura recortada como completa.
- No uses cifras decorativas ni tendencias inventadas en producción. Las minigráficas provienen de las ventas disponibles.
- Documenta cambios, pruebas y límites reales. Distingue verificación simulada, validación cloud y ciclo autenticado entre dispositivos.
- Al terminar, sube la rama y actualiza el PR con una descripción del resultado final, capturas y validación. No publiques secretos ni modifiques credenciales, RLS o acceso público para simplificar una prueba. No envíes correos, mensajes de Discord ni otras comunicaciones de prueba por iniciativa propia.

Empieza inspeccionando el proyecto y las referencias. Haz el trabajo necesario y entrega un resultado concreto, no únicamente una lista de recomendaciones.

## Inventario completo de skills encontrado

Inventario local: 63 archivos `SKILL.md`, comprobados el 13 de octubre de 2026. Las skills sincronizadas pueden requerir herramientas que no estén conectadas en Claude Code.

- `accessibility` — `~/.claude/skills/accessibility/SKILL.md`
- `animation-quality-gate` — `~/.claude/skills/animation-quality-gate/SKILL.md`
- `atlas-uv-fitting` — `~/.claude/skills/atlas-uv-fitting/SKILL.md`
- `best-practices` — `~/.claude/skills/best-practices/SKILL.md`
- `blender-animation` — `~/.claude/skills/blender-animation/SKILL.md`
- `blender-cameras` — `~/.claude/skills/blender-cameras/SKILL.md`
- `blender-export` — `~/.claude/skills/blender-export/SKILL.md`
- `blender-lighting` — `~/.claude/skills/blender-lighting/SKILL.md`
- `blender-materials` — `~/.claude/skills/blender-materials/SKILL.md`
- `blender-modeling` — `~/.claude/skills/blender-modeling/SKILL.md`
- `blender-pro-workflow` — `~/.claude/skills/blender-pro-workflow/SKILL.md`
- `blender-rendering` — `~/.claude/skills/blender-rendering/SKILL.md`
- `blender-skill-harmonizer` — `~/.claude/skills/blender-skill-harmonizer/SKILL.md`
- `blender-uv-texturing` — `~/.claude/skills/blender-uv-texturing/SKILL.md`
- `closed-surface-uv-coverage` — `~/.claude/skills/closed-surface-uv-coverage/SKILL.md`
- `contour-to-mesh` — `~/.claude/skills/contour-to-mesh/SKILL.md`
- `core-web-vitals` — `~/.claude/skills/core-web-vitals/SKILL.md`
- `emil-design-eng` — `~/.claude/skills/emil-design-eng/SKILL.md`
- `find-skills` — `~/.claude/skills/find-skills/SKILL.md`
- `fit-repair-optimizer` — `~/.claude/skills/fit-repair-optimizer/SKILL.md`
- `impeccable` — `~/.claude/skills/impeccable/SKILL.md`
- `landmark-fit-repair` — `~/.claude/skills/landmark-fit-repair/SKILL.md`
- `mascot-logo-reconstruction` — `~/.claude/skills/mascot-logo-reconstruction/SKILL.md`
- `multiview-constraint-solver` — `~/.claude/skills/multiview-constraint-solver/SKILL.md`
- `multiview-fit-loop` — `~/.claude/skills/multiview-fit-loop/SKILL.md`
- `orbital-hud-motion` — `~/.claude/skills/orbital-hud-motion/SKILL.md`
- `orthographic-registration` — `~/.claude/skills/orthographic-registration/SKILL.md`
- `performance` — `~/.claude/skills/performance/SKILL.md`
- `quality-refinement-autoloop` — `~/.claude/skills/quality-refinement-autoloop/SKILL.md`
- `reference-analysis-validator` — `~/.claude/skills/reference-analysis-validator/SKILL.md`
- `reference-look-calibration` — `~/.claude/skills/reference-look-calibration/SKILL.md`
- `reference-to-3d` — `~/.claude/skills/reference-to-3d/SKILL.md`
- `remotion-best-practices` — `~/.claude/skills/remotion-best-practices/SKILL.md`
- `remotion-captions` — `~/.claude/skills/remotion-captions/SKILL.md`
- `remotion-create` — `~/.claude/skills/remotion-create/SKILL.md`
- `remotion-docs` — `~/.claude/skills/remotion-docs/SKILL.md`
- `remotion-interactivity` — `~/.claude/skills/remotion-interactivity/SKILL.md`
- `remotion-maps` — `~/.claude/skills/remotion-maps/SKILL.md`
- `remotion-markup` — `~/.claude/skills/remotion-markup/SKILL.md`
- `remotion-multimedia` — `~/.claude/skills/remotion-multimedia/SKILL.md`
- `remotion-render` — `~/.claude/skills/remotion-render/SKILL.md`
- `remotion-saas` — `~/.claude/skills/remotion-saas/SKILL.md`
- `remotion-studio` — `~/.claude/skills/remotion-studio/SKILL.md`
- `remotion-upgrade` — `~/.claude/skills/remotion-upgrade/SKILL.md`
- `seo` — `~/.claude/skills/seo/SKILL.md`
- `source-part-segmentation` — `~/.claude/skills/source-part-segmentation/SKILL.md`
- `docs` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/docs/SKILL.md`
- `docx` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/docx/SKILL.md`
- `google-workspace` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/google-workspace/SKILL.md`
- `import-memory` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/import-memory/SKILL.md`
- `morning` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/morning/SKILL.md`
- `pdf` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/pdf/SKILL.md`
- `pptx` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/pptx/SKILL.md`
- `skill-creator` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/skill-creator/SKILL.md`
- `xlsx` — `~/.claude/skills/synced/56055e5f-8a37-42da-9fbb-95dc308f8fc2_3b68e2ce-6fa8-4333-a936-321ca432f1a2/xlsx/SKILL.md`
- `text-to-blender` — `~/.claude/skills/text-to-blender/SKILL.md`
- `texture-driven-mesh-fitting` — `~/.claude/skills/texture-driven-mesh-fitting/SKILL.md`
- `texture-state-animation` — `~/.claude/skills/texture-state-animation/SKILL.md`
- `threejs-shaders` — `~/.claude/skills/threejs-shaders/SKILL.md`
- `web-design-guidelines` — `~/.claude/skills/web-design-guidelines/SKILL.md`
- `web-quality-audit` — `~/.claude/skills/web-quality-audit/SKILL.md`
- `webapp-testing` — `~/.claude/skills/webapp-testing/SKILL.md`
- `wireframe-to-3d` — `~/.claude/skills/wireframe-to-3d/SKILL.md`
