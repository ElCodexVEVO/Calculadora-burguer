# Burger Shot 3D · Auditoría, plan e informe

Documento de trabajo de la transformación de la página principal en un restaurante 3D.
Base auditada: `Calculadora-burguer-main` (zip descargado del repositorio `ElCodexVEVO/Calculadora-burguer`, rama `main`, commit `b14c15886eb9e07e54db76e7be0d93c486a50220`).

---

## ETAPA 1 · Auditoría

### 1.1 Arquitectura real

| Aspecto | Estado verificado en el código |
|---|---|
| Framework | **Ninguno.** Sitio estático HTML/CSS/JavaScript sin compilación (`README.md`: «El sitio es estático y no necesita compilación»). |
| Lenguaje | JavaScript clásico en IIFE. **No hay TypeScript** en el frontend (solo en las Edge Functions de Supabase). |
| React / R3F / Drei | **No existen.** No hay `package.json` de la aplicación ni empaquetador. |
| Three.js | **Ya incluido**: `assets/vendor/three/three.module.min.js` (r170) con `GLTFLoader` y `BufferGeometryUtils`, resuelto mediante `importmap` en `index.html`. `season-scene.js` es un módulo 3D previo que actualmente no se carga. |
| Supabase | `@supabase/supabase-js@2` desde jsDelivr (versión mayor sin fijar) + `config.js` con URL y clave publicable. Un único cliente `sb` creado en `app.js`. |
| Escritorio | `desktop/` empaqueta la misma web con Electron. |
| Demos | `DEMO_V6.html` y `DEMO_ACCESO.html` se **generan** desde `index.html` con `node demo/build-demos.cjs`, sustituyendo Supabase por `demo/mock-supabase.js` + `demo/data.js` (sin red). |

**Patrón de módulos.** `app.js` guarda todo el estado (sesión, carrito, productos, convenios, ventas, empleados) dentro de un IIFE y monta módulos externos mediante `window.X.mount(api)`:

- `BurgerCompanion` (`companion.js`): caja auxiliar que comparte el carrito mediante ganchos (`add`, `quantity`, `setQuantity`, `options`, `clear`, `checkout`).
- `BurgerV6` (`v6-modules.js`): roles, clientes frecuentes y promociones; además **sobrescribe el cálculo** con `calculate()` cuando hay una promoción.
- `BurgerProfiles` (`profile.js`): fotografías privadas, efectos visuales y redes; pinta fotos en cualquier elemento con `data-profile-avatar`.

Este patrón es el punto de integración correcto para el restaurante: un módulo nuevo que recibe ganchos y **no recalcula nada**.

### 1.2 Rutas y páginas

No hay router: `switchPage(page)` muestra `#page-<page>` y comprueba `pagePermissions`.

| Página | Permiso |
|---|---|
| `dashboard` (Inicio) | — |
| `pos` (Caja), `companion` (Caja auxiliar, inyectada) | — |
| `mySales`, `analytics`, `profile` | — |
| `allSales`, `customers` | `view_reports` |
| `employees` | `manage_employees` |
| `payouts` | `manage_payouts` |
| `discounts`, `products` | `manage_catalog` |
| `audit` | `view_audit` |
| `promotions` | `manage_promotions` |
| `loyalty` | `manage_customers` |
| `administration`, `settings` | administrador |

`?auxiliar=1` abre la caja auxiliar en modo enfocado (no debe sobrescribirse).

### 1.3 Esquema de Supabase (parches acumulativos)

Tablas: `stores`, `profiles`, `products`, `discounts`, `sales`, `employee_payouts`, `audit_events`, `discord_deliveries`, `employee_of_week`, `pos_roles`, `customers`, `promotions`, `employee_appearance`. Buckets: `employee-week` (público), `employee-avatars` (privado, URL firmadas).

RLS: lectura para miembros activos de la tienda (`is_member`), escritura según `is_admin` / `has_permission(store, permiso)`. `sales_insert` exige `created_by = auth.uid()`.

Realtime actual: un canal `bs-v3-<store_id>` con `postgres_changes` que recarga datos. **No hay Presence.**

### 1.4 Autenticación, perfiles, roles y permisos

