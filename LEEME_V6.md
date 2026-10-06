# Actualización V6.5 · Animaciones y convenios vigentes

## Qué cambia

- **Logo animado.** El emblema hamburguesa-calavera (`assets/burgershot-muertos.webp`) entra con un rebote y flota suavemente. Tiene un halo de cempasúchil, un brillo que lo recorre y gotas de queso que caen. Al pasar el cursor se sacude y al hacer clic suelta pétalos. El nombre «SHOT» también brilla.
- **Papel picado vivo.** Las banderas usan rosa, naranja y morado, con calabazas, calaveras y flores. Caen al cargar, ondean con el viento y reciben ráfagas que recorren la cuerda. La luz de vela parpadea a través de los recortes, y una bandera se columpia al pasar el cursor. Caen pétalos por la cabecera.
- **Caja.** Las tarjetas aparecen escalonadas al cambiar de categoría, y la foto de un producto agregado vuela hasta «Tu pedido». Las líneas nuevas entran deslizándose y los totales hacen un pequeño pulso al cambiar. El botón de cobro tiene un destello.
- Todas las animaciones se desactivan en **Ajustes → Animaciones** y respetan el movimiento reducido del sistema.

## Convenios

Un convenio ahora puede ser **porcentaje** o **precio especial por unidad**. Su alcance puede ser todo el menú, hamburguesas, Caja Feliz o **combos**. Además, puede ser **exclusivo** para Policía, Sheriff o EMS. Lista que aplica el parche:

| Convenio | Beneficio | Aplica en |
|---|---|---|
| Talleres, Stop Car, Auto Exotic, Overspeed, Benny's, East Customs, Bandas, Cerberus, 506 | 25% | Caja Feliz |
| SecuroServ | Caja Feliz a $200 | Caja Feliz |
| Bahamas Club | Caja Feliz a $250 | Caja Feliz |
| Redline Mechanics, Top Speed, Empresa de Eventos, 503, Kraken | 10% | Hamburguesas |
| EVO Motors | 5% | Hamburguesas |
| YKZ (confidencial) | 10% | Todo el menú |
| Precio Sheriff (solo Policía y Sheriff) | Combos a $200 | Combos |

Las Cajitas Felices EMS y Policía siguen a $250, son exclusivas de su servicio y no reciben convenios. Los paquetes 5×4 del menú Sheriff cuestan lo mismo que el mayoreo actual, así que no requieren convenio.

## Actualizar desde V6.4

1. Ejecuta **supabase_patch_v6_5_convenios.sql** completo en el editor SQL de Supabase. Añade los campos nuevos y aplica la lista anterior. Los convenios que no estén en ella **se desactivan, no se borran**. Las ventas pasadas conservan su importe. Volver a ejecutarlo restablece la lista oficial.
2. Copia `index.html`, `app.js`, `companion.js`, `festival.css`, `festival.js`, `motion.css`, `motion.js` y `assets/burgershot-muertos.webp`. **Conserva tu config.js**. Recarga con Ctrl+F5.

Sin el parche, la caja sigue funcionando con los convenios por porcentaje. El editor avisa si intentas guardar un precio especial o un convenio exclusivo.

## Revisión

Las 9 suites existentes siguen pasando. La nueva `tests/v6-5-convenios-db.cjs` verifica el parche en PostgreSQL local (PGlite) con 9 comprobaciones. En la demo se comprobaron los importes de cada tipo de convenio, el editor y las animaciones sin errores de JavaScript. No se ejecutó en tu Supabase real.

---

# Actualización visual V6.4 · Logo spooky

El nuevo emblema integra una calavera de Día de Muertos en la hamburguesa, con flores de cempasúchil, colores ámbar y hueso, sello ciruela y fondo transparente. Se acompaña con un nombre en tipografía serif en la cabecera, el acceso y la caja auxiliar. También aparece en las órdenes vacías y como icono de la pestaña.

La composición festiva V6.3 conserva el encabezado con calaveras, velas y papel picado animado; las fotografías grandes; y el ticket crema de V6.2. Las 20 imágenes originales del menú siguen en el paquete. La portada fotográfica, métricas, cliente y empleado de la semana permanecen en Inicio.

