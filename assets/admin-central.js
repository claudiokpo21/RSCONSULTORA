'use strict';
/* admin-central.js — ADMINISTRACIÓN CON REGISTRO CENTRAL (Supabase)
   · Acceso: usuario de Supabase Auth cuyo email figure en rs_capacitacion.administradores.
   · Jornadas: cada capacitación en una empresa. Genera links y QR con el código de jornada.
   · Resultados: todos los registros, con filtros, indicadores, exportación CSV y eliminación.
   RS Consultora · Fatiga y Conducción Segura */

const AC = { user:null, tab:'jornadas', jornadas:[], registros:[], open:null, busy:false,
  f:{ jornada:'', q:'', estado:'', tipo:'', desde:'', hasta:'' } };
const acEl = $('#admin');

function acShow(html){ acEl.hidden = false; acEl.innerHTML = `<div class="admin-wrap">${html}</div>`; window.scrollTo(0, 0); }
function acLoading(msg){ acShow(`<div class="gate-card welcome" style="margin:10vh auto"><div class="spinner" aria-hidden="true"></div><p class="muted">${esc(msg || 'Cargando…')}</p></div>`); }
function linkFor(page, code){ const u = new URL(page, location.href); u.searchParams.set('j', code); return u.href; }
function todayISO(){ return isoLocal(new Date()); }
async function copyText(t, btn){
  try{ await navigator.clipboard.writeText(t); }
  catch(e){ const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try{ document.execCommand('copy'); }catch(_){} a.remove(); }
  if(btn){ const o = btn.innerHTML; btn.innerHTML = `${ic('check')} Copiado`; setTimeout(() => btn.innerHTML = o, 1400); }
}
function acError(e){
  if(e && (e.code === '42501' || /denegado|JWT|jwt/i.test(e.message))) return acLogin('Tu sesión venció o no tenés permisos. Ingresá nuevamente.');
  acShow(`<div class="gate-card" style="margin:8vh auto">${fb('bad','No se pudo completar la operación', esc(Central.isNetworkError(e) ? 'Sin conexión a internet.' : (e && e.message) || 'Error'))}<div class="actions"><button class="btn primary" onclick="acReload()">${ic('refresh')} Reintentar</button></div></div>`);
}

/* ---------- Acceso ---------- */
function acLogin(err, email){
  acShow(`<div class="gate-card" style="margin:6vh auto;max-width:480px">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)}</p><h1>Administración</h1><p class="muted">Ingresá con tu usuario.</p></div></div>
    <form id="acForm" novalidate>
      <div class="field"><label for="acEmail">EMAIL</label><input id="acEmail" type="email" autocomplete="username" value="${esc(email || '')}"></div>
      <div class="field" style="margin-top:14px"><label for="acPass">CONTRASEÑA</label><input id="acPass" type="password" autocomplete="current-password"></div>
      ${err ? `<div class="form-error">${fb('bad', esc(err), '')}</div>` : ''}
      <div class="actions"><button class="btn primary lg" type="submit" style="width:100%">${ic('lock')} INGRESAR</button></div>
    </form>
    <button type="button" class="admin-link" id="acForgot" style="margin:14px 0 0">¿Olvidaste tu contraseña?</button>
    <p class="sm dim" style="margin-top:10px">La sesión queda abierta en este equipo hasta que la cierres. Solo los emails autorizados como administradores pueden ver los resultados.</p>
    <a href="index.html" class="admin-link">${ic('arrowl')} Volver al inicio</a>
  </div>`);
  $('#acForm').onsubmit = async e => {
    e.preventDefault();
    const em = $('#acEmail').value.trim(), pw = $('#acPass').value;
    if(!em || !pw){ acLogin('Completá email y contraseña.', em); return; }
    acLoading('Ingresando…');
    try{ const s = await Central.signIn(em, pw); await acAfterLogin(s); }
    catch(err){ acLogin(Central.isNetworkError(err) ? 'Sin conexión a internet.' : err.message, em); }
  };
  $('#acForgot').onclick = () => acForgot($('#acEmail').value.trim());
  (email ? $('#acPass') : $('#acEmail')).focus();
}

