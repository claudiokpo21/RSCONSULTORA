'use strict';
/* admin-tablero.js — TABLERO GENERAL DE RS CONSULTORA (pestaña de Administración)
   Indicadores, actividad por mes, temas más difíciles, mapa de riesgo por sector / vehículo,
   comparación entre empresas, antes y después, satisfacción y percepción de riesgo.
   Usa AC (admin-central.js), An (analitica.js) y Datos (datos.js).
   RS Consultora · Fatiga y Conducción Segura */

const TB = { f:{ empresa:'', periodo:'12', tipo:'' }, dim:'sector' };
const SHORT = ['Definición','Señales','Microsueño','Factores','Sueño','Livianos','Pesados','Prevención','Café','Qué hacer'];
const C_PRE = '#3987e5', C_POST = '#c98500', C_BAR = '#f5b301';

/* ---------- Filtros ---------- */
function tbDesde(){
  const now = new Date();
  if(TB.f.periodo === '12'){ const d = new Date(now.getFullYear(), now.getMonth() - 11, 1); return isoLocal(d); }
  if(TB.f.periodo === 'anio') return now.getFullYear() + '-01-01';
  return '';
}
function tbData(){
  const T = AC.T || { registros:[], desafios:[], diagnosticos:[], nomina:[] }, desde = tbDesde(), ek = An.key(TB.f.empresa);
  const okE = e => !ek || An.key(e) === ek, okF = f => !desde || An.day(f) >= desde;
  const jornadas = AC.jornadas.filter(j => okE(j.empresa) && okF(j.fecha)), jids = new Set(jornadas.map(j => j.id));
  const regs = T.registros.filter(r => okE(r.empresa) && okF(r.fecha) && (!TB.f.tipo || r.tipo_vehiculo === TB.f.tipo));
  return { jornadas, regs, desafios:T.desafios.filter(d => jids.has(d.jornada_id)), diags:T.diagnosticos.filter(d => jids.has(d.jornada_id)),
    nomina:T.nomina.filter(n => okE(n.empresa)), todos:T.registros };
}
function tbEmpresas(){ const s = new Map(); AC.jornadas.forEach(j => s.set(An.key(j.empresa), j.empresa)); (AC.T ? AC.T.registros : []).forEach(r => r.empresa && !s.has(An.key(r.empresa)) && s.set(An.key(r.empresa), r.empresa)); return [...s.values()].sort((a, b) => a.localeCompare(b, 'es')); }

