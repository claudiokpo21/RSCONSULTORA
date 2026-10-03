'use strict';
/* documento.js — DOCUMENTOS A4 DE ADMINISTRACIÓN
   ?doc=cert&j=<jornada>[&r=<registro>]  Certificado de aprobación / constancia de asistencia (uno o todos)
   ?doc=ind&j=<jornada>[&r=<registro>]   Informe individual (uno o todos los de la jornada)
   ?doc=empresa&e=<empresa>              Informe consolidado por empresa
   Requiere sesión de administrador. RS Consultora · Fatiga y Conducción Segura */

const root = $('#report'), QS = new URLSearchParams(location.search);
const DOC = QS.get('doc'), JID = QS.get('j'), RID = QS.get('r'), EMP = QS.get('e');
const MIN = CONFIG.aprobacion.porcentajeMinimo;
const kpi = (label, value, sub) => `<div class="r-kpi"><span>${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
const fdate = d => d ? fmtDate(An.day(d) + 'T12:00:00') : '–';
function msg(t, b){ root.innerHTML = toolbarMsg(t, b); }
function brandHead(label){ return sheetHead({ codigo:'' }, label); }

/* =====================================================================
   CERTIFICADO DE APROBACIÓN / CONSTANCIA DE ASISTENCIA
   ===================================================================== */
function tipoCert(r){ return r.estado === 'APROBADO' ? 'aprob' : (r.firma || r.firmado || r.estado === 'NO APROBADO') ? 'asist' : null; }
function certHTML(r, j){
  const ap = tipoCert(r) === 'aprob', fecha = j ? j.fecha : (r.fecha || r.fecha_fin || r.created_at), vence = ap ? An.vence(fecha) : null;
  const nombre = `${r.nombre} ${r.apellido}`, emp = (j && j.empresa) || r.empresa, cap = (j && j.capacitador) || r.capacitador || capacitador();
  return `<section class="sheet cert-sheet ${ap ? 'aprob' : 'asist'}">
    <div class="c-frame">
      <div class="c-top"><div class="r-brand"><span class="r-mark">${esc(CONFIG.consultora.iniciales)}</span><div><b>${esc(CONFIG.consultora.nombre)}</b><small>Higiene y Seguridad · Capacitación</small></div></div>
        <div class="r-meta">Código del curso: ${esc(CONFIG.capacitacion.codigo)}<br>${r.verificacion ? `Verificación: <b>${esc(r.verificacion)}</b>` : ''}</div></div>
      <p class="c-kind">${ap ? 'Certificado de aprobación' : 'Constancia de asistencia'}</p>
      <h1 class="c-name">${esc(nombre)}</h1>
      <p class="c-id">Legajo ${esc(r.legajo)}${emp ? ` · ${esc(emp)}` : ''}${r.sector ? ` · ${esc(r.sector)}` : ''}</p>
      <p class="c-body">${ap
        ? `aprobó la capacitación <b>“${esc((j && j.capacitacion) || CONFIG.capacitacion.nombre)}”</b>${REP.mostrarNotaEnCertificado ? `, con un resultado de <b>${r.porcentaje} %</b> en la evaluación final (criterio de aprobación: ${r.criterio || MIN} %)` : ', habiendo aprobado la evaluación final'}.`
        : `asistió a la capacitación <b>“${esc((j && j.capacitacion) || CONFIG.capacitacion.nombre)}”</b>.`}</p>
      <table class="c-data">
        <tr><th>Fecha</th><td>${fdate(fecha)}</td><th>Modalidad</th><td>Presencial</td></tr>
        <tr><th>Lugar</th><td>${esc((j && j.lugar) || '–')}</td><th>Capacitador</th><td>${esc(cap)}</td></tr>
        ${ap ? `<tr><th>${REP.mostrarNotaEnCertificado ? 'Resultado' : 'Estado'}</th><td>${REP.mostrarNotaEnCertificado ? `${r.porcentaje} % (${r.correctas ?? '–'} de ${r.preguntas ?? CONTENT.quiz.length})` : 'Aprobado'}</td><th>Válido hasta</th><td>${vence ? fmtDate(vence) : 'Sin vencimiento'}</td></tr>` : ''}
      </table>
      ${ap ? '' : `<p class="c-note">Esta constancia acredita la asistencia a la capacitación. No acredita la aprobación de la evaluación.</p>`}
      <div class="c-signs">
        <div><span class="c-sig">${r.firma ? `<img src="${r.firma}" alt="Firma de ${esc(nombre)}">` : ''}</span><span class="c-line">Firma del participante</span></div>
        <div><span class="c-sig"></span><span class="c-line">${esc(cap)}<br>${esc(CONFIG.consultora.rol)} · ${esc(CONFIG.consultora.nombre)}</span></div>
      </div>
      ${r.verificacion ? `<div class="c-verify"><div class="c-qr">${qrSVG(verifyUrl(r.verificacion))}</div><p><b>Documento verificable.</b> Escaneá el código QR o ingresá en ${esc(new URL('verificar.html', location.href).href.replace(/^https?:\/\//, ''))} el código <b>${esc(r.verificacion)}</b>.</p></div>` : ''}
      <p class="c-foot">Emitido el ${fmtDate(new Date())}.${ap && REP.vigenciaMeses ? ` La vigencia de ${REP.vigenciaMeses} meses es un criterio de ${esc(CONFIG.consultora.nombre)}, no un plazo legal.` : ''} ${ap ? 'La aprobación refleja' : 'La capacitación aborda'} la comprensión de los contenidos y no constituye una evaluación médica ni de aptitud laboral.</p>
    </div>
  </section>`;
}
function renderCerts(regs, j){
  const all = regs.filter(tipoCert);
  const filt = QS.get('f') || 'todos';
  const list = all.filter(r => filt === 'todos' || (filt === 'aprob' ? tipoCert(r) === 'aprob' : tipoCert(r) === 'asist'));
  const nA = all.filter(r => tipoCert(r) === 'aprob').length, nS = all.length - nA;
  document.title = `Certificados${j ? ' · ' + j.empresa : ''} · RS Consultora`;
  $('#tbTitle').textContent = RID ? (tipoCert(all[0] || {}) === 'aprob' ? 'Certificado de aprobación' : 'Constancia de asistencia') : `Certificados · ${j ? j.empresa + ' · ' + j.codigo : ''}`;
  if(!RID && all.length){
    $('#tbExtra').innerHTML = `<select id="cFilt" aria-label="Qué certificados mostrar"><option value="todos">Todos (${all.length})</option><option value="aprob">Aprobación (${nA})</option><option value="asist">Asistencia (${nS})</option></select>`;
    $('#cFilt').value = filt; $('#cFilt').onchange = e => { const u = new URL(location.href); u.searchParams.set('f', e.target.value); location.href = u.href; };
  }
  if(!list.length) return msg('Sin certificados para emitir', 'No hay participantes aprobados ni con asistencia firmada en esta selección.');
  root.innerHTML = list.map(r => certHTML(r, j)).join('');
}

/* =====================================================================
   INFORME INDIVIDUAL
   ===================================================================== */
function individualHTML(r, j, grupo, historial){
  const Q = CONTENT.quiz, tiene = Array.isArray(r.respuestas) && r.respuestas.length === Q.length;
  const fallados = tiene ? Q.map((q, k) => r.respuestas[k] === q.c ? -1 : k).filter(k => k >= 0) : [];
  const G = An.resumen(grupo), vig = r.estado === 'APROBADO' ? An.estadoVigencia(j ? j.fecha : r.fecha) : null;
  const st = r.estado === 'APROBADO' ? 'ok' : r.estado === 'NO APROBADO' ? 'bad' : 'pend';
  return `<section class="sheet ind">
    ${brandHead("Informe individual")}
    <h1 class="r-title">Informe individual de capacitación</h1>
    <p class="r-sub">${esc((j && j.capacitacion) || CONFIG.capacitacion.nombre)}</p>
    <table class="r-data">
      <tr><th>Apellido y nombre</th><td><b>${esc(r.apellido)}, ${esc(r.nombre)}</b></td><th>Legajo</th><td>${esc(r.legajo)}</td></tr>
      <tr><th>Empresa</th><td>${esc((j && j.empresa) || r.empresa || '–')}</td><th>Sector</th><td>${esc(r.sector || '–')}</td></tr>
      <tr><th>Tipo de vehículo</th><td>${esc(r.tipo_vehiculo || '–')}</td><th>Fecha</th><td>${fdate(j ? j.fecha : r.fecha)}</td></tr>
      <tr><th>Jornada</th><td>${esc(j ? j.codigo + (j.lugar ? ' · ' + j.lugar : '') : 'Sin jornada')}</td><th>Capacitador</th><td>${esc((j && j.capacitador) || r.capacitador || capacitador())}</td></tr>
    </table>
    <div class="i-result">
      <div class="i-score ${st}"><b>${r.porcentaje != null ? r.porcentaje + ' %' : '–'}</b><span>${esc(r.estado)}</span></div>
      <div class="r-kpis i-kpis">
        ${kpi('Respuestas correctas', r.correctas != null ? `${r.correctas} de ${r.preguntas}` : '–')}
        ${kpi('Intentos', r.intentos || 0)}
        ${kpi('Promedio del grupo', G.promedio != null ? G.promedio + ' %' : '–', `${G.evaluados} evaluados`)}
        ${kpi('Vigencia', vig ? (vig.vence ? fmtDate(vig.vence) : 'Sin venc.') : '–', vig ? vig.estado : 'requiere aprobación')}
      </div>
    </div>
    <h2 class="r-h2">Resultado por tema</h2>
    ${tiene ? `<ul class="i-grid">${Q.map((q, k) => { const ok = r.respuestas[k] === q.c; return `<li class="${ok ? 'ok' : 'x'}"><b>${ok ? '✓' : '✗'}</b>${esc(tema(k))}<span>${ok ? 'Correcta' : 'Incorrecta'}</span></li>`; }).join('')}</ul>
      ${fallados.length ? `<h3 class="r-h3">Para reforzar</h3><ul class="i-ref">${fallados.map(k => `<li><b>${esc(tema(k))}:</b> ${esc(Q[k].e)}</li>`).join('')}</ul>` : ''}` : '<p class="r-empty">No hay respuestas registradas para el detalle por tema.</p>'}
    <h2 class="r-h2">Recomendación</h2>
    <p class="r-conc">${esc(An.recomendacion(r, fallados))}</p>
    <div class="r-two i-bottom">
      <div><h3 class="r-h3">Historial de capacitaciones</h3>
        <table class="r-mini">${historial.length ? historial.slice(0, 4).map(h => `<tr><td>${fdate(h.fecha)}</td><td>${esc(h.jornada_codigo || '–')}</td><td>${h.porcentaje != null ? h.porcentaje + ' %' : '–'}</td><td>${esc(h.estado)}</td></tr>`).join('') : '<tr><td>Sin registros anteriores</td></tr>'}</table></div>
      <div><h3 class="r-h3">Asistencia</h3>
        <div class="i-firma">${r.firma ? `<img src="${r.firma}" alt="Firma de ${esc(r.apellido)}">` : '<span class="nofirma">Sin firma registrada</span>'}</div>
        <p class="r-note">${r.verificacion ? `Código de verificación: <b>${esc(r.verificacion)}</b>` : ''}</p></div>
    </div>
    <div class="r-sign i-sign"><p>El resultado refleja la comprensión de los contenidos de la capacitación. No constituye una evaluación médica ni de aptitud laboral.</p><div><span class="line"></span>${esc((j && j.capacitador) || capacitador())}<br>${esc(CONFIG.consultora.rol)} · ${esc(CONFIG.consultora.nombre)}</div></div>
  </section>`;
}
function renderIndividual(regs, j, grupo, todos){
  const list = regs.filter(r => r.estado !== 'SIN COMPLETAR' || r.firma);
  document.title = `Informe individual · RS Consultora`;
  $('#tbTitle').textContent = RID ? 'Informe individual' : `Informes individuales · ${j ? j.empresa + ' · ' + j.codigo : ''} (${list.length})`;
  if(!list.length) return msg('Sin informes para emitir', 'No hay participantes con evaluación o asistencia registrada.');
  root.innerHTML = list.map(r => {
    const hist = (todos || []).filter(h => h.id !== r.id && String(h.legajo).toUpperCase() === String(r.legajo).toUpperCase() && An.key(h.empresa) === An.key((j && j.empresa) || r.empresa))
      .sort((a, b) => An.day(b.fecha).localeCompare(An.day(a.fecha)));
    return individualHTML(r, j, grupo, hist);
  }).join('');
}

/* =====================================================================
   INFORME POR EMPRESA
   ===================================================================== */
function conclusionEmpresa(e, pp, ad, mapa){
  if(!e.evaluados) return 'Todavía no hay evaluaciones registradas para esta empresa.';
  let t = `Se capacitaron ${e.trabajadores} trabajadores en ${e.jornadas.length} jornada${e.jornadas.length === 1 ? '' : 's'}, con un ${e.pctAprob} % de aprobación (criterio ${MIN} %).`;
  if(e.nominaN) t += ` La cobertura de la nómina con capacitación vigente es del ${e.cobertura} % (${e.cubiertos} de ${e.nominaN}); quedan ${e.pendientes.length} trabajadores por capacitar.`;
  const pv = e.porVencer ? `${e.porVencer} certificado${e.porVencer === 1 ? '' : 's'} por vencer` : '', vc = e.vencidos ? `${e.vencidos} vencido${e.vencidos === 1 ? '' : 's'}` : '';
  if(pv || vc) t += ` Hay ${[pv, vc].filter(Boolean).join(' y ')}: se recomienda programar una recapacitación.`;
  const low = pp.filter(x => x.pct != null && x.pct < MIN).sort((a, b) => a.pct - b.pct).slice(0, 3);
  if(low.length) t += ` Los temas a reforzar son: ${low.map(x => `${tema(x.k).toLowerCase()} (${x.pct} %)`).join(', ')}.`;
  const peor = mapa.filter(r => r.n >= 3 && r.prom < MIN)[0];
  if(peor) t += ` El sector con menor desempeño es ${peor.grupo} (${peor.prom} % promedio).`;
  if(ad.pre != null && ad.post != null) t += ` Los aciertos del grupo pasaron de ${ad.pre} % antes de la capacitación a ${ad.post} % después.`;
  return t;
}
function renderEmpresa(e, T){
  const ids = new Set(e.jornadas.map(j => j.id)), pp = An.porPregunta(e.regs), ad = An.antesDespues(T.diagnosticos.filter(d => ids.has(d.jornada_id)), e.regs);
  const P = An.percepcion(T.desafios.filter(d => ids.has(d.jornada_id))), mS = An.mapa(e.regs, 'sector'), mT = An.mapa(e.regs, 'tipo_vehiculo');
  const fechas = e.jornadas.map(j => j.fecha).sort(), desde = fechas[0], hasta = fechas[fechas.length - 1];
  const pers = e.personas.slice().sort((a, b) => String(a.apellido).localeCompare(String(b.apellido), 'es'));
  const vigCls = v => v === 'vigente' ? 'ok' : v === 'por vencer' ? 'warn' : 'bad';
  document.title = `Informe ${e.nombre} · RS Consultora`;
  $('#tbTitle').textContent = `Informe por empresa · ${e.nombre}`;
  $('#tbExtra').innerHTML = `<button id="tbXlsx"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> Excel</button>`;
  $('#tbXlsx').onclick = () => { const { sheets } = hojasDetalle(e.regs, e.jornadas, e.nomina, T.desafios.filter(d => ids.has(d.jornada_id)), T.diagnosticos.filter(d => ids.has(d.jornada_id))); XLSX.download(`informe_${e.nombre.replace(/[^\wÁÉÍÓÚÑáéíóúñ]+/g, '_').slice(0, 40)}_${isoLocal(new Date())}.xlsx`, sheets.filter(s => s.name !== 'Empresas')); };
  const head = () => brandHead("Informe por empresa");
  root.innerHTML = `
  <section class="sheet">
    ${head()}
    <h1 class="r-title">Informe de capacitación por empresa</h1>
    <p class="r-sub">${esc(CONFIG.capacitacion.nombre)}</p>
    <table class="r-data">
      <tr><th>Empresa</th><td><b>${esc(e.nombre)}</b></td><th>Período</th><td>${desde ? `${fdate(desde)} al ${fdate(hasta)}` : '–'}</td></tr>
      <tr><th>Jornadas</th><td>${e.jornadas.length}</td><th>Consultora</th><td>${esc(CONFIG.consultora.nombre)}</td></tr>
    </table>
    <h2 class="r-h2">Resumen</h2>
    <div class="r-kpis">
      ${kpi('Trabajadores capacitados', e.trabajadores, `${e.n} registros`)}
      ${kpi('Aprobación', e.pctAprob != null ? e.pctAprob + ' %' : '–', `${e.aprobados} aprobados`)}
      ${kpi('Puntaje promedio', e.promedio != null ? e.promedio + ' %' : '–', `criterio ${MIN} %`)}
      ${kpi('Satisfacción', e.sat.prom != null ? e.sat.prom.toFixed(1).replace('.', ',') + ' / 5' : '–', e.sat.n ? `${e.sat.n} respuestas` : 'sin datos')}
    </div>
    <h2 class="r-h2">Vigencia de los certificados</h2>
    <div class="r-kpis">
      ${kpi('Vigentes', e.vigentes)}${kpi('Por vencer', e.porVencer, `próximos ${REP.avisoVencimientoDias} días`)}${kpi('Vencidos', e.vencidos)}
      ${kpi('Cobertura de nómina', e.cobertura != null ? e.cobertura + ' %' : '–', e.nominaN ? `${e.cubiertos} de ${e.nominaN}` : 'nómina no cargada')}
    </div>
    <p class="r-note" style="margin-top:2mm">Vigencia de ${REP.vigenciaMeses ? REP.vigenciaMeses + ' meses desde la aprobación' : 'sin vencimiento'} (criterio de ${esc(CONFIG.consultora.nombre)}; no es un plazo legal).</p>
    <h2 class="r-h2">Jornadas realizadas</h2>
    <table class="r-att"><thead><tr><th>Fecha</th><th>Código</th><th>Lugar</th><th>Capacitador</th><th>Participantes</th><th>Aprobación</th></tr></thead>
      <tbody>${e.jornadas.slice().sort((a, b) => String(a.fecha).localeCompare(b.fecha)).map(j => { const rs = e.regs.filter(r => r.jornada_id === j.id), R = An.resumen(rs);
        return `<tr><td>${fdate(j.fecha)}</td><td>${esc(j.codigo)}</td><td>${esc(j.lugar || '–')}</td><td>${esc(j.capacitador)}</td><td>${R.n}</td><td>${R.pctAprob != null ? R.pctAprob + ' %' : '–'}</td></tr>`; }).join('')}</tbody></table>
    <h2 class="r-h2">Conclusiones y recomendaciones</h2>
    <p class="r-conc">${esc(conclusionEmpresa(e, pp, ad, mS))}</p>
    <div class="r-sign" style="margin-top:10mm"><div><span class="line"></span>${esc(capacitador())}<br>${esc(CONFIG.consultora.rol)} · ${esc(CONFIG.consultora.nombre)}</div></div>
  </section>

  <section class="sheet">
    ${head()}
    <h2 class="r-h2">Aciertos por tema</h2>
    <p class="r-note">Porcentaje de evaluados que respondió correctamente cada tema (todas las jornadas). La línea marca el criterio de aprobación.</p>
    ${pp[0].n ? hbarChart(pp.map(x => ({ label:`${x.k + 1}. ${tema(x.k)}`, value:x.pct, text:x.pct + ' %', hint:x.q.q })), { max:100, unit:'%', ref:{ value:MIN, label:`Criterio ${MIN} %` }, labelW:230, rightW:56, title:'Aciertos por tema', bh:15, gap:9 }) : '<p class="r-empty">Sin respuestas registradas.</p>'}
    <h2 class="r-h2">Mapa de riesgo por sector</h2>
    <p class="r-note">Dónde concentrar el refuerzo: % de acierto de cada sector en cada tema.</p>
    ${mapaTabla(mS, 'Sector')}
    <h2 class="r-h2">Mapa de riesgo por tipo de vehículo</h2>
    ${mapaTabla(mT, 'Tipo de vehículo')}
  </section>

  <section class="sheet">
    ${head()}
    <h2 class="r-h2">Antes y después de la capacitación</h2>
    ${ad.n ? `<p class="r-note">${ad.n} diagnósticos anónimos al inicio vs. evaluación final. Aciertos del grupo: <b>${ad.pre} %</b> → <b>${ad.post} %</b>.</p>${antesDespuesChart(ad)}` : '<p class="r-empty">No se registraron diagnósticos iniciales.</p>'}
    <h2 class="r-h2">Satisfacción de los participantes</h2>
    ${satisfaccionHTML(e.sat)}
    <h2 class="r-h2">Percepción de riesgo</h2>
    ${percepcionHTML(P)}
  </section>

  <section class="sheet">
    ${head()}
    <h2 class="r-h2">Estado de los trabajadores capacitados</h2>
    <p class="r-note">Última capacitación de cada trabajador y vigencia de su certificado.</p>
    <table class="r-att"><thead><tr><th>Legajo</th><th>Apellido y nombre</th><th>Sector</th><th>Última</th><th>Resultado</th><th>Estado</th><th>Vence</th><th>Vigencia</th></tr></thead>
      <tbody>${pers.map(p => { const u = p.ultimo; return `<tr><td>${esc(p.legajo)}</td><td>${esc(p.apellido)}, ${esc(p.nombre)}</td><td>${esc(p.sector || '–')}</td><td>${fdate(u.fecha)}</td>
        <td>${u.porcentaje != null ? u.porcentaje + ' %' : '–'}</td><td>${esc(u.estado)}</td><td>${p.vig.vence ? fmtDate(p.vig.vence) : '–'}</td><td><span class="vg ${vigCls(p.vig.estado)}">${esc(p.vig.estado)}</span></td></tr>`; }).join('')}</tbody></table>
    ${e.nominaN ? `<h2 class="r-h2">Pendientes de la nómina (${e.pendientes.length})</h2>
      ${e.pendientes.length ? `<table class="r-att"><thead><tr><th>Legajo</th><th>Apellido y nombre</th><th>Sector</th><th>Situación</th></tr></thead><tbody>${e.pendientes.map(n => { const p = e.personas.find(x => x.legajo === String(n.legajo).toUpperCase());
        return `<tr><td>${esc(n.legajo)}</td><td>${esc(n.apellido || '')}${n.nombre ? ', ' + esc(n.nombre) : ''}</td><td>${esc(n.sector || '–')}</td><td>${p ? (p.vig.estado === 'vencido' ? 'Certificado vencido' : 'Sin aprobar') : 'Sin capacitar'}</td></tr>`; }).join('')}</tbody></table>`
        : '<p>Toda la nómina tiene la capacitación vigente.</p>'}` : ''}
  </section>`;
}

/* =====================================================================
   INICIO
   ===================================================================== */
(async function init(){
  $('#tbPrint').onclick = () => window.print();
  if(!['cert', 'ind', 'empresa'].includes(DOC)) return msg('Documento no encontrado', 'Abrí los documentos desde Administración.');
  if(!Central.enabled()) return msg('Registro central no configurado', 'Los documentos necesitan el registro central (Supabase).');
  try{
    const s = await Central.session();
    if(!s) return msg('Iniciá sesión', 'Para ver los documentos, iniciá sesión en Administración en este mismo navegador y volvé a abrirlo.');
    if(DOC === 'empresa'){
      const jornadas = await Central.rpc('rs_admin_jornadas') || [];
      const T = await Datos.tablero(jornadas);
      const e = An.empresas(T.registros, jornadas, T.nomina).find(x => x.key === An.key(EMP));
      if(!e) return msg('Empresa no encontrada', 'No hay jornadas ni registros para esa empresa.');
      return renderEmpresa(e, T);
    }
    let regs, j = null, grupo, todos = null;
    if(JID && /^[0-9a-f-]{36}$/i.test(JID)){
      const data = await Central.rpc('rs_admin_informe', { p_id:JID });
      if(!data || !data.jornada) return msg('Jornada no encontrada', 'La jornada no existe o fue eliminada.');
      j = data.jornada; grupo = data.registros || []; regs = grupo.map(r => ({ ...r, fecha:j.fecha, empresa:j.empresa, jornada_codigo:j.codigo }));
    }else{
      const T = await Datos.tablero(); todos = T.registros;
      regs = T.registros.filter(r => r.id === RID); grupo = regs;
      // Evaluación sin jornada: el resumen del tablero no trae la imagen de la firma; se pide el registro completo.
      if(regs.length && RID){
        try{ const full = await Central.rpc('rs_admin_registro', { p_id:RID }); if(full) regs = grupo = [{ ...regs[0], ...full, fecha:regs[0].fecha }]; }
        catch(e){ if(!Datos.faltaFuncion(e)) throw e; }
      }
    }
    if(RID) regs = regs.filter(r => r.id === RID);
    if(!regs.length) return msg('Registro no encontrado', 'El participante no existe o fue eliminado.');
    if(DOC === 'cert') return renderCerts(regs, j);
    if(!todos){ try{ todos = (await Datos.tablero()).registros; }catch(_){ todos = []; } }
    renderIndividual(regs, j, grupo, todos);
  }catch(e){
    msg('No se pudo cargar', esc(e.code === '42501' ? 'Tu usuario no tiene permisos de administrador.' : Central.isNetworkError(e) ? 'Sin conexión a internet.' : e.message));
  }
})();