/* ---------- Blanqueo de clave ---------- */
function acForgot(email, msg){
  acShow(`<div class="gate-card" style="margin:6vh auto;max-width:480px">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)}</p><h1>Blanquear contraseña</h1><p class="muted">Te enviamos un enlace por mail para crear una contraseña nueva.</p></div></div>
    <form id="fgForm" novalidate>
      <div class="field"><label for="fgEmail">EMAIL</label><input id="fgEmail" type="email" autocomplete="username" value="${esc(email || '')}"></div>
      ${msg ? `<div class="form-error">${msg}</div>` : ''}
      <div class="actions"><button class="btn primary lg" type="submit" style="width:100%">${ic('message')} ENVIAR ENLACE</button></div>
    </form>
    <button type="button" class="admin-link" id="fgBack">${ic('arrowl')} Volver al ingreso</button>
  </div>`);
  $('#fgBack').onclick = () => acLogin(null, $('#fgEmail').value.trim());
  $('#fgForm').onsubmit = async e => {
    e.preventDefault();
    const em = $('#fgEmail').value.trim();
    if(!/^\S+@\S+\.\S+$/.test(em)){ acForgot(em, fb('bad','Ingresá un email válido.','')); return; }
    const btn = $('#fgForm button[type=submit]'); btn.disabled = true;
    try{
      await Central.resetPassword(em);
      acForgot(em, fb('ok','Revisá tu correo','Si el email corresponde a un usuario, vas a recibir un enlace para crear una contraseña nueva (revisá también spam). El enlace vence en poco tiempo.'));
    }catch(err){ acForgot(em, fb('bad','No se pudo enviar el enlace', esc(Central.isNetworkError(err) ? 'Sin conexión a internet.' : err.message))); }
  };
  $('#fgEmail').focus();
}
/** Formulario de contraseña nueva. mode: 'recovery' (llegó por el enlace del mail) o 'change' (sesión iniciada). */
function acNewPassword(mode, err){
  acShow(`<div class="gate-card" style="margin:6vh auto;max-width:480px">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)}</p><h1>${mode === 'recovery' ? 'Nueva contraseña' : 'Cambiar contraseña'}</h1><p class="muted">Mínimo 10 caracteres. Conviene combinar palabras, números y símbolos.</p></div></div>
    <form id="npForm" novalidate>
      <div class="field"><label for="np1">CONTRASEÑA NUEVA</label><input id="np1" type="password" autocomplete="new-password" minlength="10"></div>
      <div class="field" style="margin-top:14px"><label for="np2">REPETIR CONTRASEÑA</label><input id="np2" type="password" autocomplete="new-password"></div>
      ${err ? `<div class="form-error">${fb('bad', esc(err), '')}</div>` : ''}
      <div class="actions"><button class="btn primary lg" type="submit" style="width:100%">${ic('lock')} GUARDAR CONTRASEÑA</button></div>
    </form>
    ${mode === 'change' ? `<button type="button" class="admin-link" id="npBack">${ic('arrowl')} Volver al panel</button>` : ''}
  </div>`);
  if($('#npBack')) $('#npBack').onclick = acRender;
  $('#npForm').onsubmit = async e => {
    e.preventDefault();
    const a = $('#np1').value, b = $('#np2').value;
    if(a.length < 10) return acNewPassword(mode, 'La contraseña tiene que tener al menos 10 caracteres.');
    if(a !== b) return acNewPassword(mode, 'Las contraseñas no coinciden.');
    acLoading('Guardando…');
    try{
      await Central.updatePassword(a);
      history.replaceState(null, '', 'admin.html');
      const s = await Central.session();
      await acAfterLogin(s);
      const top = $('.admin-top'); if(top) top.insertAdjacentHTML('afterend', fb('ok','Contraseña actualizada','Desde ahora ingresás con la contraseña nueva.'));
    }catch(er){ acNewPassword(mode, Central.isNetworkError(er) ? 'Sin conexión a internet.' : er.message); }
  };
  $('#np1').focus();
}
async function acAfterLogin(s){
  AC.user = s.user;
  let ok = false;
  try{ ok = await Central.esAdmin(); }catch(e){ return acError(e); }
  if(!ok){
    acShow(`<div class="gate-card" style="margin:8vh auto;max-width:520px">${fb('bad','Sin permisos', `El usuario <b>${esc(s.user.email)}</b> no está autorizado como administrador de ${esc(CONFIG.consultora.nombre)}.`)}
      <div class="actions"><button class="btn ghost" id="acOut">${ic('logout')} Cerrar sesión</button></div></div>`);
    $('#acOut').onclick = async () => { await Central.signOut(); acLogin(); };
    return;
  }
  await acReload();
}
async function acReload(){
  acLoading('Cargando datos…');
  try{
    const [j, r] = await Promise.all([Central.rpc('rs_admin_jornadas'), Central.rpc('rs_admin_registros', { p_jornada:null })]);
    AC.jornadas = j || []; AC.registros = r || [];
    acRender();
  }catch(e){ acError(e); }
}