## Probar la versión

Extrae todo el ZIP y abre **DEMO_V6.html**. Usa datos de ejemplo en memoria; recargar restablece la demo. Las capturas actuales están en **preview/**. El emblema transparente está en **assets/burgershot-spooky.png** y el prompt de diseño en **design/LOGO_PROMPT.txt**.

## Actualizar desde V6.3

Copia `index.html`, `DEMO_V6.html`, `companion.js`, `spooky.css` y `assets/burgershot-spooky.png` a tu alojamiento. **Conserva tu config.js configurado**. Recarga con Ctrl+F5.

Si vienes de V6, V6.1 o V6.2, copia también `premium.css`, `atelier.css`, `atelier.js`, `festival.css`, `festival.js` y el resto de `assets/`. Esta revisión no requiere una migración SQL ni otro despliegue de funciones respecto de V6. Si vienes de V5.5, sigue las instrucciones de migración de V6 incluidas abajo.

## Revisión

Se verificaron la carga del nuevo logo en la demo, caja auxiliar, orden vacía y configuración inicial, además de la cabecera entre 320 y 1600 px. No se encontraron solapamientos del nombre con los botones ni desbordamiento horizontal. La demo mantuvo un pedido de $380 sin errores de JavaScript. Resultados en `tests/visual-v6-4-results.json`.

---

# Burger Shot V6 · Halloween y Día de Muertos

Mejora sobre tu proyecto V5.5: conserva la sesión, ventas, comisiones, productos, convenios, cortes, OCR y caja auxiliar existentes. No incluye un módulo de sucursales.

## Primero, mira el resultado

Abre **DEMO_V6.html** después de extraer todo el ZIP. Funciona con datos de ejemplo guardados solo en memoria: no se conecta a Supabase ni crea ventas reales. Puedes probar el menú, pedidos, cupones, administración, roles, clientes y promociones. Recargar restablece la demo.

En **preview/** encontrarás capturas de escritorio y móvil del programa funcionando. Las imágenes del menú son las 20 que adjuntaste, copiadas sin generación ni modificación gráfica. Se mantiene el logo 3D que ya contenía el proyecto.

## Actualizar tu página actual

1. Conserva una copia de tu instalación y de tu `config.js` configurado. El `config.js` de este paquete está vacío: **no lo copies encima del tuyo**.
2. Si tu base ya tiene V5.5, ejecuta **supabase_patch_v6.sql** completo en el editor SQL de tu proyecto Supabase. Se puede repetir y no borra tus ventas, cuentas ni cortes.
3. Actualiza el código de la función **employee-admin** con el archivo `supabase/functions/employee-admin/index.ts` incluido y vuelve a desplegarla. La nueva versión impide que un usuario delegado cree administradores o gestione cuentas con privilegios elevados. La función `discord-notify` permanece igual.
4. Copia `index.html`, `app.js`, `v6-core.js`, `v6-modules.js`, `premium.css`, las hojas CSS existentes, `companion-core.js`, `companion.js` y **assets/** al mismo alojamiento que usas. Mantén tu configuración de Supabase.
5. Recarga con Ctrl+F5, inicia sesión como administrador y entra en **Administración → Permisos por rol**. Asigna Gerente, Supervisor o Cajero a cada persona que quieras gestionar mediante un rol.
6. Crea una promoción de prueba, revisa un pedido y comprueba el total antes de operar con tu equipo.

No hace falta crear otra base ni volver a crear los empleados. Si falta el parche V6 o hay un error al consultar sus tablas, se avisa en los módulos nuevos y la caja antigua continúa disponible. Las funciones nuevas no simulan guardados exitosos.

### Si partes desde cero o faltan versiones

Ejecuta en este orden: `supabase_schema_v3.sql`, `supabase_patch_v4_2.sql`, `supabase_patch_v5_1.sql`, `supabase_patch_v5_2.sql`, `supabase_patch_v5_3_discord.sql`, `supabase_patch_v5_4_quantities.sql`, `supabase_patch_v5_5_employee_week.sql` y `supabase_patch_v6.sql`. Configura Auth y las Edge Functions según el README anterior. Usa únicamente la clave pública en `config.js`.

### Abrir en Windows

Para la demo basta abrir `DEMO_V6.html`. Para probar la aplicación conectada, abre CMD en esta carpeta y ejecuta:

```cmd
py -m http.server 8000 --bind 127.0.0.1
```

Visita `http://localhost:8000`. No necesitas compilar el frontend.

## Qué cambia

- Header con logo 3D, búsqueda, actividad reciente y perfil; navegación y checkout rediseñados.
- Tema oscuro con naranja cálido y púrpura, fotos del menú, tablas legibles, estados de foco y controles coherentes.
- Diseño adaptable, transiciones suaves y opción de desactivar animaciones. Respeta la preferencia de movimiento reducido del sistema.
- Administración: tabla con nombre, usuario, correo de acceso, rol, estado y último acceso; búsqueda y filtros; creación y gestión de cuentas.
- Permisos por rol: Gerente, Supervisor y Cajero editables; Administrador protegido. Guardar un rol actualiza los permisos de todos sus integrantes en una sola transacción.
- Clientes frecuentes: ficha con nombre, identificador, teléfono, categoría, notas, beneficio y últimas compras.
- Promociones: porcentaje, monto fijo, 2×1 y precio especial de combo, con código opcional, vigencia, filtros, edición, pausa y eliminación.
- Auditoría ampliada: cambios en roles, clientes y promociones; inicio de sesión desde Auth; búsqueda por responsable o registro y filtros existentes.
- Cliente de la semana calculado con ventas activas, además del empleado de la semana, gráficas y estadísticas anteriores.

## Reglas de uso importantes

**Roles.** Las cuentas existentes mantienen sus permisos individuales hasta que les asignes un rol. Usar “Guardar” en el editor de permisos individuales retira la asignación de rol de esa cuenta. Asignar un rol vuelve a sustituir sus permisos por los de ese perfil. Caja y ventas propias siguen siendo capacidades básicas de una cuenta activa; la matriz administra las nueve capacidades adicionales que el backend puede exigir.

**Correos.** La tabla muestra el correo de acceso que ya utiliza Auth; puede ser el correo técnico generado para un empleado. No inventa un correo personal. El último acceso comienza a registrarse en el siguiente inicio de sesión tras instalar V6; los accesos antiguos sin registro muestran “Sin registro”.

**Clientes.** Las compras se relacionan por coincidencia del campo Cliente / ID. Usa el mismo identificador al cobrar para acumular su historial. Teléfono y notas no se deducen de ventas. El beneficio es una anotación administrativa; el operador debe seleccionar su convenio o introducir el cupón correspondiente. No se descuenta dinero solo por escribir una nota en la ficha.

**Promociones.** Se aplica una promoción por pedido, sin acumularla con un convenio. Los productos con etiqueta `none` quedan excluidos. 2×1 aplica por pares del mismo producto; un combo especial requiere un producto de la categoría Combos. El descuento fijo nunca supera el importe elegible. Los códigos no tienen un máximo de usos en esta versión; su control es por estado y vigencia. La base verifica permisos, código, hora, restricciones de producto, precios y total; si cambió un importe desde la vista previa, rechaza el cobro y pide sincronizar.

**Correcciones.** Una venta promocional conserva sus importes e identificación de campaña aunque esta se edite o elimine. Para cambiar sus productos o descuento, anúlala y registra una nueva. Las ventas normales conservan la edición existente. Los cortes pagados siguen protegidos.

**Estado cloud.** Los cambios de tablas V6 están inscritos en Realtime. Si la conexión no recibe eventos, el botón Sincronizar vuelve a consultar los datos. La demo siempre se identifica como datos de demostración.

## Verificación y alcance

Ver **VERIFICACION_V6.md**. Se verificó localmente con una base PostgreSQL de prueba, Auth simulado y navegador Chromium. No se ejecutó la migración ni se desplegaron funciones en tu proyecto real. La integración remota con tu cuenta, Discord y la ventana auxiliar sobre FiveM se debe comprobar en tu instalación.
