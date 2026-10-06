# Verificación de Caja auxiliar V5.4.1

Fecha: 14 de septiembre de 2026.

## Comprobado

- 29 escenarios existentes del punto de venta: catálogo, descuentos, restricciones, comisiones, cantidades personalizadas, errores, bloqueo de doble clic, empleados y notificaciones simuladas.
- 17 escenarios existentes de reportes: filtros, historial, paginación y visibilidad por empleado.
- 6 escenarios existentes de edición de órdenes y permisos.
- 13 escenarios nuevos del auxiliar: importes, lectura de texto, clientes obligatorios, confirmación manual, reintento, doble clic, cambios de precio, cantidades personalizadas, repetición de compra, favoritos, cierre de sesión y separación de clientes por usuario.
- Comprobación manual de botones `+10`, `+25`, `+50`, `+100`, vista previa del importe, Enter y plantillas de pedidos en POS y caja auxiliar.
- Reconocimiento OCR real con Tesseract.js 7.0.0 y modelos locales español/inglés sobre un PNG de prueba: se extrajo `Valeria Cruz` y `2000` del aviso `Valeria Cruz te pagó $2,000`.
- Sintaxis JavaScript de los módulos y el lanzador; integridad del ZIP y presencia de archivos OCR.

Las pruebas de las ventas utilizaron JSDOM y un cliente Supabase simulado. No se conectaron a la base de datos real ni se enviaron mensajes a Discord.

## Pendiente en el equipo de uso

- La aplicación de escritorio requiere Windows, Node.js e Internet para preparar Electron la primera vez. No se ejecutó el lanzador de Windows en este entorno.
- No fue posible iniciar Chromium para una comprobación visual del panel en este entorno; el diseño está implementado en HTML/CSS, pero necesita revisión en pantalla.
- Hace falta comprobar el comportamiento de la ventana siempre visible y el atajo junto a FiveM en ventana sin bordes.
- La prueba de OCR usa un aviso controlado. Las fuentes, transparencias, resolución y redacción de tu servidor pueden afectar la lectura; los datos siempre se revisan antes de confirmar.
- Los permisos reales, el acceso a Supabase y el envío a Discord dependen de la configuración existente del negocio. Esta actualización no verifica ni repara un webhook que ya estuviera fallando.

## Repetir las pruebas de lógica

Desde la carpeta `tests`, ejecuta `npm install`. Después:

```text
node regression.cjs
node reports-regression.cjs
node edit-order-regression.cjs
node companion-regression.cjs
```

Las pruebas se encuentran fuera del código que carga la aplicación. No deben reemplazar `config.js` ni utilizarse para operar ventas reales.