/* ---------- Estructura ---------- */
function acRender(){
  acShow(`<div class="admin-top">
      <h1>${ic('users')} Administración · ${esc(CONFIG.consultora.nombre)}</h1>
      <div class="actions" style="margin:0;align-items:center">
        <span class="who">${ic('user')} ${esc(AC.user.email)}</span>
        <button class="btn ghost sm" id="acRefresh">${ic('refresh')} Actualizar</button>
        <button class="btn ghost sm" id="acPw">${ic('lock')} Cambiar contraseña</button>
        <button class="btn ghost sm" id="acLogout">${ic('logout')} Cerrar sesión</button>
      </div>
    </div>
    <div class="admin-tabs" role="tablist">
      <button role="tab" aria-selected="${AC.tab === 'jornadas'}" data-tab="jornadas">${ic('calendar')} Jornadas <span class="count">${AC.jornadas.length}</span></button>
      <button role="tab" aria-selected="${AC.tab === 'resultados'}" data-tab="resultados">${ic('clipboard')} Resultados <span class="count">${AC.registros.length}</span></button>
    </div>
    <div id="acBody">${AC.tab === 'jornadas' ? jornadasHTML() : resultadosHTML()}</div>`);
  $$('[data-tab]', acEl).forEach(b => b.onclick = () => { AC.tab = b.dataset.tab; acRender(); });
  $('#acRefresh').onclick = acReload;
  $('#acPw').onclick = () => acNewPassword('change');
  $('#acLogout').onclick = async () => { await Central.signOut(); AC.user = null; acLogin(); };
  AC.tab === 'jornadas' ? bindJornadas() : bindResultados();
}

