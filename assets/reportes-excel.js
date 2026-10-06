'use strict';
/* reportes-excel.js — EXCEL CON FORMATO (tablero general y empresa)
   Hojas: Resumen · Empresas · Jornadas · Participantes · Temas · Mapa de riesgo · Vencimientos · Comentarios.
   Usa XLSX (xlsx-lite.js) y An (analitica.js).
   RS Consultora */

function xlEstado(e){ return { v:e, s: e === 'APROBADO' ? 'ok' : e === 'NO APROBADO' ? 'bad' : 'pend' }; }
function xlVig(v){ return { v:v, s: v === 'vigente' ? 'ok' : v === 'vencido' || v === 'sin aprobar' ? 'bad' : 'pend' }; }
function xlFecha(f){ return f ? fmtDate(An.day(f) + 'T12:00:00') : ''; }
function xlPct(p){ return p == null ? '' : { v:p, s:'pct' }; }

function hojasDetalle(regs, jornadas, nomina, desafios, diags){
  const R = An.resumen(regs), pers = An.personas(regs), s = An.satisfaccion(regs), ad = An.antesDespues(diags, regs);
  const E = An.empresas(regs, jornadas, nomina), pp = An.porPregunta(regs);
  const jById = new Map(jornadas.map(j => [j.id, j]));
  const sheets = [];
  sheets.push({ name:'Empresas', cols:[34,10,13,12,12,12,13,12,12,12,14,14], head:['Empresa','Jornadas','Participantes','Aprobados','Aprobación','Promedio','Satisfacción','Vigentes','Por vencer','Vencidos','Nómina','Cobertura'],
    rows:E.map(e => [e.nombre, e.jornadas.length, e.n, e.aprobados, xlPct(e.pctAprob), xlPct(e.promedio), e.sat.prom ?? '', e.vigentes, e.porVencer, e.vencidos, e.nominaN || '', xlPct(e.cobertura)]) });
  sheets.push({ name:'Jornadas', cols:[11,12,30,26,24,13,12,10,12], head:['Fecha','Código','Empresa','Lugar','Capacitador','Participantes','Aprobados','Firmas','Estado'],
    rows:jornadas.map(j => [xlFecha(j.fecha), j.codigo, j.empresa, j.lugar || '', j.capacitador, j.participantes, j.aprobados, j.firmas, j.estado]) });
  sheets.push({ name:'Participantes', cols:[11,28,10,12,12,22,22,22,16,10,15,9,10,13,12,13,12], head:['Fecha','Empresa','Jornada','DNI','Legajo','Apellido','Nombre','Sector','Vehículo','Resultado','Estado','Intentos','Firma','Verificación','Vence','Vigencia','Satisfacción'],
    rows:regs.slice().sort((a, b) => (An.day(b.fecha)).localeCompare(An.day(a.fecha)) || String(a.apellido).localeCompare(b.apellido, 'es')).map(r => {
      const v = r.estado === 'APROBADO' ? An.estadoVigencia(r.fecha) : null;
      return [xlFecha(r.fecha), r.empresa || '', r.jornada_codigo || '', fmtDni(r.dni), r.legajo || '', r.apellido, r.nombre, r.sector || '', r.tipo_vehiculo || '', xlPct(r.porcentaje), xlEstado(r.estado), r.intentos || 0,
        r.firmado ? 'Sí' : 'No', r.verificacion || '', v && v.vence ? fmtDate(v.vence) : '', v ? xlVig(v.estado) : '', r.satisfaccion || ''];
    }) });
  sheets.push({ name:'Temas', cols:[8,28,70,12,12,12], head:['N.º','Tema','Pregunta','Evaluados','Correctas','% acierto'],
    rows:pp.map(x => [x.k + 1, tema(x.k), x.q.q, x.n, x.ok, xlPct(x.pct)]) });
  ['sector', 'tipo_vehiculo'].forEach(dim => {
    const M = An.mapa(regs, dim);
    sheets.push({ name: dim === 'sector' ? 'Riesgo por sector' : 'Riesgo por vehículo', cols:[26,8,...TEMAS.map(() => 13),11],
      head:[dim === 'sector' ? 'Sector' : 'Tipo de vehículo', 'Evaluados', ...TEMAS, 'Promedio'],
      rows:M.map(r => [r.grupo, r.n, ...r.cells.map(p => ({ v:p, s: p < CONFIG.aprobacion.porcentajeMinimo ? 'bad' : 'pct' })), xlPct(r.prom)]) });
  });
  const venc = pers.filter(p => p.ultimaAprob).sort((a, b) => (a.vig.vence || 0) - (b.vig.vence || 0));
  sheets.push({ name:'Vencimientos', cols:[28,12,12,22,22,22,14,14,14], head:['Empresa','DNI','Legajo','Apellido','Nombre','Sector','Aprobó el','Vence','Estado'],
    rows:venc.map(p => [p.empresa || '', fmtDni(p.dni), p.legajo || '', p.apellido, p.nombre, p.sector || '', xlFecha(p.ultimaAprob.fecha), p.vig.vence ? fmtDate(p.vig.vence) : 'Sin vencimiento', xlVig(p.vig.estado)]) });
  const pend = E.flatMap(e => e.pendientes.map(n => [e.nombre, fmtDni(n.dni), n.legajo || '', n.apellido || '', n.nombre || '', n.sector || '']));
  if(pend.length) sheets.push({ name:'Pendientes (nómina)', cols:[28,12,12,22,22,22], head:['Empresa','DNI','Legajo','Apellido','Nombre','Sector'], rows:pend });
  if(s.comentarios.length) sheets.push({ name:'Comentarios', cols:[100], head:['Comentarios de los participantes (anónimos)'], rows:s.comentarios.map(c => [c]) });
  if(ad.n) sheets.push({ name:'Antes y después', cols:[28,70,14,14,14], head:['Tema','Pregunta','Antes','Después','Mejora (puntos)'],
    rows:ad.items.map(x => [tema(x.k), x.q.q, xlPct(x.pre), xlPct(x.post), x.pre != null && x.post != null ? x.post - x.pre : '']) });
  const P = An.percepcion(desafios);
  if(P.length) sheets.push({ name:'Percepción de riesgo', cols:[70,40,12,12], head:['Pregunta (encuesta anónima)','Opción','Respuestas','%'],
    rows:P.flatMap(p => p.opciones.map((o, i) => [i ? '' : p.q, o, p.dist[i], xlPct(p.pcts[i])])) });
  return { sheets, R, pers, s, ad, E };
}

