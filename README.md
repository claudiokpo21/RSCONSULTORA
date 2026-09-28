# Fatiga y Conducción Segura — RS Consultora

Capacitación de Higiene y Seguridad dictada por el **Lic. Roberto Seguin**.
Prototipo web estático (HTML + CSS + JavaScript, sin compilación), listo para publicar en Vercel.

## Qué incluye

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Todos | Inicio con acceso a la presentación, el desafío en vivo, la evaluación y el QR. |
| `capacitacion.html` | Capacitador | Presentación para proyectar (21 pantallas). Sin registro de datos. La última pantalla muestra el QR de la evaluación. Tecla **F** = pantalla completa. |
| `evaluacion.html` | Cada participante | Identificación, repaso opcional, 10 preguntas, resultado y constancia A4 (en el celular: "Guardar como PDF"). |
| `vivo.html` | Capacitador (proyección) | **Desafío en vivo**: sala con QR y código, preguntas con temporizador, gráfico de respuestas, posiciones, equipos y podio. Tecla **F** = pantalla completa, **Espacio** = avanzar. |
| `jugar.html` | Cada participante (celular) | Se une con el QR, elige equipo (Livianos / Pesados) y responde con botones de colores. Ve si acertó, sus puntos y su posición. |
| `admin.html` | Capacitador | Panel con contraseña: indicadores, filtros y exportación CSV. Opción "Recordar este equipo". |

```
assets/config.js     ← lo que se edita: consultora, capacitador, aprobación, clave, integración
assets/content.js    ← textos, casos y preguntas
assets/styles.css    ← estilos
assets/common.js     ← datos, almacenamiento, constancia, componentes compartidos
assets/capacitacion.js · evaluacion.js · admin.js  ← lógica de cada página
assets/qrcode.js     ← generador de QR (Kazuhiko Arase, licencia MIT), funciona sin internet
assets/supabase.js   ← cliente de Supabase v2 (licencia MIT), incluido en el sitio
assets/vivo-*.js · vivo.css  ← Desafío en vivo (preguntas, núcleo, anfitrión, participante)
apps-script/Code.gs  ← receptor de resultados para Google Sheets (opcional)
vercel.json          ← URLs limpias y encabezados de seguridad
```

## Publicar en Vercel

**Opción A — desde GitHub (sin instalar nada)**
1. Crear un repositorio nuevo en GitHub y subir el contenido de esta carpeta (botón *Add file → Upload files*).
2. En vercel.com: *Add New → Project*, importar el repositorio.
3. Framework Preset: **Other**. Sin comando de build ni carpeta de salida. *Deploy*.

**Opción B — con la línea de comandos**
```bash
npm i -g vercel
cd rs-fatiga
vercel          # vista previa
vercel --prod   # publicación
```

El QR se genera solo con la dirección donde esté publicado el sitio. Si se usa un dominio propio y se quiere fijar la URL, completar `publicacion.urlEvaluacion` en `assets/config.js`.

## Desafío en vivo

Flujo sugerido: **Presentación → Desafío en vivo → Evaluación individual** (el podio final muestra el QR de la evaluación).

- **Tiempo real:** usa Supabase Realtime (Broadcast) del proyecto *Inventario Clear*. No crea tablas ni guarda datos: los mensajes solo pasan por el canal. Se creó además el schema vacío `rs_capacitacion`, separado del inventario, reservado para un futuro registro central de evaluaciones.
- **Configuración:** `assets/config.js` → `vivo` (URL, clave pública, segundos por pregunta, puntos). La clave *publishable* es pública por diseño; no hay que usar nunca la clave `service_role` en el sitio.
- **Preguntas:** se editan en `assets/vivo-preguntas.js` (tipos: pregunta, mito o realidad, encuesta anónima).
- **Puntaje:** 500 por acierto + hasta 500 por rapidez. Los equipos se comparan por promedio, para que el más numeroso no tenga ventaja.
- **Modo demostración:** el botón *Sumar participantes simulados* permite mostrarlo sin público. Sin Supabase configurado, también funciona entre pestañas del mismo navegador.
- **Privacidad:** el nombre del participante solo se muestra en pantalla durante el juego. El capacitador puede descargar el resultado del desafío en CSV desde el podio final.
- **Si no conecta:** verificar internet en la computadora que proyecta y, en Supabase → *Realtime → Settings*, que esté habilitado el acceso público a los canales (*Allow public access*).
- **Límites del plan gratuito de Supabase:** alcanzan para grupos de capacitación habituales (decenas de participantes simultáneos).

## Dónde quedan los resultados

**Tal como está (prototipo):** cada resultado queda guardado solo en el navegador del dispositivo donde se rindió la evaluación. Sirve para mostrar el desarrollo, pero con celulares propios el capacitador no ve los resultados de los demás.

**Con planilla central (Google Sheets):**
1. Crear una planilla en Google Sheets con la cuenta de la consultora.
2. *Extensiones → Apps Script*, pegar el contenido de `apps-script/Code.gs` y guardar.
3. *Implementar → Nueva implementación → Aplicación web*. Ejecutar como: **Yo**. Acceso: **Cualquier usuario**. Autorizar.
4. Copiar la URL que termina en `/exec` y pegarla en `assets/config.js` → `integracion.endpoint`. Pegar el enlace de la planilla en `integracion.planillaUrl`.
5. Volver a publicar en Vercel.

Cada participante aparece como una fila: se crea al confirmar sus datos (estado *SIN COMPLETAR*) y se actualiza con cada intento y al finalizar. La planilla solo la ve quien tenga acceso a esa cuenta de Google.

## Antes de usarlo con trabajadores reales

- Cambiar la contraseña de `admin.password` en `assets/config.js`. En un sitio publicado esa clave puede leerse en el código: es una barrera básica, no una protección fuerte.
- Nombre, apellido y legajo son datos personales: la empresa cliente debería estar informada y autorizar su registro en la planilla de la consultora.
- La capacitación no incluye límites legales de horas de conducción; remite a la política interna y a la normativa vigente aplicable.