/* ---------- Piezas gráficas (SVG / HTML, tema oscuro) ---------- */
function colChart(rows, title){
  const W = 640, H = 210, L = 30, B = 26, T = 18, max = Math.max(1, ...rows.map(r => r.n)), step = (W - L) / rows.length, bw = Math.min(24, step * .55);
  const tstep = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].find(s => max / s <= 4) || 1000, nice = Math.ceil(max / tstep) * tstep;
  const sy = v => T + (H - T - B) * (1 - v / nice), ticks = Array.from({ length: nice / tstep + 1 }, (_, i) => i * tstep);
  return `<svg class="tb-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
    ${ticks.map(t => `<line x1="${L}" x2="${W}" y1="${sy(t)}" y2="${sy(t)}" class="grid"/><text x="${L - 6}" y="${sy(t) + 4}" class="tick" text-anchor="end">${t}</text>`).join('')}
    ${rows.map((r, i) => { const x = L + i * step + (step - bw) / 2, y = sy(r.n), h = sy(0) - y;
      return `<g><title>${esc(r.label)}: ${r.n} participante${r.n === 1 ? '' : 's'} · ${r.aprob} aprobado${r.aprob === 1 ? '' : 's'} · ${r.jornadas} jornada${r.jornadas === 1 ? '' : 's'}</title>
        <rect x="${x - 4}" y="${T}" width="${bw + 8}" height="${H - T - B}" fill="transparent"/>
        ${h > 0 ? `<path d="M${x},${sy(0)}V${y + 4}Q${x},${y} ${x + 4},${y}H${x + bw - 4}Q${x + bw},${y} ${x + bw},${y + 4}V${sy(0)}Z" fill="${C_BAR}"/>
        <text x="${x + bw / 2}" y="${y - 5}" class="val" text-anchor="middle">${r.n}</text>` : ''}
        <text x="${x + bw / 2}" y="${H - 8}" class="tick" text-anchor="middle">${esc(r.label)}</text></g>`; }).join('')}
  </svg>`;
}
function temasHTML(pp){
  const min = CONFIG.aprobacion.porcentajeMinimo, rows = pp.filter(x => x.pct != null).sort((a, b) => a.pct - b.pct);
  if(!rows.length) return `<p class="muted sm">Todavía no hay evaluaciones con respuestas en este período.</p>`;
  return `<div class="tb-bars">${rows.map(x => { const low = x.pct < min; return `<div class="tb-row ${low ? 'low' : ''}" title="${esc(x.q.q)} — ${x.ok} de ${x.n} correctas">
      <span class="lb">${low ? ic('alert') : ''}${esc(tema(x.k))}</span>
      <span class="trk"><i style="width:${x.pct}%"></i><b class="ref" style="left:${min}%"></b></span><span class="vl">${x.pct}%</span></div>`; }).join('')}</div>
    <p class="tb-note"><span class="ref-key"></span> Criterio de aprobación (${min} %) · ${ic('alert')} debajo del criterio</p>`;
}
function mapaHTML(regs){
  const rows = An.mapa(regs, TB.dim);
  if(!rows.length) return `<p class="muted sm">Sin evaluaciones con respuestas en este período.</p>`;
  return `<div class="tb-heat-wrap"><table class="tb-heat">
    <thead><tr><th>${TB.dim === 'sector' ? 'Sector' : 'Vehículo'}</th><th class="n">n</th>${SHORT.map((s, k) => `<th title="${esc(tema(k))}">${esc(s)}</th>`).join('')}<th>Prom.</th></tr></thead>
    <tbody>${rows.map(r => `<tr class="${r.n < 3 ? 'few' : ''}"><th>${esc(r.grupo)}</th><td class="n">${r.n}</td>
      ${r.cells.map((p, k) => { const c = riskColor(p); return `<td style="background:${c.bg};color:${c.ink}" title="${esc(r.grupo)} · ${esc(tema(k))}: ${p}% de acierto (${r.n} evaluados)">${p}</td>`; }).join('')}
      <td class="pr">${r.prom}%</td></tr>`).join('')}</tbody></table></div>
    <div class="tb-legend">${riskLegendItems().map(i => `<span><i style="background:${i.bg}"></i>${esc(i.t)}</span>`).join('')}<span class="muted">· % de acierto por tema · <span style="color:var(--amber)">*</span> rayado: menos de 3 evaluados, interpretar con cautela</span></div>`;
}
function empresasTablaHTML(E){
  if(!E.length) return `<p class="muted sm">Sin empresas en este período.</p>`;
  return `<div class="table-wrap"><table class="data tb-emp"><thead><tr><th>Empresa</th><th>Jornadas</th><th>Participantes</th><th>Aprobación</th><th>Promedio</th><th>Satisfacción</th><th>Última</th><th></th></tr></thead>
    <tbody>${E.map(e => `<tr><td><b>${esc(e.nombre)}</b></td><td>${e.jornadas.length}</td><td>${e.n}</td>
      <td><span class="tb-mini"><i style="width:${e.pctAprob || 0}%"></i></span> ${e.pctAprob != null ? e.pctAprob + '%' : '–'}</td>
      <td>${e.promedio != null ? e.promedio + '%' : '–'}</td><td>${e.sat.prom != null ? e.sat.prom.toFixed(1).replace('.', ',') + ' / 5' : '–'}</td>
      <td>${e.ultima ? fmtDate(e.ultima + 'T12:00:00') : '–'}</td>
      <td><a class="btn sm ghost" href="documento.html?doc=empresa&e=${encodeURIComponent(e.nombre)}" target="_blank" rel="noopener">${ic('clipboard')} Informe</a></td></tr>`).join('')}</tbody></table></div>`;
}
function antesDespuesHTML(ad){
  if(Datos.v2 === false) return `<p class="muted sm">${ic('info')} ${Datos.avisoV2()}</p>`;
  if(!ad.n) return `<p class="muted sm">Sin diagnósticos iniciales en este período. Mostrá el QR del diagnóstico al comenzar la jornada (pestaña Jornadas → Links y QR).</p>`;
  return `<div class="tb-pp-head"><div><small>Antes</small><b style="color:${C_PRE}">${ad.pre ?? '–'}%</b></div>${ic('arrow')}<div><small>Después</small><b style="color:${C_POST}">${ad.post ?? '–'}%</b></div>
      <p class="muted sm">${ad.n} diagnóstico${ad.n === 1 ? '' : 's'} anónimo${ad.n === 1 ? '' : 's'} · mismas ${ad.items.length} preguntas</p></div>
    <div class="tb-pp">${ad.items.map(x => `<div class="tb-pp-row"><span class="lb" title="${esc(x.q.q)}">${esc(tema(x.k))}</span>
      <span class="trk2"><i style="width:${x.pre || 0}%;background:${C_PRE}"></i></span><span class="vl">${x.pre ?? '–'}%</span>
      <span class="trk2"><i style="width:${x.post || 0}%;background:${C_POST}"></i></span><span class="vl">${x.post ?? '–'}%</span></div>`).join('')}</div>
    <div class="tb-legend"><span><i style="background:${C_PRE}"></i>Antes (diagnóstico)</span><span><i style="background:${C_POST}"></i>Después (evaluación)</span></div>`;
}
function satisfHTML(s){
  if(Datos.v2 === false) return `<p class="muted sm">${ic('info')} ${Datos.avisoV2()}</p>`;
  if(!s.n) return `<p class="muted sm">Todavía no hay calificaciones en este período.</p>`;
  const max = Math.max(1, ...s.dist);
  return `<div class="tb-sat"><div class="big"><b>${s.prom.toFixed(1).replace('.', ',')}</b><span>de 5 · ${s.n} respuesta${s.n === 1 ? '' : 's'}</span><span class="pos">${s.pctPos}% calificó 4 o 5</span></div>
    <div class="tb-bars">${[5,4,3,2,1].map(v => `<div class="tb-row" title="${s.dist[v - 1]} calificaciones de ${v}"><span class="lb">${'★'.repeat(v)}</span><span class="trk"><i style="width:${s.dist[v - 1] / max * 100}%"></i></span><span class="vl">${s.dist[v - 1]}</span></div>`).join('')}</div></div>
    ${s.comentarios.length ? `<p class="tb-sub">Comentarios recientes (anónimos)</p><ul class="tb-com">${s.comentarios.slice(-4).reverse().map(c => `<li>“${esc(c)}”</li>`).join('')}</ul>` : ''}`;
}
function percepcionHTML(P){
  if(!P.length) return `<p class="muted sm">Sin encuestas del desafío en vivo guardadas en este período (se guardan al terminar el desafío con la sesión de administrador iniciada y el código de jornada).</p>`;
  return P.map(p => { const top = p.pcts.indexOf(Math.max(...p.pcts)); return `<div class="tb-perc"><p class="q">${esc(p.q)}</p>
    <div class="tb-bars">${p.opciones.map((o, i) => `<div class="tb-row ${i === top ? 'top' : ''}" title="${esc(o)}: ${p.dist[i]} respuestas"><span class="lb">${esc(o)}</span><span class="trk"><i style="width:${p.pcts[i]}%"></i></span><span class="vl">${p.pcts[i]}%</span></div>`).join('')}</div>
    <p class="tb-note">${p.tot} respuestas anónimas en ${p.salas} desafío${p.salas === 1 ? '' : 's'}</p></div>`; }).join('');
}

