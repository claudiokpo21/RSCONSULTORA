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
| `admin.html` | Capacitador | Login con usuario de Supabase. **Jornadas** (crear, links y QR, cerrar, informe) y **Resultados** (indicadores, filtros, CSV, eliminar). |
| `informe.html` | Capacitador → empresa cliente | Informe A4 de la jornada: resumen, distribución de resultados, aciertos por tema, temas a reforzar, desafío en vivo, conclusión y planilla de asistencia con firmas. Se imprime o guarda como PDF. |
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
- **Puntaje:** 500 por acierto + hasta 500 por rapidez. Los equipos se comparan por promedio, para que el más numeroso no tenga ventaja.
- **Modo demostración:** el botón *Sumar participantes simulados* permite mostrarlo sin público. Sin Supabase configurado, también funciona entre pestañas del mismo navegador.
- **Privacidad:** el nombre del participante solo se muestra en pantalla durante el juego. El capacitador puede descargar el resultado del desafío en CSV desde el podio final.
- **Si no conecta:** verificar internet en la computadora que proyecta y, en Supabase → *Realtime → Settings*, que esté habilitado el acceso público a los canales (*Allow public access*).
- **Límites del plan gratuito de Supabase:** alcanzan para grupos de capacitación habituales (decenas de participantes simultáneos).

## Alternativa: planilla de Google Sheets

Además del registro central, cada resultado puede enviarse a una planilla de Google (opcional): pegar `apps-script/Code.gs` en *Extensiones → Apps Script* de la planilla, implementarlo como *Aplicación web* (ejecutar como: Yo; acceso: cualquier usuario) y copiar la URL `/exec` en `assets/config.js` → `integracion.endpoint`. Si se vacía `supabase.url`, el sitio vuelve al modo local sin servidor.

## Antes de usarlo con trabajadores reales

- El acceso de administración usa usuarios de Supabase (la clave `admin.password` de `config.js` solo se usa en modo local, sin servidor).
- Nombre, apellido, legajo y firma son datos personales (Ley 25.326 de Protección de Datos Personales): informar a la empresa cliente y a los participantes para qué se usan y quién accede. El formulario ya muestra un aviso.
- La evaluación se corrige en el navegador para dar la explicación inmediata; el servidor valida la consistencia del resultado.
- La capacitación no incluye límites legales de horas de conducción; remite a la política interna y a la normativa vigente aplicable.
