# Error al crear empleados

Revisión del 2 de octubre de 2026 (Ciudad de México), a partir del commit `2ced29b`.

## Hallazgos confirmados

- `edgeErrorMessage` leía únicamente `error` del cuerpo HTTP. Los errores de autenticación de `@supabase/server` usan `message` y `code`, por lo que la pantalla podía ocultar el motivo y mostrar «No se pudo crear el empleado».
- La consulta de usuarios usaba `ilike`. En esa operación `_` es un comodín: `maria_1` podía coincidir con `mariax1` y dar un falso duplicado. La consulta ahora compara exactamente el nombre normalizado. El índice único de la base sigue protegiendo contra duplicados concurrentes.
- Un error al consultar el perfil del administrador se confundía con falta de permisos. Ahora se identifica como `PROFILE_LOOKUP_FAILED` (HTTP 503).
- Si fallaba la comprobación de duplicados, la función continuaba creando la cuenta. Ahora se detiene con `USERNAME_LOOKUP_FAILED` antes de crearla.

## Comprobaciones del proyecto configurado

Se hicieron consultas sin registros (`limit=0`) y peticiones OPTIONS/GET sin sesión de usuario:

- Las columnas base y las seis columnas `can_*` de `profiles` existen en el proyecto configurado en `config.js`.
- `employee-admin` responde al preflight con HTTP 204 y permite el acceso CORS.
- Una petición sin sesión recibe HTTP 401 con `UNUSABLE_CREDENTIAL`, como corresponde a una función protegida por `auth: "user"`. Esa petición de diagnóstico no reproduce la sesión ni el error concreto del usuario.

El SQL V3 del repositorio no incluye las columnas de permisos, aunque sí existen en el proyecto remoto. Esa diferencia afecta a instalaciones nuevas, pero no explica por sí sola este fallo en la base comprobada. Esta corrección no requiere ejecutar SQL.

## Aplicar los cambios

1. Publicar el `app.js` actualizado en el alojamiento habitual.
2. Actualizar `employee-admin` en Supabase con el archivo `supabase/functions/employee-admin/index.ts`, mediante el editor del Dashboard o desde esta carpeta con la CLI:

   ```sh
   supabase login
   supabase link --project-ref TU_PROJECT_REF
   supabase functions deploy employee-admin
   ```

3. Recargar con Ctrl + F5 y repetir el alta. Si persiste, la pantalla mostrará el código HTTP y el motivo recibido. Si devuelve 401, cerrar sesión y volver a entrar antes de repetir.

Se mantiene `auth: "user"`; los cambios no desactivan la autenticación ni agregan claves privadas al navegador.

## Validación y límite

```sh
node tests/employee-admin.test.mjs
node --check app.js
git diff --check
```

Doce pruebas locales ejercitan las funciones reales con respuestas simuladas: mensajes de autenticación, errores de red, duplicados, guion bajo, fallos de consultas, restricciones de acceso, creación y reversión cuando falla el perfil. El envoltorio `withSupabase` se sustituye en las pruebas; estas no validan la autenticación de la plataforma.

No se crearon usuarios reales, no se modificó la base remota y no se desplegó la función durante la revisión. Para atribuir el fallo original hace falta la respuesta del intento autenticado: código HTTP y cuerpo del error, o una captura del aviso. No hace falta compartir contraseñas ni tokens.
