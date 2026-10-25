# Contexto del frontend

- Aplicación Vue 3 con JavaScript, Vite, Vue Router y Pinia.
- Sigue el patrón `<script setup>` de los componentes existentes y conserva los nombres de dominio en español.
- Reutiliza `src/api.js` para solicitudes HTTP y los stores de `src/stores` para el estado compartido y la autenticación. Revisa `src/router.js` antes de añadir rutas.
- Revisa un componente similar de `src/views` y los contratos de la API antes de proponer nuevos campos o llamadas.
- Mantén el estilo definido en `.prettierrc.json`: dos espacios, comillas simples y sin punto y coma en JavaScript.
- ESLint comprueba JavaScript y las plantillas Vue. Propón correcciones pequeñas; no apliques refactorizaciones o formato masivo sin que la tarea lo requiera.
- El backend Laravel está en `../vehicle-maintenance-history-backend`; comprueba sus rutas, controladores y modelos cuando necesites confirmar un contrato.
