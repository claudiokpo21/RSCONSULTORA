# Fatiga y Conducción Segura — RS Consultora

Capacitación de Higiene y Seguridad dictada por el **Lic. Roberto Seguin**.
Plataforma web estática (HTML + CSS + JavaScript, sin compilación), publicada en Vercel.

## Qué incluye

| Página | Para quién | Qué hace |
|---|---|---|
| `index.html` | Todos | Inicio con acceso a la presentación, el desafío en vivo, la evaluación y el QR. |
| `capacitacion.html` | Capacitador | Presentación para proyectar (22 pantallas, incluida «Estrés al volante»). Sin registro de datos. La última pantalla muestra el QR de la evaluación. Tecla **F** = pantalla completa. |
| `evaluacion.html` | Cada participante | Identificación, repaso opcional, 10 preguntas, resultado y constancia A4 (en el celular: "Guardar como PDF"). |
| `vivo.html` | Capacitador (proyección) | **Desafío en vivo**: sala con QR y código, preguntas con temporizador, gráfico de respuestas, posiciones, equipos y podio. Tecla **F** = pantalla completa, **Espacio** = avanzar. |
| `jugar.html` | Cada participante (celular) | Se une con el QR, elige equipo (Livianos / Pesados) y responde con botones de colores. Ve si acertó, sus puntos y su posición. |
| `admin.html` | Capacitador | Login con usuario de Supabase. **Tablero** general (indicadores, actividad por mes, temas difíciles, mapa de riesgo, empresas, antes/después, satisfacción, percepción de riesgo, Excel), **Jornadas** (crear, links y QR, cerrar, informes, certificados, compartir con el cliente), **Empresas** (nómina, cobertura, vencimientos, informe por empresa) y **Resultados** (filtros, CSV/Excel, certificado e informe individual de cada trabajador, eliminar). |
| `informe.html` | Capacitador → empresa cliente | **Informe grupal** A4 de la jornada: resumen, distribución, aciertos por tema, temas a reforzar, mapa de riesgo por sector, antes y después, satisfacción, desafío en vivo, conclusión y planilla de asistencia con firmas. Con `?t=` es el **enlace para el cliente** (sin login, se puede desactivar). |
| `documento.html` | Capacitador | Documentos A4: **certificado de aprobación** / **constancia de asistencia** (uno o todos los de una jornada), **informe individual** (uno o todos) e **informe por empresa**. |
| `diagnostico.html` | Cada participante | **Diagnóstico inicial** anónimo (5 preguntas, antes de la charla), para medir el aprendizaje. |
| `refuerzo.html` | Cada participante | **Refuerzo a 30 días**: 3 preguntas anónimas de repaso (otra versión de la pregunta), con la respuesta correcta y la explicación. Mide cuánto se retuvo. |
| `guia.html` | Capacitador | **Guía del capacitador** (2 hojas A4): agenda de 90 minutos, checklist del día y qué hacer y decir en cada pantalla. |
| `referencias.html` | Todos | Fuentes y material de consulta (ANSV, SRT, NHTSA, OMS y leyes). |
| `privacidad.html` | Todos | Aviso de privacidad (Ley 25.326), enlazado desde el formulario de la evaluación. |
| `reaccion.html` | Cada participante (celular) o el proyector | **Test de tiempo de reacción**: atento y con simulación de cansancio; muestra los metros recorridos antes de frenar. No guarda datos. Se abre con el QR de la pantalla 10. |
| `afiche.html` | Todos | **Afiche de una hoja** con las claves (señales, qué hacer, horarios de riesgo, mitos, 17 h despierto ≈ 0,5 g/l). Para imprimir o compartir por WhatsApp. |
| `control.html` | Capacitador (su celular) | **Control remoto**: pasa las pantallas de la presentación, pone la pantalla en pausa y maneja el desafío en vivo (comenzar, mostrar resultado, siguiente, QR de la evaluación). Ve la respuesta correcta y la explicación para comentar. |
| `verificar.html` | Cualquiera | Verifica una constancia con su código (o escaneando el QR impreso). |