- Inicio de sesión por usuario o correo (`resolve_login_email` + `signInWithPassword`). Sesión persistida.
- Perfil obligatorio y activo; si no, se cierra la sesión.
- `profiles.role ∈ {admin, cashier}` + permisos `can_*` (sincronizados desde `pos_roles` por trigger).
- Frontend: `isAdmin()` y `can(permiso)`. Backend: las mismas reglas en RLS y triggers. **La interfaz nunca es la autoridad.**

### 1.5 Fórmulas de la calculadora (no se tocan)

Única fuente de verdad: **`calc()` en `app.js`**.

| Función | Entradas | Resultado |
|---|---|---|
| `calc()` | `cart` (id → cantidad), `products`, `#discountSelect`, `#clientType`, `profile.commission_percent` | `{lines, subtotal, d, client, blocked, disc, total, pct, earning}` |
| líneas | `lineTotal = price × qty` | |
| `convenioBlocked(d, client)` | exclusión de Policía/Sheriff/EMS y clientes exclusivos | `blocked` |
| `convenioEligible(d, line)` | `tag ≠ none` y alcance `all / burger / happybox / combos` | |
| `convenioDiscount(d, lines)` | porcentaje: `round(Σ elegibles × % / 100)`; precio especial: `round(Σ max(0, price − unit_price) × qty, 2 decimales)` | `disc` |
| `total` | `subtotal − disc` | |
| `earning` | `total × pct / 100` (vista previa; el valor definitivo lo fija la base de datos) | |
| `v6.calculate(c)` | si hay promoción vigente y permiso `apply_promotions`: sustituye `disc/total/earning/d` por `BurgerV6Core.discount()` | promoción no acumulable con convenios |

Convenio del 25 %: Talleres, Stop Car, Auto Exotic, Overspeed, Benny's, East Customs, Bandas, Cerberus y 506, **solo sobre Caja Feliz** (`scope = happybox`). Otros: precio especial por caja (SecuroServ $200, Bahamas Club $250), 10 %/5 % en hamburguesas, YKZ 10 % confidencial y Precio Sheriff ($200 por combo, solo Policía/Sheriff).

Servidor: `apply_sale_commission()` recalcula `commission_percent`, `employee_earnings = round(total × pct / 100, 2)` y `business_net`; `v6_validate_sale_promotion()` recalcula y rechaza importes de promociones manipulados; `guard_burgershot_sale_edit()` protege propietario, estado y corte.

Formato: `Intl.NumberFormat('es-MX', MXN, 0–2 decimales)`. No hay impuestos.

### 1.6 Flujo de creación de pedidos

1. Añadir productos (`addToCart`, máximo 9 999 por línea; confirmación a partir de 100 unidades).
2. Elegir tipo de cliente, convenio, promoción o cupón (opcional), plantilla (opcional).
3. `openCheckout()`: valida restricciones por tipo de cliente, muestra el resumen y guarda una **instantánea** del cálculo.
4. `saveSale()`: exige Cliente / ID, compara la instantánea (si la orden cambió obliga a revisar), bloquea el doble cobro (`saleSaving`), inserta en `sales`, notifica a Discord (`sale_created`), vacía el carrito y recarga. Si falla, **conserva la orden** y permite reintentar.

Edición (`saveSaleEdit`, permiso `edit_orders`, solo órdenes activas sin corte y sin promoción), anulación y borrado (administrador; borrado solo sin corte).

### 1.7 Otras funciones que se preservan

Ventas por empleado y ranking semanal, empleado de la semana, estadísticas y gráficas, historial de clientes, clientes frecuentes, promociones y cupones, convenios, productos, pagos/cortes (`create_employee_payout`), auditoría, administración de usuarios (`employee-admin`: crear, contraseña, activar/desactivar, borrar), perfiles con foto (`profile-photo`), redes, efectos visuales, plantillas de pedido, exportaciones CSV, webhooks de Discord (`sale_created`, `sale_updated`, `sale_voided`, `payout_created`).

### 1.8 Decisiones técnicas derivadas de la auditoría

