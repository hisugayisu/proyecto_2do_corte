Proyecto Reconocimiento de Dígitos – 2do Corte
==============================================

Aplicación desarrollada en React + TypeScript + Vite para reconocer dígitos escritos a mano 

----------------------------------------------------
📌 Requisitos previos
----------------------------------------------------
- Tener instalado Node.js (versión 18 o superior).
- Tener instalado npm (viene con Node).

----------------------------------------------------
🚀 Cómo ejecutar el proyecto en tu PC
----------------------------------------------------
1. Abre una terminal en la carpeta del proyecto.
2. Instala dependencias:
   npm install
3. Inicia el servidor de desarrollo:
   npm run dev
   La aplicación se abrirá en:
    http://localhost:5173



----------------------------------------------------
🖥️ Uso de la aplicación
----------------------------------------------------
1. Abre el navegador en http://localhost:5173
2. En la pantalla principal puedes:
   - Subir un archivo con una imagen de dígito (28×28 px).
   - Dibujar un dígito en el lienzo (Canvas28).
3. Ajusta el parámetro "invert":
   - Manual → selecciona si el dígito es negro sobre fondo blanco o al revés.
   - Automático → el sistema sugiere el valor según el brillo promedio.
4. Opciones adicionales:
   - Normalizar imagen (estilo MNIST): recorta, centra y escala el dígito.
   - Probar ambos invert: prueba true y false y elige la predicción más probable.
5. Haz clic en "Enviar" → el sistema mostrará la predicción y las probabilidades.
6. Cada intento queda guardado en el historial.

----------------------------------------------------
📑 Historial de predicciones
----------------------------------------------------
- Se guarda automáticamente en el navegador usando LocalStorage.
- Para consultar: ve a la pestaña Historial en el menú superior.
- Cada entrada muestra:
  - Fecha y hora.
  - Archivo usado.
  - Parámetro invert.
  - Resultado de la predicción.

----------------------------------------------------
⚠️ Notas importantes
----------------------------------------------------
- Solo se aceptan imágenes de 28×28 píxeles (se normalizan si no cumplen).
- El historial queda guardado localmente en tu navegador.
- Si deseas borrar el historial:
  - Abre DevTools (F12) → pestaña Application → Local Storage → limpia la clave "predict_history".