```
assets/config.js     ← lo que se edita: consultora, capacitador, aprobación, clave, integración
assets/content.js    ← textos, casos y preguntas
assets/styles.css    ← estilos
assets/common.js     ← datos, almacenamiento, constancia, componentes compartidos
assets/capacitacion.js · evaluacion.js · admin.js  ← lógica de cada página
assets/qrcode.js     ← generador de QR (Kazuhiko Arase, licencia MIT), funciona sin internet
assets/supabase.js   ← cliente de Supabase v2 (licencia MIT), incluido en el sitio
assets/vivo-*.js · vivo.css  ← Desafío en vivo (preguntas, núcleo, anfitrión, participante)
assets/remote.js · control.js · remote.css  ← Control remoto desde el celular del capacitador
assets/analitica.js · datos.js  ← cálculos de reportes y carga de datos (compatible con la base sin actualizar)
assets/admin-tablero.js · admin-empresas.js · tablero.css  ← Tablero y Empresas en Administración
assets/informe-lib.js · informe.js · documento.js · informe.css · documento.css  ← informes y certificados A4
assets/xlsx-lite.js · reportes-excel.js  ← Excel con formato (generado en el navegador, sin librerías externas)
assets/diagnostico.js  ← diagnóstico inicial
assets/banco.js      ← banco de preguntas: versiones de cada tema (se sortea una por participante)
assets/refuerzo.js   ← refuerzo a 30 días
assets/guia.js · referencias.js · privacidad.js · info.css  ← guía del capacitador, referencias y aviso de privacidad
sw.js · assets/offline.js · manifest.json  ← modo sin internet (presentación y videos)
assets/videos.js · videos.css · videos/  ← videos con voz dentro de la presentación
supabase/02_reportes.sql  ← actualización de la base para los reportes (ejecutar una vez)
supabase/04_registro_individual.sql  ← firma en certificados de evaluaciones hechas sin código de jornada (ejecutar una vez)
supabase/05_refuerzo_y_consentimiento.sql  ← refuerzo a 30 días y fecha de aceptación del aviso de privacidad (ejecutar una vez, después de la 02)
supabase/06_dni.sql  ← DNI obligatorio y legajo opcional en registros y nómina (ejecutar una vez, después de la 05)
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

## Registro central, jornadas e informe (Supabase)

**Cómo se usa en una capacitación**
1. En **Administración → Jornadas**, crear la jornada (empresa, lugar, fecha). Se genera un código, por ejemplo `B5ZB8`.
2. Usar los links de esa jornada: presentación (`capacitacion.html?j=B5ZB8`), desafío (`vivo.html?j=B5ZB8`) y evaluación (`evaluacion.html?j=B5ZB8`). Los QR que se proyectan ya llevan el código.
3. Cada trabajador: se identifica → **firma su asistencia con el dedo** → rinde → obtiene su constancia con **QR de verificación**.
4. Al terminar: **Informe** → *Imprimir / Guardar PDF* y enviarlo a la empresa. Cerrar la jornada.

**Seguridad**
- Los datos viven en el schema privado `rs_capacitacion` del proyecto *Inventario Clear*, separado del inventario y sin acceso directo desde la API.
- Solo se accede por funciones `public.rs_*`. Un participante solo puede crear o actualizar **su propio** registro (token secreto guardado en su dispositivo); no puede leer los de otros.
- El porcentaje y el estado (APROBADO / NO APROBADO) se recalculan en el servidor.
- El panel exige usuario de Supabase **y** que su email esté en `rs_capacitacion.administradores`. Los usuarios del inventario no tienen acceso.
- **Sin señal** (yacimientos, obradores): el resultado queda en cola en el celular y se envía solo al volver la conexión.

**Puesta en marcha (una sola vez)**
1. Supabase → *Authentication → Users → Add user → Create new user*: email `claudioalejandrohernandez@gmail.com` (ya autorizado como administrador), una contraseña y marcar *Auto Confirm User*.
2. Para autorizar a otra persona (por ejemplo, Roberto): crear su usuario igual que arriba y ejecutar en *SQL Editor*:
   `insert into rs_capacitacion.administradores (email, nombre) values ('email@ejemplo.com', 'Lic. Roberto Seguin');`
3. Recomendado: *Authentication → Settings → Leaked password protection* activado.
4. **Para el blanqueo de clave:** en *Authentication → URL Configuration → Redirect URLs*, agregar la dirección del panel publicado, por ejemplo `https://SU-SITIO.vercel.app/admin.html` (y `https://SU-SITIO.vercel.app/admin`). Sin esto, el enlace del mail lleva a la *Site URL* del proyecto (la app de inventario).