function excelGeneral(D, f){
  const { sheets, R, pers, s, ad, E } = hojasDetalle(D.regs, D.jornadas, D.nomina, D.desafios, D.diags);
  const periodo = { '12':'Últimos 12 meses', anio:'Este año', todo:'Todo el historial' }[f.periodo] || '';
  const resumen = { name:'Resumen', title:`${CONFIG.consultora.nombre} · Tablero de capacitación`,
    subtitle:`${CONFIG.capacitacion.nombre} · ${periodo}${f.empresa ? ' · ' + f.empresa : ''}${f.tipo ? ' · ' + f.tipo : ''} · Generado el ${fmtDate(new Date())}`,
    cols:[34,18,50], head:['Indicador','Valor','Detalle'], rows:[
      ['Trabajadores capacitados', pers.length, `${R.n} registros`],
      ['Jornadas', D.jornadas.length, `${E.length} empresas`],
      ['Aprobación', xlPct(R.pctAprob), `${R.aprobados} de ${R.evaluados} evaluados (criterio ${CONFIG.aprobacion.porcentajeMinimo} %)`],
      ['Puntaje promedio', xlPct(R.promedio), ''],
      ['Asistencia firmada', R.firmados, ''],
      ['Satisfacción promedio (1 a 5)', s.prom ?? '', s.n ? `${s.n} respuestas · ${s.pctPos} % calificó 4 o 5` : 'Sin datos'],
      ['Aciertos antes → después', ad.pre != null ? `${ad.pre} % → ${ad.post} %` : '', ad.n ? `${ad.n} diagnósticos anónimos` : 'Sin datos'],
      ['Vigencia del certificado', REP.vigenciaMeses ? `${REP.vigenciaMeses} meses` : 'Sin vencimiento', 'Definida por la consultora (no es un plazo legal)']
    ] };
  XLSX.download(`tablero_capacitacion_${isoLocal(new Date())}.xlsx`, [resumen, ...sheets]);
}
