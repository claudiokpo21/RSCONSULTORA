'use strict';
/* admin-central.js — ADMINISTRACIÓN CON REGISTRO CENTRAL (Supabase)
   · Acceso: usuario de Supabase Auth cuyo email figure en rs_capacitacion.administradores.
   · Jornadas: cada capacitación en una empresa. Genera links y QR con el código de jornada.
   · Resultados: todos los registros, con filtros, indicadores, exportación CSV y eliminación.
   RS Consultora · Fatiga y Conducción Segura */

const AC = { user:null, tab:'tablero', jornadas:[], registros:[], T:null, open:null, qr:{}, busy:false,
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
    try{ AC.T = await Datos.tablero(AC.jornadas); }catch(e){ AC.T = null; console.warn('Tablero:', e); }
    // Sistema recién instalado: sin jornadas ni registros, se abre directo en Jornadas para crear la primera.
    if(!AC.inicio){ AC.inicio = true; if(!AC.jornadas.length && !AC.registros.length) AC.tab = 'jornadas'; }
    acRender();
  }catch(e){ acError(e); }
}

/* ---------- Estructura ---------- */
function acRender(){
  acShow(`<div class="admin-top">
      <h1>${ic('users')} Administración · ${esc(CONFIG.consultora.nombre)}</h1>
      <div class="actions" style="margin:0;align-items:center">
        <span class="who">${ic('user')} ${esc(AC.user.email)}</span>
        <a class="btn ghost sm" href="guia.html" target="_blank" rel="noopener">${ic('clipboard')} Guía del capacitador</a>
        <button class="btn ghost sm" id="acRefresh">${ic('refresh')} Actualizar</button>
        <button class="btn ghost sm" id="acPw">${ic('lock')} Cambiar contraseña</button>
        <button class="btn ghost sm" id="acLogout">${ic('logout')} Cerrar sesión</button>
      </div>
    </div>
    <div class="admin-tabs" role="tablist">
      <button role="tab" aria-selected="${AC.tab === 'tablero'}" data-tab="tablero">${ic('activity')} Tablero</button>
      <button role="tab" aria-selected="${AC.tab === 'jornadas'}" data-tab="jornadas">${ic('calendar')} Jornadas <span class="count">${AC.jornadas.length}</span></button>
      <button role="tab" aria-selected="${AC.tab === 'empresas'}" data-tab="empresas">${ic('building')} Empresas</button>
      <button role="tab" aria-selected="${AC.tab === 'resultados'}" data-tab="resultados">${ic('clipboard')} Resultados <span class="count">${AC.registros.length}</span></button>
    </div>
    <div id="acBody">${{ tablero:tableroHTML, jornadas:jornadasHTML, empresas:empresasHTML, resultados:resultadosHTML }[AC.tab]()}</div>`);
  $$('[data-tab]', acEl).forEach(b => b.onclick = () => { AC.tab = b.dataset.tab; acRender(); });
  $('#acRefresh').onclick = () => { try{ localStorage.removeItem(Datos.KEY); }catch(e){} acReload(); };
  $('#acPw').onclick = () => acNewPassword('change');
  $('#acLogout').onclick = async () => { await Central.signOut(); AC.user = null; acLogin(); };
  ({ tablero:bindTablero, jornadas:bindJornadas, empresas:bindEmpresas, resultados:bindResultados })[AC.tab]();
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
        <div class="field"><label for="jMail">EMAIL DE CONTACTO (EMPRESA)</label><input id="jMail" type="email" maxlength="120" placeholder="Opcional: para enviarle el informe"></div>
        <button class="btn primary" type="submit">${ic('calendar')} CREAR JORNADA</button>
      </form>
      <p class="sm dim" style="margin-top:8px">Cada jornada tiene su código. Usá sus links (presentación, desafío y evaluación) para que los resultados queden agrupados en el informe de esa empresa.</p>
    </div>
    ${AC.jornadas.length ? `<div class="jlist">${AC.jornadas.map(jornadaCard).join('')}</div>`
      : `<div class="panel" style="text-align:center">${ic('calendar','xl')}<p class="muted" style="margin-top:8px">Todavía no hay jornadas. Creá la primera con el formulario de arriba.</p></div>`}`;
}
/* ---------- Refuerzo a los N días ---------- */
function refuerzoDias(){ return (CONFIG.reportes && CONFIG.reportes.refuerzoDias) || 30; }
function refuerzoFecha(j){ const d = new Date(j.fecha + 'T12:00:00'); d.setDate(d.getDate() + refuerzoDias()); return d; }
function refuerzoMensaje(j){
  return `Hola. Hace unas semanas participaste de la capacitación «${CONFIG.capacitacion.nombre}»${j.empresa ? ' en ' + j.empresa : ''}. `
    + `Te propongo un repaso de 1 minuto: ${(CONFIG.reportes && CONFIG.reportes.refuerzo || [2, 8, 9]).length} preguntas, anónimo (no pide nombre ni DNI). `
    + `${linkFor('refuerzo.html', j.codigo)}\n${CONFIG.consultora.nombre} · Detenerse a tiempo también es seguridad.`;
}
function refuerzoAviso(j){
  const f = refuerzoFecha(j), hoy = new Date(), dias = Math.round((f - hoy) / 864e5), msg = refuerzoMensaje(j);
  const cuando = dias > 0 ? `Enviar el <b>${fmtDate(f.toISOString())}</b> (en ${dias} día${dias === 1 ? '' : 's'})` : dias > -150 ? `<b>Ya se puede enviar</b> (sugerido: ${fmtDate(f.toISOString())})` : 'El refuerzo de esta jornada ya cerró';
  return `<div class="jref">${ic('repeat')}<span>Refuerzo: ${cuando}${j.refuerzos ? ` · ${j.refuerzos} respuesta${j.refuerzos == 1 ? '' : 's'}` : ''}.</span>
    <a class="btn sm green" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${ic('message')} WhatsApp</a>
    <button class="btn sm ghost" data-copy="${esc(msg)}">${ic('clipboard')} Copiar mensaje</button></div>`;
}
function jornadaCard(j){
  const open = AC.open === j.id, abierta = j.estado === 'abierta';
  const links = [['Diagnóstico inicial','diagnostico.html','target'],['Presentación','capacitacion.html','play'],['Desafío en vivo','vivo.html','zap'],['Evaluación','evaluacion.html','clipboard'],['Refuerzo','refuerzo.html','repeat']];
  const QRS = { eval:['evaluacion.html','Evaluación','QR de la evaluación'], diag:['diagnostico.html','Diagnóstico','QR del diagnóstico inicial (mostrarlo al comenzar, antes de la presentación)'],
                ref:['refuerzo.html','Refuerzo','QR del refuerzo (para enviar o mostrar ' + refuerzoDias() + ' días después)'] }, qk = QRS[AC.qr[j.id]] ? AC.qr[j.id] : 'eval';
  return `<article class="jcard ${abierta ? '' : 'closed'}">
    <div class="jhead">
      <div><h3>${esc(j.empresa)}</h3><p class="muted sm">${fmtDate(j.fecha + 'T12:00:00')}${j.lugar ? ' · ' + esc(j.lugar) : ''} · ${esc(j.capacitador)}</p></div>
      <div class="jcode"><small>Código</small><b>${esc(j.codigo)}</b><span class="st ${abierta ? 'ok' : 'pend'}">${abierta ? 'ABIERTA' : 'CERRADA'}</span></div>
    </div>
    <div class="jstats">
      <span><b>${j.participantes}</b> participantes</span><span><b>${j.aprobados}</b> aprobados</span>
      <span><b>${j.firmas}</b> firmas</span><span><b>${j.desafios}</b> desafío${j.desafios == 1 ? '' : 's'} en vivo</span>
      ${j.diagnosticos != null ? `<span><b>${j.diagnosticos}</b> diagnóstico${j.diagnosticos == 1 ? '' : 's'}</span>` : ''}
      ${j.refuerzos != null ? `<span><b>${j.refuerzos}</b> refuerzo${j.refuerzos == 1 ? '' : 's'}</span>` : ''}
    </div>
    <div class="actions" style="margin-top:12px">
      <button class="btn sm ${open ? 'primary' : 'ghost'}" data-links="${j.id}">${ic('route')} Links y QR</button>
      <a class="btn sm green" href="informe.html?id=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">${ic('clipboard')} Informe grupal</a>
      <a class="btn sm ghost" href="documento.html?doc=ind&j=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">${ic('user')} Informes individuales</a>
      <a class="btn sm ghost" href="documento.html?doc=cert&j=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">${ic('award')} Certificados</a>
      <button class="btn sm ghost" data-share="${j.id}">${ic('message')} Compartir con el cliente</button>
      <button class="btn sm ghost" data-estado="${j.id}" data-nuevo="${abierta ? 'cerrada' : 'abierta'}">${ic(abierta ? 'lock' : 'refresh')} ${abierta ? 'Cerrar jornada' : 'Reabrir'}</button>
    </div>
    ${open ? `<div class="jlinks">
      <div class="jlink-rows">${links.map(([t, pg, icn]) => { const u = linkFor(pg, j.codigo); return `<div class="jlink"><span>${ic(icn)} ${t}</span><code>${esc(u.replace(/^https?:\/\//, ''))}</code><button class="btn sm ghost" data-copy="${esc(u)}">${ic('clipboard')} Copiar</button><a class="btn sm ghost" href="${esc(u)}" target="_blank" rel="noopener">${ic('arrow')} Abrir</a></div>`; }).join('')}
        ${refuerzoAviso(j)}</div>
      <div class="jqr"><div class="seg" role="group" aria-label="QR a mostrar" style="margin-bottom:8px">${Object.entries(QRS).map(([k, q]) => `<button class="seg-btn" aria-pressed="${k === qk}" data-qr="${j.id}" data-k="${k}">${q[1]}</button>`).join('')}</div>
        <div class="qr-box">${qrSVG(linkFor(QRS[qk][0], j.codigo))}</div><p class="sm muted">${QRS[qk][2]}</p></div>
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
      const j = await Central.rpc('rs_admin_crear_jornada', { p:{ empresa, lugar:$('#jLug').value.trim(), fecha:$('#jFec').value || todayISO(), capacitador:$('#jCap').value.trim() || capacitador(), capacitacion:CONFIG.capacitacion.nombre, contacto_email:$('#jMail').value.trim() } });
      AC.open = j.id; await acReload();
    }catch(err){ btn.disabled = false; acError(err); }
  };
  $$('[data-links]', acEl).forEach(b => b.onclick = () => { AC.open = AC.open === b.dataset.links ? null : b.dataset.links; acRender(); });
  $$('[data-copy]', acEl).forEach(b => b.onclick = () => copyText(b.dataset.copy, b));
  $$('[data-qr]', acEl).forEach(b => b.onclick = () => { AC.qr[b.dataset.qr] = b.dataset.k; acRender(); });
  $$('[data-share]', acEl).forEach(b => b.onclick = () => shareDialog(AC.jornadas.find(j => j.id === b.dataset.share)));
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
      && (!q || [r.dni, fmtDni(r.dni), r.legajo, r.nombre, r.apellido, r.empresa, r.sector].some(x => String(x || '').toLowerCase().includes(q)))
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
        <div><label for="fQ">Buscar</label><input id="fQ" value="${esc(F.q)}" placeholder="DNI, legajo, nombre, empresa…"></div>
        ${sel('fE','Estado',[['APROBADO','Aprobado'],['NO APROBADO','No aprobado'],['SIN COMPLETAR','Sin completar']], F.estado)}
        ${sel('fT','Tipo de vehículo',TIPOS.map(t => [t, t]), F.tipo)}
        <div><label for="fD">Desde</label><input id="fD" type="date" value="${esc(F.desde)}"></div>
        <div><label for="fH">Hasta</label><input id="fH" type="date" value="${esc(F.hasta)}"></div>
      </div>
      <div class="actions" style="margin-top:4px"><button class="btn ghost sm" id="fClear">${ic('refresh')} Limpiar filtros</button><button class="btn ghost sm" id="fCsv">${ic('download')} CSV</button><button class="btn primary sm" id="fXlsx">${ic('download')} EXCEL</button></div>
    </div>
    <div class="table-wrap"><table class="data"><thead><tr><th>Fecha</th><th>Jornada</th><th>DNI</th><th>Legajo</th><th>Apellido y nombre</th><th>Empresa</th><th>Sector</th><th>Vehículo</th><th>%</th><th>Int.</th><th>Estado</th><th>Firma</th><th>Verificación</th><th></th></tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr>
        <td>${fmtDate(r.fecha_inicio || r.created_at)}</td><td>${esc(r.jornada_codigo || '–')}</td><td>${esc(fmtDni(r.dni) || '–')}</td><td>${esc(r.legajo || '–')}</td>
        <td>${esc(r.apellido)}, ${esc(r.nombre)}</td><td>${esc(r.empresa || '–')}</td><td>${esc(r.sector || '–')}</td><td>${esc(r.tipo_vehiculo || '–')}</td>
        <td>${r.porcentaje != null ? r.porcentaje + '%' : '–'}</td><td>${r.intentos || 0}</td><td><span class="st ${stCls(r.estado)}">${esc(r.estado)}</span></td>
        <td>${r.firmado ? `<span style="color:#5fd699">${ic('check')}</span>` : '<span class="dim">–</span>'}</td>
        <td><a href="verificar.html?c=${esc(r.verificacion)}" target="_blank" rel="noopener" style="color:var(--amber)">${esc(r.verificacion)}</a></td>
        <td class="row-acts"><a class="icon-btn" href="${docUrl('ind', r)}" target="_blank" rel="noopener" title="Informe individual" aria-label="Informe individual de ${esc(r.apellido)}">${ic('user')}</a>
          ${r.estado !== 'SIN COMPLETAR' || r.firmado ? `<a class="icon-btn" href="${docUrl('cert', r)}" target="_blank" rel="noopener" title="${r.estado === 'APROBADO' ? 'Certificado de aprobación' : 'Constancia de asistencia'}" aria-label="Certificado de ${esc(r.apellido)}">${ic('award')}</a>` : ''}
          <button class="icon-btn" data-del="${esc(r.id)}" title="Eliminar registro" aria-label="Eliminar registro de ${esc(r.apellido)}">${ic('trash')}</button></td>
      </tr>`).join('') : `<tr><td colspan="14" class="muted" style="text-align:center;padding:26px">No hay registros${AC.registros.length ? ' que coincidan con los filtros' : ''}.</td></tr>`}</tbody></table></div>`;
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
  $('#fXlsx').onclick = () => { const ids = new Set(acRows().map(r => r.id)); const regs = (AC.T ? AC.T.registros : []).filter(r => ids.has(r.id));
    const { sheets } = hojasDetalle(regs.length ? regs : acRows().map(r => ({ ...r, fecha:An.day(r.fecha_inicio || r.created_at), empresa:r.empresa })), AC.jornadas, AC.T ? AC.T.nomina : [], [], []);
    XLSX.download(`resultados_fatiga_${isoLocal(new Date())}.xlsx`, sheets.filter(s => ['Participantes','Temas','Riesgo por sector','Riesgo por vehículo','Vencimientos'].includes(s.name))); };
  $$('[data-del]', acEl).forEach(b => b.onclick = async () => {
    const r = AC.registros.find(x => x.id === b.dataset.del);
    if(!(await confirmDialog('Eliminar registro', `Se eliminará el registro de ${esc(r.apellido)}, ${esc(r.nombre)} (${esc(idPersona(r))}). Su constancia dejará de poder verificarse. Esta acción no se puede deshacer.`, 'Eliminar', 'Cancelar', true))) return;
    try{ await Central.rpc('rs_admin_eliminar_registro', { p_id:r.id }); await acReload(); }catch(err){ acError(err); }
  });
}
function acCsv(rows){
  const cols = [['fecha','Fecha'],['jornada','Jornada'],['dni','DNI'],['legajo','Legajo'],['nombre','Nombre'],['apellido','Apellido'],['empresa','Empresa'],['sector','Sector'],['tipo','Tipo de vehículo'],['inicio','Hora de inicio'],['fin','Hora de finalización'],['dur','Duración (min)'],['preg','Cantidad de preguntas'],['corr','Respuestas correctas'],['inc','Respuestas incorrectas'],['pct','Porcentaje'],['int','Intentos'],['estado','Estado'],['firma','Asistencia firmada'],['ver','Código de verificación'],['cap','Capacitador']];
  const cell = v => { let s = String(v ?? ''); if(/^[=+\-@]/.test(s)) s = "'" + s; return /[";\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const data = rows.map(r => ({ fecha:fmtDate(r.fecha_inicio || r.created_at), jornada:r.jornada_codigo || '', dni:fmtDni(r.dni), legajo:r.legajo || '', nombre:r.nombre, apellido:r.apellido, empresa:r.empresa, sector:r.sector,
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

/* ---------- Documentos y enlace para el cliente ---------- */
function docUrl(doc, r){ const u = new URL('documento.html', location.href); u.searchParams.set('doc', doc); if(r.jornada_id) u.searchParams.set('j', r.jornada_id); u.searchParams.set('r', r.id); return u.pathname.split('/').pop() + u.search; }
function informePublicoUrl(tok){ return new URL('informe.html?t=' + tok, location.href).href; }
function shareDialog(j, msg){
  const d = $('#dlg'), url = j.informe_token ? informePublicoUrl(j.informe_token) : '';
  const asunto = `Informe de capacitación · ${j.empresa} · ${fmtDate(j.fecha + 'T12:00:00')}`;
  const cuerpo = `Hola,\n\nLes comparto el informe de la capacitación "${j.capacitacion}" realizada el ${fmtDate(j.fecha + 'T12:00:00')}${j.lugar ? ' en ' + j.lugar : ''}.\n\n${url ? 'Pueden verlo, imprimirlo o guardarlo en PDF desde este enlace:\n' + url + '\n\n' : ''}Incluye resultados del grupo, temas a reforzar, mapa de riesgo y planilla de asistencia con firmas.\n\nSaludos,\n${j.capacitador}\n${CONFIG.consultora.nombre}`;
  const mailto = `mailto:${encodeURIComponent(j.contacto_email || '')}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  d.classList.add('wide');
  d.innerHTML = `<h2>${ic('message')} Compartir con el cliente</h2>
    <p class="muted sm">${esc(j.empresa)} · jornada ${esc(j.codigo)} · ${fmtDate(j.fecha + 'T12:00:00')}</p>
    ${Datos.v2 === false ? fb('info','Requiere actualización de la base', 'El enlace para compartir y el email de contacto se activan al aplicar supabase/02_reportes.sql. Mientras tanto, abrí el informe grupal, guardalo en PDF y adjuntalo en el mail.') : `
    <div class="field" style="margin-top:12px"><label for="shMail">EMAIL DE CONTACTO DE LA EMPRESA</label>
      <div style="display:flex;gap:8px"><input id="shMail" type="email" maxlength="120" value="${esc(j.contacto_email || '')}" placeholder="seguridad@empresa.com" style="flex:1"><button class="btn ghost sm" id="shSaveMail">${ic('check')} Guardar</button></div></div>
    <p class="eyebrow" style="margin-top:16px">Enlace del informe</p>
    ${url ? `<div class="jlink" style="grid-template-columns:1fr auto"><code style="overflow-wrap:anywhere">${esc(url.replace(/^https?:\/\//, ''))}</code><button class="btn sm ghost" data-copyurl="${esc(url)}">${ic('clipboard')} Copiar</button></div>
      <p class="sm dim" style="margin-top:6px">${ic('lock')} Quien tenga el enlace puede ver el informe, incluida la planilla de asistencia con nombres y firmas. Desactivalo cuando ya no haga falta.</p>`
      : `<p class="muted sm">El informe todavía no tiene enlace público. Al crearlo, la empresa puede verlo sin usuario ni contraseña.</p>`}`}
    <div id="shMsg">${msg || ''}</div>
    <div class="actions" style="flex-wrap:wrap">
      ${Datos.v2 === false ? '' : url ? `<button class="btn ghost" id="shOff">${ic('lock')} Desactivar enlace</button>` : `<button class="btn ghost" id="shOn">${ic('route')} Crear enlace</button>`}
      <button class="btn ghost" id="shClose">Cerrar</button>
      <a class="btn primary" id="shMailto" href="${esc(mailto)}">${ic('message')} Redactar email</a>
    </div>
    <p class="sm dim" style="margin-top:8px">"Redactar email" abre tu programa de correo con el mensaje listo${j.contacto_email ? ' para ' + esc(j.contacto_email) : ''}. Para que el sistema lo envíe solo, hace falta configurar un servicio de correo (ver README).</p>`;
  const close = () => { d.close(); d.classList.remove('wide'); };
  $('#shClose', d).onclick = close; d.oncancel = e => { e.preventDefault(); close(); };
  const fail = e => { $('#shMsg', d).innerHTML = fb('bad','No se pudo completar', esc(Datos.faltaFuncion(e) ? Datos.avisoV2() : e.message)); };
  const toggle = async on => { try{ const r = await Central.rpc('rs_admin_compartir_informe', { p_id:j.id, p_activar:on }); j.informe_token = r.token; shareDialog(j, on ? fb('ok','Enlace creado','Copialo o usá "Redactar email".') : fb('ok','Enlace desactivado','El enlace anterior dejó de funcionar.')); }catch(e){ fail(e); } };
  if($('#shOn', d)) $('#shOn', d).onclick = () => toggle(true);
  if($('#shOff', d)) $('#shOff', d).onclick = async () => { if(await confirmDialog('Desactivar enlace','El enlace dejará de funcionar para quien lo tenga. Podés crear uno nuevo después.','Desactivar','Cancelar')) toggle(false); else shareDialog(j); };
  if($('[data-copyurl]', d)) $('[data-copyurl]', d).onclick = e => copyText(e.currentTarget.dataset.copyurl, e.currentTarget);
  if($('#shSaveMail', d)) $('#shSaveMail', d).onclick = async () => {
    const v = $('#shMail', d).value.trim();
    if(v && !/^\S+@\S+\.\S+$/.test(v)) return fail(new Error('Email inválido'));
    try{ await Central.rpc('rs_admin_contacto_jornada', { p_id:j.id, p_email:v }); j.contacto_email = v || null; shareDialog(j, fb('ok','Email guardado','')); }catch(e){ fail(e); }
  };
  if(!d.open) d.showModal();
}
