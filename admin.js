'use strict';
/* admin.js — ADMINISTRACIÓN (acceso con contraseña, separado de los participantes)
   RS Consultora · Fatiga y Conducción Segura */

/* =====================================================================
   ADMINISTRACIÓN (separada de la experiencia del participante)
   ===================================================================== */
const adminEl = $('#admin');
const adminFilters = { legajo:'', nombre:'', apellido:'', empresa:'', sector:'', tipo:'', estado:'', desde:'', hasta:'' };

function adminLogin(){
  dlg.innerHTML = `<h2>${ic('lock')} Acceso administrador</h2><p class="muted sm">Ingresá la contraseña configurada.</p>
    <form id="admForm"><div class="field"><label for="admPass">Contraseña</label><input id="admPass" type="password" autocomplete="current-password"></div>${CONFIG.admin.recordarEquipo ? `<label class="radio" style="margin-top:12px;display:inline-flex"><input type="checkbox" id="admRemember"> Recordar este equipo</label>` : ''}<p class="msg" id="admMsg" style="color:#ff8a8d;min-height:1.2em;font-size:.85rem;margin-top:6px"></p>
    <div class="actions"><button type="button" class="btn ghost" id="admCancel">Cancelar</button><button type="submit" class="btn primary">Ingresar</button></div></form>`;
  dlg.oncancel = e => { e.preventDefault(); location.href = 'index.html'; };
  $('#admCancel', dlg).onclick = () => { location.href = 'index.html'; };
  $('#admForm', dlg).onsubmit = e => {
    e.preventDefault();
    if($('#admPass', dlg).value === CONFIG.admin.password){ if($('#admRemember', dlg)?.checked) rememberAdmin(); dlg.close(); openAdmin(); }
    else { $('#admMsg', dlg).textContent = 'Contraseña incorrecta.'; $('#admPass', dlg).select(); }
  };
  dlg.showModal(); $('#admPass', dlg).focus();
}
function openAdmin(){ adminEl.hidden = false; renderAdmin(); }
function closeAdmin(){ forgetAdmin(); location.href = 'index.html'; }