/* ---------- Jornadas ---------- */
function jornadasHTML(){
  return `<div class="panel" style="margin-bottom:16px">
      <p class="eyebrow">Nueva jornada</p>
      <form id="jForm" class="jform" novalidate>
        <div class="field"><label for="jEmp">EMPRESA *</label><input id="jEmp" maxlength="80" placeholder="Ej.: Petro SA"></div>
        <div class="field"><label for="jLug">LUGAR / SECTOR</label><input id="jLug" maxlength="120" placeholder="Ej.: Yacimiento Norte"></div>
        <div class="field"><label for="jFec">FECHA</label><input id="jFec" type="date" value="${todayISO()}"></div>
        <div class="field"><label for="jCap">CAPACITADOR</label><input id="jCap" maxlength="80" value="${esc(capacitador())}"></div>
        <button class="btn primary" type="submit">${ic('calendar')} CREAR JORNADA</button>
      </form>
      <p class="sm dim" style="margin-top:8px">Cada jornada tiene su código. Usá sus links (presentación, desafío y evaluación) para que los resultados queden agrupados en el informe de esa empresa.</p>
    </div>
    ${AC.jornadas.length ? `<div class="jlist">${AC.jornadas.map(jornadaCard).join('')}</div>`
      : `<div class="panel" style="text-align:center">${ic('calendar','xl')}<p class="muted" style="margin-top:8px">Todavía no hay jornadas. Creá la primera con el formulario de arriba.</p></div>`}`;
}
function jornadaCard(j){
  const open = AC.open === j.id, abierta = j.estado === 'abierta';
  const links = [['Presentación','capacitacion.html','play'],['Desafío en vivo','vivo.html','zap'],['Evaluación','evaluacion.html','clipboard']];
  return `<article class="jcard ${abierta ? '' : 'closed'}">
    <div class="jhead">
      <div><h3>${esc(j.empresa)}</h3><p class="muted sm">${fmtDate(j.fecha + 'T12:00:00')}${j.lugar ? ' · ' + esc(j.lugar) : ''} · ${esc(j.capacitador)}</p></div>
      <div class="jcode"><small>Código</small><b>${esc(j.codigo)}</b><span class="st ${abierta ? 'ok' : 'pend'}">${abierta ? 'ABIERTA' : 'CERRADA'}</span></div>
    </div>
    <div class="jstats">
      <span><b>${j.participantes}</b> participantes</span><span><b>${j.aprobados}</b> aprobados</span>
      <span><b>${j.firmas}</b> firmas</span><span><b>${j.desafios}</b> desafío${j.desafios == 1 ? '' : 's'} en vivo</span>
    </div>
    <div class="actions" style="margin-top:12px">
      <button class="btn sm ${open ? 'primary' : 'ghost'}" data-links="${j.id}">${ic('route')} Links y QR</button>
      <a class="btn sm green" href="informe.html?id=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">${ic('clipboard')} Informe</a>
      <button class="btn sm ghost" data-estado="${j.id}" data-nuevo="${abierta ? 'cerrada' : 'abierta'}">${ic(abierta ? 'lock' : 'refresh')} ${abierta ? 'Cerrar jornada' : 'Reabrir'}</button>
    </div>
    ${open ? `<div class="jlinks">
      <div class="jlink-rows">${links.map(([t, pg, icn]) => { const u = linkFor(pg, j.codigo); return `<div class="jlink"><span>${ic(icn)} ${t}</span><code>${esc(u.replace(/^https?:\/\//, ''))}</code><button class="btn sm ghost" data-copy="${esc(u)}">${ic('clipboard')} Copiar</button><a class="btn sm ghost" href="${esc(u)}" target="_blank" rel="noopener">${ic('arrow')} Abrir</a></div>`; }).join('')}</div>
      <div class="jqr"><div class="qr-box">${qrSVG(linkFor('evaluacion.html', j.codigo))}</div><p class="sm muted">QR de la evaluación</p></div>
      ${abierta ? '' : `<div style="grid-column:1/-1">${fb('warn','Jornada cerrada','Los participantes ya no pueden sumarse a esta jornada. Reabrila si necesitás registrar más resultados.')}</div>`}
    </div>` : ''}
  </article>`;
}
function bindJornadas(){
  $('#jForm').onsubmit = async e => {
    e.preventDefault();
    const empresa = $('#jEmp').value.trim();
    if(!empresa){ $('#jEmp').closest('.field').classList.add('err'); $('#jEmp').focus(); return; }
    const btn = e.submitter || $('#jForm button'); btn.disabled = true;
    try{
      const j = await Central.rpc('rs_admin_crear_jornada', { p:{ empresa, lugar:$('#jLug').value.trim(), fecha:$('#jFec').value || todayISO(), capacitador:$('#jCap').value.trim() || capacitador(), capacitacion:CONFIG.capacitacion.nombre } });
      AC.open = j.id; await acReload();
    }catch(err){ btn.disabled = false; acError(err); }
  };
  $$('[data-links]', acEl).forEach(b => b.onclick = () => { AC.open = AC.open === b.dataset.links ? null : b.dataset.links; acRender(); });
  $$('[data-copy]', acEl).forEach(b => b.onclick = () => copyText(b.dataset.copy, b));
  $$('[data-estado]', acEl).forEach(b => b.onclick = async () => {
    const cerrar = b.dataset.nuevo === 'cerrada';
    if(cerrar && !(await confirmDialog('Cerrar jornada','Los participantes no podrán sumar nuevos registros a esta jornada. Podés reabrirla después.','Cerrar jornada','Cancelar'))) return;
    try{ await Central.rpc('rs_admin_estado_jornada', { p_id:b.dataset.estado, p_estado:b.dataset.nuevo }); await acReload(); }catch(err){ acError(err); }
  });
}