**Contraseñas**
- *¿Olvidaste tu contraseña?* (en el ingreso al panel): envía un enlace por mail; al abrirlo se crea la contraseña nueva. Cada enlace sirve una vez y vence en poco tiempo.
- *Cambiar contraseña* (con la sesión iniciada, arriba a la derecha).
- Alternativa desde Supabase: *Authentication → Users →* menú del usuario → *Send password recovery*.
- El servidor de correo incluido en Supabase tiene un límite bajo de envíos por hora y puede enviar solo a los miembros del equipo del proyecto. Para enviar a otros administradores (por ejemplo, Roberto) conviene configurar un SMTP propio en *Authentication → Emails → SMTP Settings*. La plantilla del mail se edita en *Authentication → Emails → Templates* (es compartida con la app de inventario).

## Desafío en vivo

Flujo sugerido: **Presentación → Desafío en vivo → Evaluación individual** (el podio final muestra el QR de la evaluación).

- **Tiempo real:** usa Supabase Realtime (Broadcast) del proyecto *Inventario Clear*. No crea tablas ni guarda datos: los mensajes solo pasan por el canal. Se creó además el schema vacío `rs_capacitacion`, separado del inventario, reservado para un futuro registro central de evaluaciones.
- **Configuración:** `assets/config.js` → `vivo` (URL, clave pública, segundos por pregunta, puntos). La clave *publishable* es pública por diseño; no hay que usar nunca la clave `service_role` en el sitio.
- **Preguntas:** se editan en `assets/vivo-preguntas.js` (tipos: pregunta, mito o realidad, encuesta anónima).
- **Cierre en dos pasos:** al terminar la última pregunta, la pantalla muestra el **resumen del grupo** (anónimo): la respuesta más elegida en cada pregunta, el porcentaje de aciertos, lo que el grupo tiene claro y lo que conviene reforzar. Con **Ver ganadores** aparece el **podio con el top 3**.
- **Puntaje:** 500 por acierto + hasta 500 por rapidez. Los equipos se comparan por promedio, para que el más numeroso no tenga ventaja.
- **Modo demostración:** el botón *Sumar participantes simulados* permite mostrarlo sin público. Sin Supabase configurado, también funciona entre pestañas del mismo navegador.
- **Privacidad:** el nombre del participante solo se muestra en pantalla durante el juego. El capacitador puede descargar el resultado del desafío en CSV desde el podio final.
- **Si no conecta:** verificar internet en la computadora que proyecta y, en Supabase → *Realtime → Settings*, que esté habilitado el acceso público a los canales (*Allow public access*).
- **Límites del plan gratuito de Supabase:** alcanzan para grupos de capacitación habituales (decenas de participantes simultáneos).

## Control remoto desde el celular