function flat(r){
  const p = r.participant, t = r.training, e = r.evaluation;
  return { id:r.id, capacitador:t.capacitador || '', dni:fmtDni(p.dni), legajo:p.legajo || '', nombre:p.nombre, apellido:p.apellido, empresa:p.empresa || '', sector:p.sector || '', tipoVehiculo:p.tipoVehiculo || '',
    fecha: t.fechaInicio ? fmtDate(t.fechaInicio) : '', fechaISO: t.fechaInicio ? isoLocal(t.fechaInicio) : '',
    horaInicio: t.fechaInicio ? fmtTime(t.fechaInicio) : '', horaFin: t.fechaFin ? fmtTime(t.fechaFin) : '', duracion: t.duracion ?? '',
    preguntas:e.preguntas, correctas:e.correctas, incorrectas:e.incorrectas, porcentaje:e.porcentaje, intentos:e.intentos, estado:e.estado };
}
function filteredRows(){
  const F = adminFilters, has = (a,b) => !b || String(a).toLowerCase().includes(b.toLowerCase());
  return Store.all().map(flat).filter(r => (has(r.legajo,F.legajo) || has(r.dni,F.legajo) || has(normDni(r.dni),F.legajo)) && has(r.nombre,F.nombre) && has(r.apellido,F.apellido) && has(r.empresa,F.empresa) && has(r.sector,F.sector)
    && (!F.tipo || r.tipoVehiculo === F.tipo) && (!F.estado || r.estado === F.estado)
    && (!F.desde || r.fechaISO >= F.desde) && (!F.hasta || r.fechaISO <= F.hasta))
    .sort((a,b) => (b.fechaISO + b.horaInicio).localeCompare(a.fechaISO + a.horaInicio));
}
function groupCount(rows, key){ const m = {}; rows.forEach(r => { const k = r[key] || 'No indicado'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a,b) => b[1] - a[1]); }
function groupHTML(title, entries, total){
  return `<div class="panel group"><h3>${title}</h3>${entries.length ? entries.slice(0,8).map(([k,v]) => `<div class="gbar"><span>${esc(k)}</span><b>${v}</b><div class="bar"><i style="width:${total ? v/total*100 : 0}%"></i></div></div>`).join('') : '<p class="muted sm">Sin datos</p>'}</div>`;
}
function renderAdmin(){
  const rows = filteredRows(), all = Store.all().length;
  const ap = rows.filter(r => r.estado === 'APROBADO').length, nap = rows.filter(r => r.estado === 'NO APROBADO').length, pend = rows.filter(r => r.estado === 'SIN COMPLETAR').length;
  const done = rows.filter(r => r.estado !== 'SIN COMPLETAR'), avg = done.length ? Math.round(done.reduce((s,r) => s + r.porcentaje, 0) / done.length) : 0;
  const liv = rows.filter(r => r.tipoVehiculo === 'Vehículo liviano' || r.tipoVehiculo === 'Ambos').length;
  const pes = rows.filter(r => r.tipoVehiculo === 'Vehículo pesado' || r.tipoVehiculo === 'Ambos').length;
  const F = adminFilters, inp = (k, label, type) => `<div><label for="flt-${k}">${label}</label><input id="flt-${k}" data-f="${k}" type="${type || 'text'}" value="${esc(F[k])}"></div>`;
  const sel = (k, label, opts) => `<div><label for="flt-${k}">${label}</label><select id="flt-${k}" data-f="${k}"><option value="">Todos</option>${opts.map(o => `<option ${F[k] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
  const stCls = s => s === 'APROBADO' ? 'ok' : s === 'NO APROBADO' ? 'bad' : 'pend';
  adminEl.innerHTML = `<div class="admin-wrap">
    <div class="admin-top"><h1>${ic('users')} Administración de resultados · ${esc(CONFIG.consultora.nombre)}</h1>
      <div class="actions" style="margin:0"><button class="btn primary" id="aCsv">${ic('download')} EXPORTAR RESULTADOS (CSV)</button><button class="btn ghost" id="aJson">${ic('download')} JSON</button><button class="btn danger" id="aDel">${ic('trash')} Eliminar registros</button><button class="btn ghost" id="aExit">${ic('logout')} Cerrar sesión</button></div></div>
    ${adminBanner()}
    <div class="kpis" style="margin-top:16px">
      <div class="kpi"><span>Participantes</span><b>${rows.length}</b></div>
      <div class="kpi ok"><span>Aprobados</span><b>${ap}</b></div>
      <div class="kpi bad"><span>No aprobados</span><b>${nap}</b></div>
      <div class="kpi pend"><span>Sin completar</span><b>${pend}</b></div>
      <div class="kpi"><span>Promedio general</span><b>${done.length ? avg + '%' : '–'}</b></div>
      <div class="kpi"><span>Veh. livianos*</span><b>${liv}</b></div>
      <div class="kpi"><span>Veh. pesados*</span><b>${pes}</b></div>
    </div>
    <p class="sm dim" style="margin:-6px 0 14px">Indicadores calculados sobre los registros filtrados (${rows.length} de ${all}). *Incluye participantes que indicaron "Ambos". El promedio considera solo evaluaciones completadas.</p>
    <div class="groups">${groupHTML('Por empresa', groupCount(rows,'empresa'), rows.length)}${groupHTML('Por sector', groupCount(rows,'sector'), rows.length)}${groupHTML('Por tipo de vehículo', groupCount(rows,'tipoVehiculo'), rows.length)}</div>
    <div class="panel" style="margin-bottom:12px">
      <div class="filters">${inp('legajo','DNI o legajo')}${inp('nombre','Nombre')}${inp('apellido','Apellido')}${inp('empresa','Empresa')}${inp('sector','Sector')}
        ${sel('tipo','Tipo de vehículo',TIPOS)}${sel('estado','Estado',['APROBADO','NO APROBADO','SIN COMPLETAR'])}${inp('desde','Desde','date')}${inp('hasta','Hasta','date')}</div>
      <button class="btn ghost sm" id="aClear">${ic('refresh')} Limpiar filtros</button>
    </div>
    <div class="table-wrap"><table class="data"><thead><tr><th>DNI</th><th>Legajo</th><th>Apellido y nombre</th><th>Empresa</th><th>Sector</th><th>Vehículo</th><th>Fecha</th><th>Inicio–Fin</th><th>Duración</th><th>Correctas</th><th>%</th><th>Intentos</th><th>Estado</th></tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr><td>${esc(r.dni || '–')}</td><td>${esc(r.legajo || '–')}</td><td>${esc(r.apellido)}, ${esc(r.nombre)}</td><td>${esc(r.empresa) || '–'}</td><td>${esc(r.sector) || '–'}</td><td>${esc(r.tipoVehiculo) || '–'}</td><td>${r.fecha}</td><td>${r.horaInicio}${r.horaFin ? '–' + r.horaFin : ''}</td><td>${r.duracion !== '' ? r.duracion + ' min' : '–'}</td><td>${r.intentos ? r.correctas + '/' + r.preguntas : '–'}</td><td>${r.intentos ? r.porcentaje + '%' : '–'}</td><td>${r.intentos}</td><td><span class="st ${stCls(r.estado)}">${r.estado}</span></td></tr>`).join('') : `<tr><td colspan="13" class="muted" style="text-align:center;padding:26px">No hay registros${all ? ' que coincidan con los filtros' : ' en este dispositivo'}.</td></tr>`}</tbody></table></div>
  </div>`;
  $$('[data-f]', adminEl).forEach(el => el.addEventListener(el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input', () => {
    adminFilters[el.dataset.f] = el.value.trim(); const id = el.id, pos = el.selectionStart; renderAdmin();
    const n = $('#' + id); if(n){ n.focus(); try{ if(pos != null) n.setSelectionRange(pos, pos); }catch(_){} }
  }));
  $('#aClear').onclick = () => { Object.keys(adminFilters).forEach(k => adminFilters[k] = ''); renderAdmin(); };
  $('#aCsv').onclick = () => exportCSV(rows);
  $('#aJson').onclick = () => download(`resultados_fatiga_${isoLocal(new Date())}.json`, JSON.stringify(Store.all(), null, 2), 'application/json');
  $('#aExit').onclick = closeAdmin;
  $('#aDel').onclick = async () => {
    if(await confirmDialog('Eliminar registros', `Se eliminarán los ${all} registros guardados en este dispositivo. Esta acción no se puede deshacer. Exportá los resultados antes de continuar.`, 'Eliminar todo', 'Cancelar', true)){ Store.clear(); renderAdmin(); }
  };
}
function exportCSV(rows){
  const cols = [['dni','DNI'],['legajo','Legajo'],['nombre','Nombre'],['apellido','Apellido'],['empresa','Empresa'],['sector','Sector'],['tipoVehiculo','Tipo de vehículo'],['fecha','Fecha'],['horaInicio','Hora de inicio'],['horaFin','Hora de finalización'],['duracion','Duración (min)'],['preguntas','Cantidad de preguntas'],['correctas','Respuestas correctas'],['incorrectas','Respuestas incorrectas'],['porcentaje','Porcentaje'],['intentos','Intentos'],['estado','Estado'],['capacitador','Capacitador']];
  const cell = v => { let s = String(v ?? ''); if(/^[=+\-@]/.test(s)) s = "'" + s; return /[";\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const csv = '\ufeff' + [cols.map(c => c[1]).join(';'), ...rows.map(r => cols.map(c => cell(r[c[0]])).join(';'))].join('\r\n');
  download(`resultados_fatiga_${isoLocal(new Date())}.csv`, csv, 'text/csv;charset=utf-8');
}
function download(name, content, type){
  const url = URL.createObjectURL(new Blob([content], {type})); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/* ---- Acceso: "recordar este equipo" y aviso de origen de datos ---- */
const REMEMBER_KEY = 'rs_admin_equipo';
function adminKey(){ let h = 5381; for(const ch of CONFIG.admin.password) h = ((h << 5) + h + ch.charCodeAt(0)) | 0; return 'k' + (h >>> 0).toString(36); }
function rememberAdmin(){ try{ localStorage.setItem(REMEMBER_KEY, adminKey()); }catch(e){} }
function forgetAdmin(){ try{ localStorage.removeItem(REMEMBER_KEY); }catch(e){} }
function isRemembered(){ try{ return CONFIG.admin.recordarEquipo && localStorage.getItem(REMEMBER_KEY) === adminKey(); }catch(e){ return false; } }

function adminBanner(){
  const I = CONFIG.integracion, conectado = !!I.endpoint;
  return `<div class="panel" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
    <div style="max-width:780px">
      <p class="eyebrow">Origen de los datos</p>
      <p>Esta vista muestra los registros guardados <b>en este dispositivo</b>${Store.available ? '' : ' (almacenamiento local no disponible)'}. Los resultados que los participantes rinden desde sus celulares ${conectado ? 'llegan a la <b>planilla central</b>.' : 'llegarán a una planilla central cuando se conecte Google Sheets (ver README).'}</p>
      <p class="sm dim" style="margin-top:6px">Integración: ${conectado ? '<span style="color:#5fd699">conectada</span>' : '<span style="color:var(--amber)">no conectada (modo local)</span>'} · La contraseña del modo local es una barrera básica; para producción, usar autenticación corporativa.</p>
    </div>
    ${I.planillaUrl ? `<a class="btn green" href="${esc(I.planillaUrl)}" target="_blank" rel="noopener">${ic('clipboard')} ABRIR PLANILLA CENTRAL</a>` : ''}
  </div>`;
}

/* ---- Inicio ---- */
(function init(){
  if(!CONFIG.admin.habilitado){ location.href = 'index.html'; return; }
  if(typeof Central !== 'undefined' && Central.enabled()){ acStart(); return; }   // registro central (Supabase)
  isRemembered() ? openAdmin() : adminLogin();
})();