| Especificación | Decisión | Motivo |
|---|---|---|
| React Three Fiber + Drei | **No se introducen.** | El proyecto no usa React ni compilación; añadirlos obligaría a reescribir la app. |
| Three.js | **Se reutiliza el r170 ya incluido** (importmap). | Cero dependencias nuevas, carga diferida con `import()`. |
| OrbitControls | **Cámara propia** con límites. | No está incluido y una cámara de juego de gestión con límites estrictos es más simple y predecible. |
| TypeScript | No se introduce. | No existe en el frontend. |
| Animaciones | Interpolación propia con `requestAnimationFrame`. | No hay librería de animación en el proyecto. |
| Modelos | Geometría procedural; organizada para sustituirla por GLB. | No hay modelos del restaurante ni de personajes. |
| Presencia | Supabase Realtime Presence en un canal propio. | La versión de supabase-js lo soporta; no necesita tablas ni migraciones. |

### 1.9 Riesgos y problemas previos (existían antes de los cambios)

1. `@supabase/supabase-js@2` se carga desde CDN sin versión exacta.
2. `app.js` declara dos veces `renderSaleDetail`, `openSale`, `saveSaleEdit`, `toggleEmployeeActive` y `openEmployee`; prevalece la última declaración.
3. `VERSION.json` indica 7.0.0 mientras el README describe V7.8 y los recursos usan `?v=12.0.0`.
4. Las pruebas de navegador en Python/Playwright (`tests/*.py`) y `tests/*-browser.cjs` no forman parte de `npm test`.
5. Los canales públicos de Realtime son accesibles a quien conozca el nombre del canal y la clave publicable. Por eso la presencia solo transmite identificadores (ver 3.3).

### 1.10 Línea base

- `node demo/build-demos.cjs` → correcto.
- `cd tests && npm ci && npm test` → **182 comprobaciones superadas, 0 fallos** (jsdom + PGlite, sin Supabase real).
- No se ejecutaron las pruebas Python/Playwright.

---

## Plan técnico

### Archivos nuevos

| Archivo | Responsabilidad (nombres de la especificación) |
|---|---|
| `restaurant.js` | `RestaurantNavigation`, `RestaurantInteractionLayer`, `CounterSalesPanel`: página, HUD, paneles, respaldo 2D, accesibilidad. Montado desde `app.js`. |
| `restaurant-presence.js` | `RestaurantPresenceManager`: Realtime Presence, normalización, deduplicación, reconexión y limpieza. Lógica pura testeable en Node. |
| `restaurant/scene.js` | Renderizador, bucle, selección por rayos, calidad adaptativa, errores WebGL. |
| `restaurant/building.js` | `RestaurantExterior`, `RestaurantInterior`, `RestaurantCounter`. |
| `restaurant/camera.js` | `RestaurantCamera`, `RestaurantEntranceTransition`. |
| `restaurant/lighting.js` | `RestaurantLighting`. |
| `restaurant/avatars.js` | `RestaurantAvatar`. |
| `restaurant/kit.js` | Materiales, texturas procedurales y caché de geometrías compartidas. |
| `restaurant.css` | Estilos del restaurante. |

### Cambios en archivos existentes

- `index.html`: hoja de estilos y dos scripts; entrada «Restaurante» y «Inicio» pasa a «Resumen».
- `app.js`: un montaje más y cuatro ganchos opcionales (`afterAuth`, `reset`, `render`, `refresh`). Las acciones del carrito que ya usa la caja auxiliar se comparten, sin cambiar su comportamiento.
- `demo/mock-supabase.js`: simulación de Presence (pestañas con `BroadcastChannel`) solo para las demos.
- `tests/package.json`: nuevas pruebas en `npm test`.

### Reglas de integración

- El mostrador **solo muestra** valores de `calc()` y opera mediante los mismos ganchos que la caja auxiliar; el cobro abre el `checkoutModal` existente y registra con `saveSale()`.
- El restaurante no escribe en la base de datos.
- Presencia mínima: `uid`, identificador de pestaña, hora, zona y si la pestaña está en segundo plano. Nombres, fotos y roles salen de `profiles` (RLS).
- Si WebGL falla, el mostrador y el equipo siguen disponibles en una vista 2D.

### Plan de pruebas