1. En la computadora, abrí la **Presentación** o el **Desafío en vivo** y tocá el ícono del celular (arriba a la derecha).
2. Escaneá el QR con tu celular. El ícono se pone verde: el celular quedó vinculado.
3. Desde el celular: **Siguiente / Atrás**, **Pantallas** (saltar a cualquiera), **Pausa** (muestra el logo en pantalla) y **Desafío** (abre la sala en la computadora). En el desafío, un solo botón grande avanza: *Comenzar → Mostrar resultado → Posiciones → Siguiente → QR de la evaluación*.

- **Seguridad:** el enlace lleva un código secreto de 48 caracteres. El primer celular que se conecta queda vinculado y los demás son rechazados, aunque escaneen el QR. *Desvincular y generar un QR nuevo* corta al celular anterior. Igual conviene no proyectar el QR (abrirlo antes de conectar el proyector o con pantalla extendida).
- **Continuidad:** la vinculación se mantiene al pasar de la presentación al desafío y al volver (misma pestaña del navegador).
- **Solo en el celular del capacitador:** la respuesta correcta durante la pregunta y la explicación para comentar con el grupo.
- **Pantalla completa:** se activa desde la computadora (tecla **F**); los navegadores no permiten activarla a distancia.
- **Requisitos:** mismo canal en tiempo real que el desafío (Supabase Realtime). Sin Supabase, solo funciona entre pestañas del mismo navegador (demostración).

## Reportes, certificados y tablero

**Activación (una sola vez):** Supabase → *SQL Editor* → *New query* → pegar `supabase/02_reportes.sql` → *Run*. Solo agrega columnas, dos tablas privadas (diagnóstico y nómina) y funciones `rs_*` en `rs_capacitacion`; no toca el inventario ni borra datos. Después, en Administración tocar **Actualizar**.
Mientras no se ejecute, el sistema funciona en **modo compatible**: tablero, mapa de riesgo, informes, certificados y Excel andan con los datos actuales; satisfacción, diagnóstico, nómina y enlace para el cliente muestran un aviso en lugar de fallar.

- **Informe individual:** datos, resultado, aciertos por tema, firma, historial con RS, vigencia y recomendación. Desde *Resultados* (ícono de persona) o todos los de una jornada.
- **Certificados:** *certificado de aprobación* (criterio alcanzado) o *constancia de asistencia* (firmó pero no aprobó). Con QR de verificación y fecha de vencimiento. Uno por trabajador (*Resultados*, ícono de medalla) o todos los de una jornada.
- **Nota en el certificado:** `config.js → reportes.mostrarNotaEnCertificado` (por defecto `false`: el certificado dice *Aprobado* sin el porcentaje). El porcentaje sigue en el informe individual, el grupal y Resultados.
- **Una hoja:** la constancia del trabajador y los certificados entran en una hoja A4 o Carta aunque el navegador agregue sus márgenes. Si el trabajador imprime con el menú del navegador (en vez del botón), igual sale la constancia.
- **Vigencia:** `config.js → reportes.vigenciaMeses` (12 por defecto; 0 = sin vencimiento) y `avisoVencimientoDias` (60). Es un criterio de RS Consultora, **no un plazo legal**.
- **Informe por empresa:** todas sus jornadas, evolución, resultados por sector y vehículo, mapa de riesgo, satisfacción, cobertura de nómina, vencidos, por vencer y pendientes.
- **Nómina:** *Empresas → Nómina* → pegar o elegir un CSV con columnas `dni;legajo;apellido;nombre;sector` (alcanza con el DNI o el legajo; también se acepta el formato anterior `legajo;apellido;nombre;sector`). Se usa solo para calcular cobertura y pendientes.
- **Diagnóstico inicial (antes / después):** QR en *Jornadas → Links y QR*. Anónimo, sin nombre ni legajo; las preguntas se eligen en `reportes.diagnostico`. Se compara con la evaluación final de la misma jornada.
- **Satisfacción:** al finalizar la evaluación, calificación de 1 a 5 y comentario opcional. En los informes se muestran sin nombre.
- **Compartir con el cliente:** *Jornadas → Compartir con el cliente* crea un enlace secreto al informe grupal y arma el email (se abre en tu correo). **Quien tenga el enlace ve el informe, incluida la planilla con nombres y firmas.** Se puede desactivar en cualquier momento. El envío automático sin abrir el correo requiere un proveedor de email (por ejemplo, SMTP propio o Resend).
- **Excel:** tablero completo (resumen, jornadas, participantes, temas, empresas, vencimientos, antes y después, percepción de riesgo, comentarios) y por empresa (con pendientes de la nómina), con encabezados, filtros y estados resaltados.