/* ---------- Pestaña ---------- */
function tableroHTML(){
  if(!AC.T) return `<div class="panel">${fb('warn','No se pudieron cargar los datos del tablero','Tocá Actualizar para reintentar.')}</div>`;
  const D = tbData(), R = An.resumen(D.regs), pers = An.personas(D.regs), s = An.satisfaccion(D.regs), ad = An.antesDespues(D.diags, D.regs);
  const E = An.empresas(D.regs, D.jornadas, D.nomina), meses = An.porMes(D.regs, 12), P = An.percepcion(D.desafios), pp = An.porPregunta(D.regs);
  const emp = new Set(D.jornadas.map(j => An.key(j.empresa)).concat(D.regs.map(r => An.key(r.empresa))).filter(Boolean)).size;
  const sel = (id, label, opts, val, all) => `<div><label for="${id}">${label}</label><select id="${id}">${all ? `<option value="">${all}</option>` : ''}${opts.map(([v, t]) => `<option value="${esc(v)}" ${val === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  const kpi = (l, v, sub, cls) => `<div class="kpi ${cls || ''}"><span>${l}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  return `${Datos.v2 === false ? `<div class="tb-banner">${fb('info','Modo compatible', 'El tablero usa los datos actuales. Satisfacción, diagnóstico (antes y después) y nómina se activan al aplicar la actualización de la base de datos (supabase/02_reportes.sql).')}</div>` : ''}
    <div class="panel tb-filters">
      <div class="filters">
        ${sel('tbE','Empresa', tbEmpresas().map(e => [e, e]), TB.f.empresa, 'Todas')}
        ${sel('tbP','Período', [['12','Últimos 12 meses'],['anio','Este año'],['todo','Todo']], TB.f.periodo)}
        ${sel('tbT','Tipo de vehículo', TIPOS.map(t => [t, t]), TB.f.tipo, 'Todos')}
      </div>
      <div class="actions" style="margin:0"><button class="btn primary sm" id="tbXlsx">${ic('download')} DESCARGAR EXCEL</button></div>
    </div>
    <div class="kpis tb-kpis">
      ${kpi('Trabajadores capacitados', pers.length, `${R.n} registro${R.n === 1 ? '' : 's'}`)}
      ${kpi('Jornadas', D.jornadas.length, `en ${emp} empresa${emp === 1 ? '' : 's'}`)}
      ${kpi('Aprobación', R.pctAprob != null ? R.pctAprob + '%' : '–', `${R.aprobados} de ${R.evaluados} evaluados`, 'ok')}
      ${kpi('Puntaje promedio', R.promedio != null ? R.promedio + '%' : '–', `criterio ${CONFIG.aprobacion.porcentajeMinimo}%`)}
      ${kpi('Satisfacción', s.prom != null ? s.prom.toFixed(1).replace('.', ',') + ' / 5' : '–', Datos.v2 === false ? 'requiere actualización' : `${s.n} respuesta${s.n === 1 ? '' : 's'}`)}
      ${kpi('Antes → después', ad.pre != null && ad.post != null ? `${ad.pre}% → ${ad.post}%` : '–', Datos.v2 === false ? 'requiere actualización' : 'aciertos del grupo')}
    </div>
    <div class="tb-grid two">
      <section class="panel"><h3 class="tb-h">Participantes por mes</h3><p class="tb-desc">Últimos 12 meses${TB.f.empresa ? ' · ' + esc(TB.f.empresa) : ''}. Pasá el mouse para ver aprobados y jornadas.</p>${colChart(meses, 'Participantes por mes')}</section>
      <section class="panel"><h3 class="tb-h">Temas: de más difícil a más fácil</h3><p class="tb-desc">% de evaluados que respondió bien cada tema.</p>${temasHTML(pp)}</section>
    </div>
    <section class="panel tb-sec"><div class="tb-sec-head"><div><h3 class="tb-h">Mapa de riesgo</h3><p class="tb-desc">Dónde está el riesgo: % de acierto por tema en cada ${TB.dim === 'sector' ? 'sector' : 'tipo de vehículo'}. Rojo = debajo del criterio.</p></div>
      <div class="seg" role="group" aria-label="Agrupar por"><button class="${TB.dim === 'sector' ? 'on' : ''}" data-dim="sector">Sector</button><button class="${TB.dim === 'tipo_vehiculo' ? 'on' : ''}" data-dim="tipo_vehiculo">Tipo de vehículo</button></div></div>
      ${mapaHTML(D.regs)}</section>
    <section class="panel tb-sec"><h3 class="tb-h">Comparación entre empresas</h3>${empresasTablaHTML(E)}</section>
    <div class="tb-grid three">
      <section class="panel"><h3 class="tb-h">Antes y después</h3><p class="tb-desc">Diagnóstico anónimo al inicio vs. evaluación final.</p>${antesDespuesHTML(ad)}</section>
      <section class="panel"><h3 class="tb-h">Satisfacción</h3><p class="tb-desc">Calificación de la capacitación (1 a 5).</p>${satisfHTML(s)}</section>
      <section class="panel"><h3 class="tb-h">Percepción de riesgo</h3><p class="tb-desc">Encuestas anónimas del desafío en vivo.</p>${percepcionHTML(P)}</section>
    </div>`;
}
function bindTablero(){
  const rerender = () => { $('#acBody').innerHTML = tableroHTML(); bindTablero(); };
  [['tbE','empresa'],['tbP','periodo'],['tbT','tipo']].forEach(([id, k]) => { const el = $('#' + id); if(el) el.onchange = () => { TB.f[k] = el.value; rerender(); }; });
  $$('[data-dim]', acEl).forEach(b => b.onclick = () => { TB.dim = b.dataset.dim; rerender(); });
  const x = $('#tbXlsx'); if(x) x.onclick = () => { const D = tbData(); excelGeneral(D, TB.f); };
}