1. Lógica de presencia (Node): normalización, deduplicación, identidades desconocidas o inactivas, ciclo de canal, reconexión y limpieza.
2. Integración (jsdom): página por defecto, respaldo sin WebGL, entrada a interior, mostrador contra los escenarios de `regression.cjs` (convenio 25 %, hamburguesas, exclusiones, EMS), cobro por el modal existente, error conservando la orden y permisos del panel de personas.
3. Navegador: demo local en escritorio, tablet y móvil, movimiento reducido, varias pestañas con sesiones simuladas y consola sin errores.
4. Regresión completa: `npm test`.

---

## Informe de implementación (etapas 2 a 6)

### Qué hace ahora la página principal

1. **Tras iniciar sesión** se abre «Restaurante» (primera entrada del menú; «Inicio» pasa a llamarse «Resumen» y conserva todo el panel anterior).
2. **Entrada automática**: toma breve de la fachada con el neón encendiéndose, la cámara se acerca, las puertas se abren, atraviesa el acceso y se eleva hasta la vista isométrica; después aparecen personajes y etiquetas. No hay botones de «Entrar» (petición del usuario); solo «Omitir animación» mientras dura.
3. **Sin repetición innecesaria**: una recarga con la sesión guardada entra directamente; un inicio de sesión desde el formulario siempre muestra la entrada. Con movimiento reducido o modo Rendimiento se entra sin animación.
4. **Interior**: mostrador rojo y blanco con cajas, cocina (plancha, freidoras, campana, pasaplatos), zona de empleados (taquillas y mesa de descanso), comedor (reservados, mesas, barra) y entrada visible. Los tableros del menú muestran **productos y precios reales** del catálogo cargado.
5. **Cámara**: zoom, giro y desplazamiento con límites (no atraviesa muros ni pierde el local), restablecer vista, acercamiento al mostrador y a cada zona. Ratón, táctil (pellizco) y teclado (flechas, + / −, Q / E, 0).
6. **Personajes**: cuerpo completo articulado, uniforme de la marca, apariencia estable derivada del identificador del usuario, reposo animado, etiqueta con nombre, anillo de selección y ficha al seleccionarlos (foto de perfil si existe, rol solo para quien puede verlo, estado y hora de conexión).
7. **Actividad en vivo** (petición del usuario): «Tomando pedido» mientras hay productos en la orden y «Entregando comida» durante unos segundos tras registrar una venta. Al entregar, el personaje sale por la puerta de servicio con una bandeja, la deja en una mesa y vuelve a su puesto.
8. **Mostrador**: panel contextual con menú por categorías, orden, cantidades, Cliente / ID, tipo de cliente, convenio, totales y «Cobrar y registrar». Atajos a «Caja completa» (cupones, plantillas, cantidades grandes) y «Pedidos».
9. **Secciones**: menú compacto con todas las páginas existentes, filtrado con `pageAllowed()` de app.js.
10. **Respaldo 2D** si no hay WebGL, si se pierde el contexto gráfico o si el usuario elige «Vista simplificada»: mostrador, equipo y secciones siguen funcionando.

### Garantías sobre ventas y cálculos

- El mostrador **no contiene fórmulas**: muestra `calc()` y usa las mismas acciones que la caja auxiliar (`cartActions` en app.js). Cliente / ID, tipo de cliente y convenio se escriben en los controles originales de la caja.
- El cobro abre el `checkoutModal` existente; `saveSale()` conserva la instantánea, el bloqueo de doble cobro, el aviso a Discord y el comportamiento ante errores (la orden se conserva).
- Verificado contra los escenarios de `regression.cjs`: convenio 25 % ($285 y comisión $57), alcance hamburguesas ($310), exclusiones de servicios públicos ($380 con aviso), convenio inactivo oculto, Caja EMS restringida ($250) y cantidades grandes ($35,000). En la demo, el 25 % de Talleres sobre la Caja Feliz: $780 → $680, comisión $102, igual que la caja.
- El restaurante no escribe en la base de datos.

### Presencia en tiempo real