## Videos con voz

Videos animados (≈ 1 minuto, Full HD, voz masculina, sin subtítulos) en las pantallas con mucho texto. En la pantalla aparece **▶ Video**; se abre a pantalla completa y se cierra al terminar, con **Esc** o con la ✕. Tecla **V**: abrir / pausar. Desde el **control remoto**: Reproducir, Pausar y Cerrar video.

| Pantalla | Video | Archivo |
|---|---|---|
| 3 · ¿Qué es la fatiga? | ¿Qué es la fatiga? | `videos/v1-que-es-la-fatiga.mp4` |
| 5 · Factores de riesgo | ¿Qué favorece la fatiga? | `videos/v2-factores-de-riesgo.mp4` |
| 9 · Señales de alerta | Señales de alerta | `videos/v3-senales-de-alerta.mp4` |
| 11 · Vehículos livianos | Livianos y pesados | `videos/v4-livianos-y-pesados.mp4` |
| 17 · Qué hacer ante la fatiga | Si aparece la fatiga | `videos/v6-que-hacer.mp4` |
| 18 · Prevención | Prevenir la fatiga | `videos/v5-prevencion.mp4` |

Para sumar otro: copiar el `.mp4` y su portada `.jpg` en `videos/` y agregar una línea en `assets/videos.js` (`VIDEOS_PRES`).

## Contenido reforzado con la ANSV

Datos y recomendaciones del Observatorio Vial Nacional de la ANSV (Dossier N.º 5, «Fatiga y estrés en la conducción de vehículos», 2021), siempre con su fuente y su año: pantalla nueva **Estrés al volante** (6), datos de Argentina en los objetivos, la equivalencia entre falta de sueño y 0,5 g/l de alcohol en la pantalla del sueño, estudios en camioneros y choferes en vehículos pesados, estiramientos y comidas livianas en prevención, dos preguntas nuevas en el banco (estrés y sueño/alcohol) y medidas para la organización en el informe grupal. Los textos están en `content.js` (`datos` y `estres`).

## Actividades interactivas y bibliografía

- **¿Cuántas horas llevás despierto?** (pantalla 7): 17 h ≈ 0,5 g/l y 24 h ≈ 1 g/l de alcohol en sangre (Dawson y Reid, 1997; CDC/NIOSH).
- **Test de reacción** (`reaccion.html`, QR en la pantalla 10).
- **Afiche** (`afiche.html`): enlazado desde el cierre de la presentación, el resultado de la evaluación, el inicio y Administración.
- **Bibliografía de los datos** en Referencias: cada cifra de la presentación lleva su número de fuente [n].

## DNI y legajo

El participante se identifica con su **DNI** (obligatorio, 7 u 8 números); el **legajo** es opcional y sirve para cruzar con la nómina de la empresa. El DNI aparece en la constancia, los certificados, los informes y el Excel. En la verificación pública (QR) se muestra parcialmente oculto: `**.***.456`.

**Activación (una sola vez):** ejecutar `supabase/06_dni.sql` en el *SQL Editor*. Los registros anteriores, que solo tienen legajo, siguen funcionando igual. Si el sitio nuevo se publica antes de ejecutar la 06, el DNI se guarda provisoriamente en el campo legajo (`DNI30123456`) y la migración lo pasa a su lugar.

## Banco de preguntas

