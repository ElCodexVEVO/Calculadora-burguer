# Burger Shot V6.7 · Acceso y pantalla de carga

El acceso integra el diseño aprobado de Día de Muertos y Halloween: fondo de altar nocturno, velas, pétalos, papel picado y un formulario independiente. Se utiliza directamente **assets/burgershot-muertos.webp**, el logo original, sin modificarlo.

## Comportamiento

- La carga indica «Comprobando tu sesión…», «Verificando acceso…», «Comprobando tu cuenta…» o «Cargando tu negocio…» según la operación real.
- Al completar el acceso, muestra una bienvenida y se desvanece hacia el panel. Las estadísticas entran suavemente una sola vez por sesión.
- No se añade una espera artificial ni un porcentaje ficticio. Si la conexión tarda, aparece un aviso discreto.
- El formulario bloquea los envíos repetidos mientras hay una petición pendiente. Los errores de contraseña, red, perfil y datos devuelven un acceso utilizable.
- La contraseña se puede mostrar u ocultar; se vacía y vuelve a ocultarse al entrar.
- Una sesión guardada entra sin volver a pedir credenciales. La renovación de tokens no vuelve a mostrar la presentación.
- El cierre de sesión invalida las consultas de acceso pendientes para impedir que abran el panel después de salir.
- Los efectos respetan «Animaciones suaves» y la preferencia de movimiento reducido. El formulario permite desplazarse cuando hay poca altura disponible, incluido el teclado móvil.

## Instalar desde V6.6

Reemplaza **index.html**, **app.js** y **VERSION.json**. Añade **auth-scene.css**, **auth-scene.js** y **assets/auth-altar.png**. Conserva config.js y el resto de los archivos existentes. Esta actualización no necesita una migración SQL.

Para actualizar las vistas de prueba, reemplaza DEMO_V6.html y añade DEMO_ACCESO.html y demo/auth-preview.js. Abre **DEMO_ACCESO.html** e inicia con **demo / demo**; las cuentas y ventas son simuladas. La demora de esta demo sirve para observar las etapas y no se aplica al acceso real.

## Verificación

Pasaron las 139 comprobaciones existentes y 21 escenarios nuevos de acceso en Chromium. Se volvieron a comprobar los 11 escenarios de caja por cantidades. La revisión de acceso incluye ocho anchos (320–1600 px), poca altura, errores recuperables, sesiones guardadas, eventos concurrentes, cierre de sesión durante consultas, la demo y movimiento reducido. Las pruebas usan archivos y datos locales; no acceden al Supabase real.

Prueba nueva: tests/auth-browser.cjs. Resultado: tests/auth-browser-results.json. Necesita Playwright y un Chromium disponible; CHROMIUM_EXECUTABLE permite elegir el ejecutable. Las capturas están en preview/acceso-v6-7-escritorio.png, preview/acceso-v6-7-movil.png y preview/carga-v6-7-escritorio.png.

La devolución de eventos de autenticación es síncrona; las consultas se programan fuera de ella. Referencia: [documentación de onAuthStateChange de Supabase](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

El fondo se creó con la herramienta de generación de imágenes integrada. El prompt y los criterios de diseño están en [design/acceso-v6-7.md](design/acceso-v6-7.md).
