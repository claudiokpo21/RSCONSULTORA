/**
 * RS Consultora · Fatiga y Conducción Segura
 * Receptor de resultados para Google Sheets (Google Apps Script).
 *
 * Cómo usarlo (ver también README.md del proyecto):
 *  1. Crear una planilla de Google Sheets (por ejemplo "Resultados – Fatiga y Conducción").
 *  2. En la planilla: Extensiones → Apps Script. Borrar el contenido y pegar este archivo.
 *  3. Guardar. Implementar → Nueva implementación → Tipo: Aplicación web.
 *       Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier usuario
 *  4. Autorizar los permisos y copiar la URL de la aplicación web (termina en /exec).
 *  5. Pegar esa URL en assets/config.js → integracion.endpoint, y el enlace de la planilla
 *     en integracion.planillaUrl. Volver a publicar el sitio.
 *
 * Cada participante ocupa una fila (identificada por su ID de registro): la fila se crea al
 * confirmar los datos (estado SIN COMPLETAR) y se actualiza con cada intento y al finalizar.
 */

const HOJA = 'Resultados';
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
const ENCABEZADOS = [
  'Actualizado', 'ID registro', 'Legajo', 'Nombre', 'Apellido', 'Empresa', 'Sector', 'Tipo de vehículo',
  'Fecha', 'Hora de inicio', 'Hora de finalización', 'Duración (min)', 'Cantidad de preguntas',
  'Respuestas correctas', 'Respuestas incorrectas', 'Porcentaje', 'Intentos', 'Estado',
  'Capacitador', 'Consultora', 'Capacitación', 'Criterio de aprobación (%)', 'DNI'
];
const ESTADOS = ['APROBADO', 'NO APROBADO', 'SIN COMPLETAR'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const r = JSON.parse(e.postData.contents);
    const p = r.participant || {}, t = r.training || {}, ev = r.evaluation || {};
    const id = texto_(r.id, 40);
    if (!/^REG-[A-Z0-9-]{4,36}$/.test(id)) return respuesta_({ ok: false, error: 'ID inválido' });
    if ((!texto_(p.legajo, 12) && !texto_(p.dni, 12)) || !texto_(p.nombre, 60) || !texto_(p.apellido, 60)) return respuesta_({ ok: false, error: 'Datos incompletos' });

    const fila = [
      new Date(), id, texto_(p.legajo, 12), texto_(p.nombre, 60), texto_(p.apellido, 60),
      texto_(p.empresa, 80), texto_(p.sector, 80), texto_(p.tipoVehiculo, 20),
      fecha_(t.fechaInicio, 'dd/MM/yyyy'), fecha_(t.fechaInicio, 'HH:mm'), fecha_(t.fechaFin, 'HH:mm'),
      numero_(t.duracion), numero_(ev.preguntas), numero_(ev.correctas), numero_(ev.incorrectas),
      numero_(ev.porcentaje), numero_(ev.intentos), ESTADOS.indexOf(ev.estado) >= 0 ? ev.estado : 'SIN COMPLETAR',
      texto_(t.capacitador, 60), texto_(t.consultora, 60), texto_(t.nombre, 120), numero_(ev.criterioAprobacion),
      String(p.dni || '').replace(/\D/g, '').slice(0, 8)
    ];

    const hoja = hoja_();
    const ultima = hoja.getLastRow();
    const ids = ultima > 1 ? hoja.getRange(2, 2, ultima - 1, 1).getValues().map(x => x[0]) : [];
    const pos = ids.indexOf(id);
    if (pos >= 0) hoja.getRange(pos + 2, 1, 1, fila.length).setValues([fila]);
    else hoja.appendRow(fila);
    return respuesta_({ ok: true });
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('RS Consultora – receptor de resultados activo.');
}

function hoja_() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) hoja = libro.insertSheet(HOJA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold').setBackground('#f5b301');
    hoja.setFrozenRows(1);
  } else if (hoja.getLastColumn() < ENCABEZADOS.length) {
    // Planilla creada con una versión anterior: agrega los encabezados nuevos (por ejemplo, DNI) al final.
    const desde = hoja.getLastColumn() + 1;
    hoja.getRange(1, desde, 1, ENCABEZADOS.length - desde + 1).setValues([ENCABEZADOS.slice(desde - 1)])
      .setFontWeight('bold').setBackground('#f5b301');
  }
  return hoja;
}

// Texto seguro: recorta longitud y evita que la planilla lo interprete como fórmula.
function texto_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function numero_(v) { const n = Number(v); return isFinite(n) ? n : ''; }
function fecha_(iso, formato) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? '' : Utilities.formatDate(d, ZONA_HORARIA, formato);
}
function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