/* ---------- Resultados ---------- */
function acRows(){
  const F = AC.f, q = F.q.toLowerCase();
  return AC.registros.filter(r => {
    const d = isoLocal(r.fecha_inicio || r.created_at);
    return (!F.jornada || (F.jornada === '__none' ? !r.jornada_id : r.jornada_id === F.jornada))
      && (!q || [r.legajo, r.nombre, r.apellido, r.empresa, r.sector].some(x => String(x || '').toLowerCase().includes(q)))
      && (!F.estado || r.estado === F.estado) && (!F.tipo || r.tipo_vehiculo === F.tipo)
      && (!F.desde || d >= F.desde) && (!F.hasta || d <= F.hasta);
  });
}
function resultadosHTML(){
  const rows = acRows(), F = AC.f;
  const ap = rows.filter(r => r.estado === 'APROBADO').length, nap = rows.filter(r => r.estado === 'NO APROBADO').length;
  const pend = rows.filter(r => r.estado === 'SIN COMPLETAR').length, done = rows.filter(r => r.porcentaje != null);
  const avg = done.length ? Math.round(done.reduce((s, r) => s + r.porcentaje, 0) / done.length) : null;
  const firm = rows.filter(r => r.firmado).length;
  const stCls = s => s === 'APROBADO' ? 'ok' : s === 'NO APROBADO' ? 'bad' : 'pend';
  const sel = (id, label, opts, val) => `<div><label for="${id}">${label}</label><select id="${id}"><option value="">Todos</option>${opts.map(([v, t]) => `<option value="${esc(v)}" ${val === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  return `<div class="kpis">
      <div class="kpi"><span>Participantes</span><b>${rows.length}</b></div>
      <div class="kpi ok"><span>Aprobados</span><b>${ap}</b></div>
      <div class="kpi bad"><span>No aprobados</span><b>${nap}</b></div>
      <div class="kpi pend"><span>Sin completar</span><b>${pend}</b></div>
      <div class="kpi"><span>Promedio</span><b>${avg != null ? avg + '%' : '–'}</b></div>
      <div class="kpi"><span>Asistencia firmada</span><b>${firm}</b></div>
    </div>
    <div class="panel" style="margin-bottom:12px">
      <div class="filters">
        ${sel('fJ','Jornada',[...AC.jornadas.map(j => [j.id, `${j.codigo} · ${j.empresa}`]), ['__none','Sin jornada']], F.jornada)}
        <div><label for="fQ">Buscar</label><input id="fQ" value="${esc(F.q)}" placeholder="Legajo, nombre, empresa…"></div>
        ${sel('fE','Estado',[['APROBADO','Aprobado'],['NO APROBADO','No aprobado'],['SIN COMPLETAR','Sin completar']], F.estado)}
        ${sel('fT','Tipo de vehículo',TIPOS.map(t => [t, t]), F.tipo)}
        <div><label for="fD">Desde</label><input id="fD" type="date" value="${esc(F.desde)}"></div>
        <div><label for="fH">Hasta</label><input id="fH" type="date" value="${esc(F.hasta)}"></div>
      </div>
      <div class="actions" style="margin-top:4px"><button class="btn ghost sm" id="fClear">${ic('refresh')} Limpiar filtros</button><button class="btn primary sm" id="fCsv">${ic('download')} EXPORTAR RESULTADOS (CSV)</button></div>
    </div>
    <div class="table-wrap"><table class="data"><thead><tr><th>Fecha</th><th>Jornada</th><th>Legajo</th><th>Apellido y nombre</th><th>Empresa</th><th>Sector</th><th>Vehículo</th><th>%</th><th>Int.</th><th>Estado</th><th>Firma</th><th>Verificación</th><th></th></tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr>
        <td>${fmtDate(r.fecha_inicio || r.created_at)}</td><td>${esc(r.jornada_codigo || '–')}</td><td>${esc(r.legajo)}</td>
        <td>${esc(r.apellido)}, ${esc(r.nombre)}</td><td>${esc(r.empresa || '–')}</td><td>${esc(r.sector || '–')}</td><td>${esc(r.tipo_vehiculo || '–')}</td>
        <td>${r.porcentaje != null ? r.porcentaje + '%' : '–'}</td><td>${r.intentos || 0}</td><td><span class="st ${stCls(r.estado)}">${esc(r.estado)}</span></td>
        <td>${r.firmado ? `<span style="color:#5fd699">${ic('check')}</span>` : '<span class="dim">–</span>'}</td>
        <td><a href="verificar.html?c=${esc(r.verificacion)}" target="_blank" rel="noopener" style="color:var(--amber)">${esc(r.verificacion)}</a></td>
        <td><button class="icon-btn" data-del="${esc(r.id)}" title="Eliminar registro" aria-label="Eliminar registro de ${esc(r.apellido)}">${ic('trash')}</button></td>
      </tr>`).join('') : `<tr><td colspan="13" class="muted" style="text-align:center;padding:26px">No hay registros${AC.registros.length ? ' que coincidan con los filtros' : ''}.</td></tr>`}</tbody></table></div>`;
}
function bindResultados(){
  const map = { fJ:'jornada', fQ:'q', fE:'estado', fT:'tipo', fD:'desde', fH:'hasta' };
  Object.entries(map).forEach(([id, k]) => {
    const el = $('#' + id);
    el.addEventListener(el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input', () => {
      AC.f[k] = el.value; const pos = el.selectionStart;
      $('#acBody').innerHTML = resultadosHTML(); bindResultados();
      const n = $('#' + id); n.focus(); try{ if(pos != null) n.setSelectionRange(pos, pos); }catch(_){}
    });
  });
  $('#fClear').onclick = () => { Object.keys(AC.f).forEach(k => AC.f[k] = ''); acRender(); };
  $('#fCsv').onclick = () => acCsv(acRows());
  $$('[data-del]', acEl).forEach(b => b.onclick = async () => {
    const r = AC.registros.find(x => x.id === b.dataset.del);
    if(!(await confirmDialog('Eliminar registro', `Se eliminará el registro de ${esc(r.apellido)}, ${esc(r.nombre)} (legajo ${esc(r.legajo)}). Su constancia dejará de poder verificarse. Esta acción no se puede deshacer.`, 'Eliminar', 'Cancelar', true))) return;
    try{ await Central.rpc('rs_admin_eliminar_registro', { p_id:r.id }); await acReload(); }catch(err){ acError(err); }
  });
}
function acCsv(rows){
  const cols = [['fecha','Fecha'],['jornada','Jornada'],['legajo','Legajo'],['nombre','Nombre'],['apellido','Apellido'],['empresa','Empresa'],['sector','Sector'],['tipo','Tipo de vehículo'],['inicio','Hora de inicio'],['fin','Hora de finalización'],['dur','Duración (min)'],['preg','Cantidad de preguntas'],['corr','Respuestas correctas'],['inc','Respuestas incorrectas'],['pct','Porcentaje'],['int','Intentos'],['estado','Estado'],['firma','Asistencia firmada'],['ver','Código de verificación'],['cap','Capacitador']];
  const cell = v => { let s = String(v ?? ''); if(/^[=+\-@]/.test(s)) s = "'" + s; return /[";\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const data = rows.map(r => ({ fecha:fmtDate(r.fecha_inicio || r.created_at), jornada:r.jornada_codigo || '', legajo:r.legajo, nombre:r.nombre, apellido:r.apellido, empresa:r.empresa, sector:r.sector,
    tipo:r.tipo_vehiculo, inicio:r.fecha_inicio ? fmtTime(r.fecha_inicio) : '', fin:r.fecha_fin ? fmtTime(r.fecha_fin) : '', dur:r.duracion_min, preg:r.preguntas, corr:r.correctas, inc:r.incorrectas,
    pct:r.porcentaje, int:r.intentos, estado:r.estado, firma:r.firmado ? 'Sí' : 'No', ver:r.verificacion, cap:r.capacitador }));
  const csv = '﻿' + [cols.map(c => c[1]).join(';'), ...data.map(d => cols.map(c => cell(d[c[0]])).join(';'))].join('\r\n');
  download(`resultados_fatiga_${isoLocal(new Date())}.csv`, csv, 'text/csv;charset=utf-8');
}

/* ---------- Inicio ---------- */
async function acStart(){
  acLoading('Verificando sesión…');
  const rec = Central.recoveryInfo();
  try{
    const s = await Central.session();
    if(rec.recovery && s) return acNewPassword('recovery');                 // llegó desde el mail de blanqueo
    if(rec.error){ history.replaceState(null, '', 'admin.html');
      return acForgot('', fb('bad','El enlace no es válido o venció', 'Pedí un enlace nuevo. Cada enlace sirve una sola vez y vence en poco tiempo.')); }
    s ? await acAfterLogin(s) : acLogin();
  }catch(e){ acLogin(); }
}