Cada tema de la evaluación tiene 2 versiones (`assets/banco.js`). En cada intento se sortea una versión por tema y se mezcla el orden de las opciones, así dos compañeros no tienen la misma evaluación. Como siempre hay una pregunta por tema en la misma posición, los informes por tema siguen comparando lo mismo. Para sumar una versión, agregarla en el tema correspondiente de `VARIANTES`. Los resultados guardados con el formato anterior se siguen leyendo bien.

## Refuerzo a 30 días

**Activación (una sola vez):** ejecutar `supabase/05_refuerzo_y_consentimiento.sql` en el *SQL Editor* (después de la 02). Agrega el tipo «refuerzo» a los diagnósticos anónimos y la fecha de aceptación del aviso de privacidad. Sin ejecutarla, el refuerzo funciona como repaso pero no guarda respuestas.

- **Enviar:** *Jornadas → Links y QR* muestra la fecha sugerida (fecha de la jornada + `reportes.refuerzoDias`), el botón **WhatsApp** con el mensaje armado y **Copiar mensaje**. También hay un QR del refuerzo.
- **Preguntas:** `reportes.refuerzo` (por defecto los temas 3, 9 y 10), en la versión 2 del banco. Anónimo: no pide nombre ni legajo. Se puede responder hasta 180 días después de la jornada, aunque esté cerrada.
- **Resultados:** *Tablero → Retención a 30 días* (y el indicador *Retención*) y el informe grupal de la jornada comparan la evaluación final con el refuerzo, tema por tema.

## Modo sin internet

En la presentación, el botón con la flecha hacia abajo (**Usar sin internet**) descarga la presentación y los 6 videos (≈ 16 MB) en ese navegador. Hacerlo el día anterior o al llegar, con buena señal y desde el mismo navegador que se va a usar. Si se corta la conexión, recargar la página: sigue funcionando. Sin internet no funcionan el desafío en vivo, el control remoto ni el envío de resultados.

Funciona con `sw.js` (service worker): páginas y scripts se piden primero a la red, así siempre se ve la última versión publicada; la copia guardada se usa solo si no hay conexión o la red tarda más de 4 segundos. Si se publica un cambio grande, subir `VERSION` en `sw.js`.

## Guía, referencias y privacidad

- **Guía del capacitador:** *Administración → Guía del capacitador* (o `guia.html`). Se imprime en 2 hojas. Los tiempos se editan en `assets/guia.js`.
- **Referencias:** enlazadas desde el inicio y desde la última pantalla de la presentación.
- **Aviso de privacidad:** el participante debe aceptarlo para registrar la evaluación; se guarda la fecha y hora (con la migración 05). **Completar** `privacidad.domicilio` y `privacidad.contacto` en `config.js`: mientras estén vacíos, el aviso los muestra en rojo.

## Alternativa: planilla de Google Sheets

Además del registro central, cada resultado puede enviarse a una planilla de Google (opcional): pegar `apps-script/Code.gs` en *Extensiones → Apps Script* de la planilla, implementarlo como *Aplicación web* (ejecutar como: Yo; acceso: cualquier usuario) y copiar la URL `/exec` en `assets/config.js` → `integracion.endpoint`. Si se vacía `supabase.url`, el sitio vuelve al modo local sin servidor.

## Antes de usarlo con trabajadores reales

- El acceso de administración usa usuarios de Supabase (la clave `admin.password` de `config.js` solo se usa en modo local, sin servidor).
- Nombre, apellido, legajo y firma son datos personales (Ley 25.326 de Protección de Datos Personales): informar a la empresa cliente y a los participantes para qué se usan y quién accede. El formulario pide aceptar el aviso de privacidad (`privacidad.html`); completar domicilio y contacto en `config.js`.
- La evaluación se corrige en el navegador para dar la explicación inmediata; el servidor valida la consistencia del resultado.
- La capacitación no incluye límites legales de horas de conducción; remite a la política interna y a la normativa vigente aplicable.
