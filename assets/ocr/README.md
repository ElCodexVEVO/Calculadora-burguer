# Lector local de capturas

Archivos distribuidos para ejecutar OCR en un Web Worker del navegador. No se envían las imágenes a servicios externos.

- Tesseract.js 7.0.0, licencia Apache-2.0: https://github.com/naptha/tesseract.js
- Tesseract.js-core (versión registrada en `VERSIONS.json`), licencia Apache-2.0: https://github.com/naptha/tesseract.js-core
- Datos español e inglés, modelos LSTM `4.0.0_best_int`: paquetes `@tesseract.js-data/spa` y `@tesseract.js-data/eng`, derivados de https://github.com/tesseract-ocr/tessdata_best (Apache-2.0).
- Se incluyen las licencias en esta carpeta y los avisos de dependencias junto a los archivos minificados.

Conservar todos los archivos, incluyendo `.wasm` y `.gz`, al publicar en GitHub Pages. Se usa el núcleo LSTM sin exigir SIMD para tener una ruta compatible y evitar descargar componentes en tiempo de ejecución desde otro proveedor.