- Canal propio `bs-presence-<store_id>` con clave = `user.id`.
- Carga útil: `{ uid, tab, at, zone, away, activity }`. Nombres, fotos y roles salen de `profiles` (RLS) en cada cliente; los identificadores desconocidos, suplantados o de cuentas dadas de baja se ignoran.
- Varias pestañas del mismo usuario = un personaje. Al cerrar sesión o pestaña se retira (`untrack` + `removeChannel`); tras una reconexión se vuelve a publicar. Si Presence falla, solo se muestra la sesión propia y se indica el estado.
- La presencia es **solo visual**: no autoriza nada.

### Archivos

| Nuevos | Modificados |
|---|---|
| `restaurant.js`, `restaurant-presence.js`, `restaurant.css` | `app.js`: montaje del restaurante, acciones del carrito compartidas con la caja auxiliar (mismo código, ahora en `cartActions`) y llamadas opcionales `afterAuth`, `reset`, `render` y `refresh` |
| `restaurant/scene.js`, `building.js`, `camera.js`, `lighting.js`, `avatars.js`, `kit.js` | `index.html`: hoja de estilos, dos scripts, «Inicio» → «Resumen», versión de `app.js` |
| `tests/restaurant-presence.cjs`, `tests/restaurant-ui.cjs` | `demo/mock-supabase.js`, `demo/data.js`: presencia simulada (solo demos) |
| `docs/RESTAURANTE_3D.md` | `demo/build-demos.cjs` (versión de caché), `DEMO_V6.html` y `DEMO_ACCESO.html` (regenerados), `tests/package.json`, `README.md` |

**Carril de navegación (petición posterior del usuario):** `rail.css` y `rail.js` nuevos; `sidebar.js` deja el menú siempre en modo iconos en escritorio (≥ 1101 px), coloca el tooltip a la derecha del carril y no lo muestra dentro del panel «Más». Son los mismos botones de `index.html`, con sus manejadores y permisos; «Más herramientas» se abre como panel lateral y se añadió «Cerrar sesión» (pide confirmación). En móvil se conserva el menú deslizable.

Sin dependencias nuevas, sin migraciones, sin cambios en RLS, precios, convenios ni credenciales.

### Pruebas ejecutadas

- `npm test`: **211 superadas, 0 fallos** (182 previas + 12 de presencia + 17 de integración del restaurante).
- Navegador (demo local): escritorio, 800 px y móvil 375 × 812; entrada automática, entrada tras el formulario de acceso, mostrador y cobro completo, convenio 25 %, equipo conectado, dos pestañas con sesiones distintas sin duplicados, actividad con recorrido hasta la mesa, modo Rendimiento sin animación, sin desbordamiento horizontal y consola sin errores.

### No verificado

- **Supabase real**: no se inició sesión contra el proyecto real ni se probó Presence con el servidor de Realtime. La lógica está cubierta con un canal simulado.
- Pruebas históricas Python/Playwright (`tests/*.py`, `tests/*-browser.cjs`): no se ejecutaron (no forman parte de `npm test`).
- Electron (`desktop/`) y GPU integradas antiguas reales. La calidad baja y el respaldo 2D cubren esos casos.
- Local y personajes son geometría procedural; la estructura permite sustituirlos por GLB (una función por zona en `building.js`, `AvatarFactory` en `avatars.js`).

### Riesgos

1. Canal de presencia **público** por defecto: con la clave publicable y el `store_id` alguien podría ver qué identificadores están en línea (no nombres) o publicar presencia falsa, solo visual. Mitigación opcional: canal privado (abajo).
2. `@supabase/supabase-js@2` sin versión exacta (previo).
3. En equipos muy lentos la escena baja la resolución sola; si aun así va lenta, «Vista simplificada» o modo Rendimiento.

### Pasos manuales

1. Probar con dos cuentas reales en dos navegadores: aparecen, cambian de actividad y desaparecen al cerrar sesión.
2. (Opcional, recomendado) Canales privados de Realtime: desactivar el acceso público en Supabase → Realtime → Settings, crear políticas sobre `realtime.messages` que solo permitan presencia del tema `bs-presence-<store_id>` a miembros activos de esa tienda y añadir `presencePrivate: true` en `config.js`. Sin esas políticas no actives la opción: la presencia dejaría de conectar.
3. Publicar cuando lo decidas: no se hizo commit, push ni despliegue.
