'use strict';
/* evaluacion.js — EVALUACIÓN INDIVIDUAL (celular o computadora del participante)
   Flujo: identificación → confirmación → bienvenida (repaso opcional) →
          preguntas → resultado → constancia → envío al registro
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
let syncState = '';
let JORNADA = null, JORNADA_ERR = '';

function show(html, focusSel){
  view.innerHTML = `<div class="slide">${html}</div>`;
  window.scrollTo(0, 0);
  const f = focusSel && $(focusSel, view);
  if(f) f.focus({ preventScroll:true });
}
function progress(p){ $('#progressFill').style.width = p + '%'; $('#progressBar').setAttribute('aria-valuenow', p); }
function setWho(){
  const c = $('#whoChip'), p = State.participant;
  if(State.recordId){ c.hidden = false; c.textContent = `${fullName()} | Legajo: ${p.legajo}`; } else { c.hidden = true; c.textContent = ''; }
}
function centralPayload(){
  const p = State.participant, t = State.training, e = State.evaluation;
  return { id:State.recordId, token:State.token, jornada:State.jornada, legajo:p.legajo, nombre:p.nombre, apellido:p.apellido,
    empresa:p.empresa, sector:p.sector, tipo_vehiculo:p.tipoVehiculo, capacitacion:CONFIG.capacitacion.nombre, capacitador:capacitador(),
    fecha_inicio:t.fechaInicio, fecha_fin:t.fechaFin, duracion_min:t.duracion, preguntas:e.preguntas, correctas:e.correctas,
    intentos:e.intentos, criterio:CONFIG.aprobacion.porcentajeMinimo, respuestas: State.quiz.done ? respuestasGuardadas() : null, firma:State.firma,
    satisfaccion: State.satisfaccion || null, comentario: State.comentario || null, consentimiento: State.consentimiento || null };
}
/** Envía el registro al servidor central (Supabase) y, si está configurada, a la planilla de Google. */
async function sendAll(){
  if(!State.recordId) return;
  if(Sync.enabled()) Sync.send(buildRecord());
  if(!Central.enabled()){ syncState = Sync.enabled() ? 'sent' : 'local'; paintSync(); return; }
  syncState = 'sending'; paintSync();
  const r = await Central.registrar(centralPayload());
  if(r.ok){ syncState = 'sent'; if(r.verificacion){ State.verificacion = r.verificacion; persist(); } }
  else syncState = r.queued ? 'queued' : 'error';
  paintSync();
}
const sendNow = sendAll;

/* ---------- 1. Identificación ---------- */
function field(id, label, req, val, err, hint, ac){
  return `<div class="field ${err ? 'err' : ''}"><label for="f-${id}">${label}${req ? ' <span class="req">*</span>' : ''}</label>
    <input id="f-${id}" name="${id}" value="${esc(val || '')}" ${req ? 'required aria-required="true"' : ''} autocomplete="${ac || 'off'}" ${err ? `aria-invalid="true" aria-describedby="m-${id}"` : hint ? `aria-describedby="m-${id}"` : ''}>
    ${err || hint ? `<p class="msg" id="m-${id}">${err || hint}</p>` : ''}</div>`;
}
function viewForm(v, errs){
  progress(4); setWho();
  const privacidad = (Sync.enabled() || Central.enabled())
    ? `Tus datos (nombre, apellido, legajo${CONFIG.asistencia && CONFIG.asistencia.firmaObligatoria ? ' y firma' : ''}) se usan solo para registrar esta capacitación. Se envían al registro de <b>${esc(CONFIG.consultora.nombre)}</b>, al que accede únicamente el responsable de la capacitación.`
    : `Tus datos (nombre, apellido y legajo) se usan solo para registrar esta capacitación. En este prototipo se guardan <b>únicamente en este dispositivo</b> y no se envían a ningún servidor.`;
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Evaluación final</p><h1>IDENTIFICACIÓN DEL PARTICIPANTE</h1><p class="muted">Fatiga y conducción segura – Vehículos livianos y pesados<br>Dicta: ${esc(capacitador())}</p></div></div>
    ${jornadaBanner()}
    <form id="idForm" novalidate>
      <div class="form-grid">
        ${field('legajo','LEGAJO',true,v.legajo,errs.legajo,CONFIG.legajo.descripcion)}
        <div></div>
        ${field('nombre','NOMBRE',true,v.nombre,errs.nombre,'','given-name')}
        ${field('apellido','APELLIDO',true,v.apellido,errs.apellido,'','family-name')}
        ${field('empresa','EMPRESA',false,v.empresa ?? (JORNADA ? JORNADA.empresa : CONFIG.organizacion.empresa),'','','organization')}
        ${field('sector','SECTOR / ÁREA',false,v.sector,'')}
        <fieldset class="field full"><legend>TIPO DE VEHÍCULO</legend><div class="radios">${TIPOS.map(t => `<label class="radio"><input type="radio" name="tipoVehiculo" value="${t}" ${v.tipoVehiculo === t ? 'checked' : ''}> ${t}</label>`).join('')}</div></fieldset>
      </div>
      <p class="sm dim" style="margin-top:10px"><span style="color:var(--amber)">*</span> Campos obligatorios</p>
      ${errs.general ? `<div class="form-error">${fb('bad', errs.general, '')}</div>` : ''}
      <div class="privacy">${ic('lock')}<span>${privacidad}</span></div>
      <label class="consent ${errs.consent ? 'err' : ''}"><input type="checkbox" name="consent" ${v.consent ? 'checked' : ''} aria-describedby="m-consent">
        <span>Leí el <a href="privacidad.html" target="_blank" rel="noopener">aviso de privacidad</a> y acepto que mis datos se usen para registrar esta capacitación. <span class="req">*</span></span></label>
      ${errs.consent ? `<p class="msg consent-msg" id="m-consent">${errs.consent}</p>` : ''}
      <div class="actions"><button type="submit" class="btn primary lg">${ic('arrow')} CONTINUAR</button></div>
    </form>
  </div>`);
  $('#idForm').onsubmit = e => { e.preventDefault(); submitForm(new FormData(e.target)); };
  const firstErr = $('.field.err input', view); (firstErr || $('#f-legajo')).focus({ preventScroll:true });
}
function submitForm(fd){
  const v = {}; ['legajo','nombre','apellido','empresa','sector','tipoVehiculo'].forEach(k => v[k] = String(fd.get(k) || '').trim().replace(/\s+/g, ' '));
  v.consent = fd.get('consent') === 'on';
  v.legajo = v.legajo.toUpperCase();
  const errs = {}, nameRe = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{2,60}$/;
  if(!v.legajo) errs.legajo = 'El legajo es obligatorio.';
  else if(!CONFIG.legajo.patron.test(v.legajo)) errs.legajo = 'Formato inválido. ' + CONFIG.legajo.descripcion;
  else if(SessionReg.has(v.legajo)) errs.legajo = 'Este legajo ya fue registrado en esta sesión.';
  if(!v.nombre) errs.nombre = 'El nombre es obligatorio.'; else if(!nameRe.test(v.nombre)) errs.nombre = 'Ingresá un nombre válido (solo letras).';
  if(!v.apellido) errs.apellido = 'El apellido es obligatorio.'; else if(!nameRe.test(v.apellido)) errs.apellido = 'Ingresá un apellido válido (solo letras).';
  if(v.empresa.length > 80) v.empresa = v.empresa.slice(0, 80);
  if(v.sector.length > 80) v.sector = v.sector.slice(0, 80);
  if(!v.consent) errs.consent = 'Para registrar la capacitación tenés que aceptar el aviso de privacidad.';
  if(Object.keys(errs).length){ errs.general = 'Revisá los campos marcados.'; viewForm(v, errs); return; }
  State.consentimiento = new Date().toISOString();
  const cap = s => s.toLowerCase().replace(/(^|[\s'-])(\S)/g, (m, a, b) => a + b.toUpperCase());
  State.participant = { legajo:v.legajo, nombre:cap(v.nombre), apellido:cap(v.apellido), empresa:v.empresa, sector:v.sector, tipoVehiculo:v.tipoVehiculo };
  viewConfirm();
}

/* ---------- 2. Confirmación ---------- */
function viewConfirm(){
  progress(8);
  const p = State.participant, row = (k, val) => `<tr><th>${k}</th><td>${val ? esc(val) : '<span class="dim">No indicado</span>'}</td></tr>`;
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">Paso 2 de 2</p><h1>Confirmá tus datos</h1><p class="muted">Verificá que la información sea correcta antes de comenzar.</p></div></div>
    <table class="confirm-table">${row('Legajo',p.legajo)}${row('Nombre',p.nombre)}${row('Apellido',p.apellido)}${row('Empresa',p.empresa)}${row('Sector / Área',p.sector)}${row('Tipo de vehículo',p.tipoVehiculo)}</table>
    <div class="actions"><button class="btn ghost" id="cEdit">${ic('arrowl')} Corregir datos</button><button class="btn primary" id="cOk">${ic('check')} Confirmar datos</button></div>
  </div>`, '#cOk');
  $('#cEdit').onclick = () => viewForm({ ...State.participant, consent: !!State.consentimiento }, {});
  $('#cOk').onclick = () => {
    if(SessionReg.has(State.participant.legajo)){ viewForm({ ...State.participant, consent: !!State.consentimiento }, { legajo:'Este legajo ya fue registrado en esta sesión.', general:'Registro duplicado.' }); return; }
    State.recordId = uid();
    State.training.fechaInicio = new Date().toISOString();
    SessionReg.add(State.participant.legajo);
    State.token = randomToken();
    State.jornada = JORNADA ? JORNADA.codigo : null;
    persist();
    if(CONFIG.asistencia && CONFIG.asistencia.firmaObligatoria) viewFirma();
    else { sendAll(); viewWelcome(); }
  };
}

/* ---------- Jornada ---------- */
function jornadaBanner(){
  if(JORNADA && !JORNADA.offline) return `<div class="jornada-chip">${ic('calendar')}<div><small>Jornada ${esc(JORNADA.codigo)}</small><b>${esc(JORNADA.empresa)}</b>${JORNADA.lugar ? ` · ${esc(JORNADA.lugar)}` : ''} · ${fmtDate(JORNADA.fecha + 'T12:00:00')}</div></div>`;
  if(JORNADA_ERR) return fb('warn', 'Atención', JORNADA_ERR);
  return '';
}

/* ---------- 2b. Registro de asistencia con firma ---------- */
function viewFirma(){
  progress(10);
  const p = State.participant, hoy = fmtDate(new Date());
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">Registro de asistencia</p><h1>Firmá tu asistencia</h1><p class="muted">Usá el dedo (o el mouse) dentro del recuadro.</p></div></div>
    <p class="declaracion">Yo, <b>${esc(fullName())}</b>, legajo <b>${esc(p.legajo)}</b>, declaro haber asistido a la capacitación <b>“${esc(CONFIG.capacitacion.nombre)}”</b>, dictada por ${esc(capacitador())} (${esc(CONFIG.consultora.nombre)}), el día ${hoy}${JORNADA && JORNADA.empresa ? ` para ${esc(JORNADA.empresa)}` : ''}.</p>
    <div class="sigpad-wrap"><canvas id="sigpad" class="sigpad" aria-label="Recuadro para firmar"></canvas><span class="sig-hint" id="sigHint">Firmá acá</span></div>
    <div class="actions">
      <button class="btn ghost" id="sigClear">${ic('refresh')} Borrar</button>
      <button class="btn primary lg" id="sigOk" disabled>${ic('check')} FIRMAR Y CONTINUAR</button>
    </div>
  </div>`);
  const pad = SignaturePad($('#sigpad'), () => { $('#sigOk').disabled = !pad.hasInk(); $('#sigHint').hidden = pad.hasInk(); });
  $('#sigClear').onclick = () => pad.clear();
  $('#sigOk').onclick = () => {
    if(!pad.hasInk()) return;
    State.firma = pad.export();
    persist();
    sendAll();
    viewWelcome();
  };
}
/** Recuadro de firma: dibuja en claro sobre la pantalla y exporta en tinta oscura (PNG transparente). */
function SignaturePad(canvas, onChange){
  const strokes = []; let cur = null;
  const ctx = canvas.getContext('2d');
  function size(){
    const r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
  }
  function line(c, pts, color, w){
    c.strokeStyle = color; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); pts.forEach((pt, i) => i ? c.lineTo(pt[0], pt[1]) : c.moveTo(pt[0], pt[1]));
    if(pts.length === 1) c.lineTo(pts[0][0] + .1, pts[0][1] + .1);
    c.stroke();
  }
  function draw(){ const r = canvas.getBoundingClientRect(); ctx.clearRect(0, 0, r.width, r.height); strokes.forEach(s => line(ctx, s, '#f3f5f7', 2.6)); }
  function pos(e){ const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); cur = [pos(e)]; strokes.push(cur); draw(); onChange(); });
  canvas.addEventListener('pointermove', e => { if(!cur) return; e.preventDefault(); cur.push(pos(e)); draw(); });
  const end = () => { if(cur){ cur = null; onChange(); } };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('pointerleave', end);
  window.addEventListener('resize', size);
  size();
  return {
    hasInk(){ return strokes.some(s => s.length > 3) || strokes.length > 1; },
    clear(){ strokes.length = 0; draw(); onChange(); },
    export(){
      const r = canvas.getBoundingClientRect(), W = 600, H = Math.round(600 * r.height / r.width);
      const out = document.createElement('canvas'); out.width = W; out.height = H;
      const c = out.getContext('2d'), k = W / r.width;
      strokes.forEach(s => line(c, s.map(pt => [pt[0] * k, pt[1] * k]), '#111418', 2.6 * k));
      return out.toDataURL('image/png');
    }
  };
}

/* ---------- 3. Bienvenida y repaso ---------- */
function viewWelcome(){
  progress(12); setWho();
  const p = State.participant;
  show(`<div class="gate-card welcome">
    ${ic('check','xl')}
    <h1>Bienvenido/a, ${esc(p.nombre)} ${esc(p.apellido)}</h1>
    <p class="leg">Legajo: ${esc(p.legajo)}</p>
    <div class="signature">${instructorCard('Te acompaña en esta capacitación')}</div>
    <p class="muted" style="margin:18px auto 0;max-width:520px">La evaluación tiene ${CONTENT.quiz.length} preguntas de opción múltiple. Aprobás con ${CONFIG.aprobacion.porcentajeMinimo}% o más. Después de cada respuesta vas a ver la explicación.</p>
    <div class="actions" style="justify-content:center;margin-top:24px"><button class="btn ghost" id="wRep">${ic('eye')} Repaso rápido</button><button class="btn primary lg" id="wGo">${ic('play')} COMENZAR EVALUACIÓN</button></div>
  </div>`, '#wGo');
  $('#wRep').onclick = viewRepaso;
  $('#wGo').onclick = startQuiz;
}
function viewRepaso(){
  progress(16);
  show(`${head('Repaso rápido','Lo más importante antes de empezar')}
    <div class="grid g2">${CONTENT.repaso.map(r => `<div class="card repaso-card">${ic(r.icon,'lg')}<p>${r.t}</p></div>`).join('')}</div>
    <div class="callout">${ic('stop')} <span>DETENERSE A TIEMPO TAMBIÉN ES SEGURIDAD.</span></div>
    <div class="actions"><button class="btn primary lg" id="rGo">${ic('play')} COMENZAR EVALUACIÓN</button></div>`, '#rGo');
  $('#rGo').onclick = startQuiz;
}

/* ---------- 4. Preguntas ---------- */
function startQuiz(){ State.quiz = { idx:0, answers:[], done:false, preguntas:sortearEvaluacion() }; viewQuestion(); }
/** Preguntas del intento actual (sorteadas). Si el intento es anterior al banco, usa las originales. */
function preguntasActuales(){
  const P = State.quiz.preguntas;
  return Array.isArray(P) && P.length ? P.map(vistaPregunta) : CONTENT.quiz;
}
/** Respuestas en el formato que se guarda: por tema, versión de la pregunta y opción original elegida. */
function respuestasGuardadas(){
  const P = State.quiz.preguntas, A = State.quiz.answers;
  if(!Array.isArray(P) || !P.length) return A;
  return P.map((p, i) => A[i] == null ? null : { v:p.v, a:p.orden[A[i]] });
}
function viewQuestion(){
  const Q = preguntasActuales(), qs = State.quiz, i = qs.idx, q = Q[i];
  progress(20 + Math.round(i / Q.length * 72));
  show(`<div class="qcard">
    <div class="qhead"><span class="score-pill">Pregunta ${i+1} de ${Q.length}</span>
      <div class="qprog" aria-hidden="true">${Q.map((_,k) => `<i class="${k < i ? (qs.answers[k] === Q[k].c ? 'ok' : 'bad') : k === i ? 'cur' : ''}"></i>`).join('')}</div></div>
    <h2 class="qtext">${q.q}</h2>
    <div class="options" role="group" aria-label="Opciones">${q.o.map((o,k) => `<button class="opt" data-k="${k}"><span class="opt-l">${'ABCD'[k]}</span>${o}</button>`).join('')}</div>
    <div id="qFb"></div></div>`);
  const opts = $$('.opt', view);
  opts.forEach(b => b.onclick = () => {
    const k = +b.dataset.k; qs.answers[i] = k;
    opts.forEach((x,j) => { x.disabled = true; if(j === q.c) x.classList.add('right'); else if(j !== k) x.classList.add('faded'); });
    const ok = k === q.c; if(!ok) b.classList.add('wrong');
    const last = i === Q.length - 1;
    $('#qFb').innerHTML = fb(ok ? 'ok' : 'bad', ok ? 'Correcto' : 'Incorrecto', q.e)
      + `<div class="actions"><button class="btn primary lg" id="qNext">${last ? 'Ver resultado' : 'Siguiente pregunta'} ${ic('arrow')}</button></div>`;
    $('#qNext').onclick = () => { if(last) finishQuiz(); else { qs.idx++; viewQuestion(); } };
    $('#qNext').focus({ preventScroll:true });
    $('#qFb').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block:'nearest' });
  });
}
function finishQuiz(){
  const Q = preguntasActuales(), e = State.evaluation;
  e.preguntas = Q.length;
  e.correctas = Q.filter((q,k) => State.quiz.answers[k] === q.c).length;
  e.incorrectas = Q.length - e.correctas;
  e.porcentaje = Math.round(e.correctas / Q.length * 100);
  e.intentos += 1;
  e.estado = isApproved(e.porcentaje) ? 'APROBADO' : 'NO APROBADO';
  State.quiz.done = true;
  State.training.fechaFin = new Date().toISOString();
  State.training.duracion = minutesBetween(State.training.fechaInicio, State.training.fechaFin);
  persist();
  viewResult();
  sendNow();
}

/* ---------- 5. Resultado y constancia ---------- */
function paintSync(){
  const box = $('#syncBox'); if(!box) return;
  const M = {
    local:   ['', `${ic('info')} <span>Prototipo: el resultado quedó guardado en este dispositivo. La planilla central todavía no está conectada.</span>`],
    sending: ['', `${ic('refresh')} <span>Enviando resultado…</span>`],
    sent:    ['ok', `${ic('check')} <span>Resultado registrado en ${esc(CONFIG.consultora.nombre)}${State.verificacion ? ` · Código de verificación: <b>${esc(State.verificacion)}</b>` : ''}.</span>`],
    queued:  ['warn', `${ic('clock')} <span>Sin conexión: el resultado quedó guardado en este dispositivo y se enviará automáticamente cuando vuelva la señal.</span>`],
    error:   ['warn', `${ic('alert')} <span>No se pudo enviar el resultado (¿sin conexión?). Quedó guardado en este dispositivo.</span><button class="btn sm ghost" id="syncRetry">${ic('refresh')} Reintentar envío</button>`]
  }[syncState] || ['', ''];
  box.className = 'sync ' + M[0]; box.innerHTML = M[1]; box.hidden = !M[1];
  const vc = $('#verCode'); if(vc && State.verificacion) vc.textContent = State.verificacion;
  const r = $('#syncRetry'); if(r) r.onclick = sendNow;
}
function viewResult(){
  progress(100);
  const e = State.evaluation, ok = isApproved(e.porcentaje), min = CONFIG.aprobacion.porcentajeMinimo, Q = preguntasActuales();
  const msg = ok ? '¡Muy bien! Demostraste comprender los conceptos clave para prevenir la fatiga al conducir. Lo más importante es aplicarlos en cada viaje.'
    : e.porcentaje >= 60 ? 'Tenés una buena base, pero hay conceptos para reforzar. Revisá tus respuestas y volvé a intentarlo.'
    : 'Te recomendamos revisar las explicaciones de cada pregunta y volver a intentarlo. Ante cualquier duda, consultá al capacitador.';
  show(`${head('Evaluación','RESULTADO DE LA CAPACITACIÓN')}
  <div class="panel result-top">
    <div class="ring" style="--p:${e.porcentaje};--c:${ok ? 'var(--green)' : 'var(--amber)'}"><div><div><strong>${e.porcentaje}%</strong><div class="sm muted">obtenido</div></div></div></div>
    <div>
      <p class="eyebrow">Tu resultado</p>
      <span class="status-badge ${ok ? 'ok' : 'bad'}">${ic(ok ? 'check' : 'x')} ${e.estado}</span>
      <div class="stats-row">
        <div class="stat"><b>${e.correctas} / ${e.preguntas}</b>Correctas</div>
        <div class="stat"><b>${e.incorrectas}</b>Incorrectas</div>
        <div class="stat"><b>${e.intentos}</b>Intento${e.intentos > 1 ? 's' : ''}</div>
        <div class="stat"><b>${min}%</b>Para aprobar</div>
      </div>
      <p>${msg}</p>
    </div>
  </div>
  <div id="syncBox" class="sync" hidden></div>
  <details class="review"><summary>Revisar mis respuestas</summary><ol>${Q.map((q,k) => { const good = State.quiz.answers[k] === q.c; return `<li><span style="color:${good ? '#5fd699' : '#ff8a8d'}">${good ? '✔' : '✖'}</span> ${q.q}${good ? '' : `<br><span class="sm muted">Respuesta correcta: ${q.o[q.c]}</span>`}</li>`; }).join('')}</ol></details>
  ${ok ? `<div class="cert-screen">
    <h2>${ic('award')} CAPACITACIÓN COMPLETADA</h2>
    <dl class="cert-grid">
      <div><dt>Nombre y apellido</dt><dd>${esc(fullName())}</dd></div>
      <div><dt>Legajo</dt><dd>${esc(State.participant.legajo)}</dd></div>
      <div><dt>Capacitación</dt><dd>${esc(CONFIG.capacitacion.nombre)}</dd></div>
      <div><dt>Resultado</dt><dd>${e.porcentaje} %</dd></div>
      <div><dt>Estado</dt><dd style="color:#5fd699">APROBADO</dd></div>
      <div><dt>Fecha</dt><dd>${fmtDate(State.training.fechaFin || new Date())}</dd></div>
      <div><dt>Capacitador</dt><dd>${esc(capacitador())}</dd></div>
      <div><dt>Dictada por</dt><dd>${esc(CONFIG.consultora.nombre)}</dd></div>
      <div><dt>Código de verificación</dt><dd id="verCode">${State.verificacion ? esc(State.verificacion) : '<span class="dim">Se asigna al registrarse</span>'}</dd></div>
    </dl>
    <div class="actions"><button class="btn green" id="rPrint">${ic('print')} IMPRIMIR / GUARDAR CONSTANCIA</button></div>
    <p class="sm dim" style="margin-top:8px">En el celular, elegí “Guardar como PDF” en las opciones de impresión.</p>
  </div>` : ''}
  <div class="actions">
    <button class="btn ghost" id="rRetry">${ic('refresh')} REINTENTAR EVALUACIÓN</button>
    <button class="btn primary" id="rEnd">${ic('flag')} FINALIZAR</button>
  </div>
  <p class="disclaimer">${ic('info')} Este resultado refleja la comprensión de los contenidos de la capacitación. No constituye una evaluación médica ni de aptitud laboral. Se registra el resultado del último intento.</p>`);
  paintSync();
  $('#rRetry').onclick = startQuiz;
  $('#rEnd').onclick = finalizar;
  if($('#rPrint')) $('#rPrint').onclick = printCertificate;
}

/* ---------- 6. Cierre ---------- */
function finalizar(){
  State.training.fechaFin = new Date().toISOString();
  State.training.duracion = minutesBetween(State.training.fechaInicio, State.training.fechaFin);
  State.finalizada = true;
  persist();
  sendAll();
  viewFin();
}
function viewFin(){
  const p = State.participant, e = State.evaluation, t = State.training, ok = e.estado === 'APROBADO';
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">Registro de capacitación</p><h1>¡Gracias, ${esc(p.nombre)}!</h1><p class="muted">Gracias por tu participación y por sumarte a una cultura preventiva.</p></div></div>
    <table class="confirm-table">
      <tr><th>Participante</th><td>${esc(fullName())} · Legajo ${esc(p.legajo)}</td></tr>
      <tr><th>Fecha</th><td>${fmtDate(t.fechaInicio)} · ${fmtTime(t.fechaInicio)} a ${fmtTime(t.fechaFin)} (≈ ${t.duracion} min)</td></tr>
      <tr><th>Resultado</th><td>${e.correctas} de ${e.preguntas} correctas · ${e.porcentaje}% · ${e.intentos} intento${e.intentos > 1 ? 's' : ''}</td></tr>
      <tr><th>Estado</th><td><span class="status-badge ${ok ? 'ok' : 'bad'}">${e.estado}</span></td></tr>
    </table>
    <div class="callout green">${ic('shield')} <span>Si estás fatigado, no continúes conduciendo. Detenerse a tiempo también es seguridad.</span></div>
    ${Central.enabled() ? opinionHTML() : ''}
    <div class="signature">${instructorCard(CONFIG.consultora.nombre + ' · Capacitación dictada por')}</div>
    <div class="actions">${ok ? `<button class="btn green" id="fPrint">${ic('print')} CONSTANCIA</button>` : ''}<button class="btn ghost" id="fNew">${ic('user')} Registrar otro participante</button></div>
    <p class="sm dim" style="margin-top:10px">Ya podés cerrar esta página. Usá “Registrar otro participante” solo si este equipo es compartido.</p>
  </div>`);
  if($('#fPrint')) $('#fPrint').onclick = printCertificate;
  bindOpinion();
  $('#fNew').onclick = () => { State = newState(); syncState = ''; viewForm({}, {}); };
}

/* ---------- Opinión sobre la capacitación (satisfacción 1 a 5) ---------- */
const OPINION = ['Muy mala','Mala','Regular','Buena','Muy buena'];
function opinionHTML(){
  if(State.opinionEnviada) return `<div class="opinion done">${ic('check')} <span>¡Gracias por tu opinión! Nos ayuda a mejorar la capacitación.</span></div>`;
  const v = State.satisfaccion || 0;
  return `<form class="opinion" id="opForm" novalidate>
    <p class="eyebrow">Tu opinión (opcional)</p>
    <h2 class="op-q">¿Cómo calificás la capacitación?</h2>
    <div class="stars" role="radiogroup" aria-label="Calificación de 1 a 5">${[1,2,3,4,5].map(n => `<button type="button" role="radio" aria-checked="${v === n}" aria-label="${n} de 5: ${OPINION[n - 1]}" data-star="${n}" class="${n <= v ? 'on' : ''}">★</button>`).join('')}</div>
    <p class="op-lbl" id="opLbl">${v ? OPINION[v - 1] : 'Tocá una estrella'}</p>
    <label class="sr-only" for="opCom">Comentario</label>
    <textarea id="opCom" maxlength="300" placeholder="¿Algo para destacar o mejorar? (opcional)">${esc(State.comentario || '')}</textarea>
    <p class="sm dim">En los informes, las opiniones se muestran sin tu nombre.</p>
    <div class="actions" style="margin-top:8px"><button class="btn primary" type="submit" id="opSend" ${v ? '' : 'disabled'}>${ic('message')} ENVIAR OPINIÓN</button></div>
  </form>`;
}
function bindOpinion(){
  const f = $('#opForm'); if(!f) return;
  const paint = v => { $$('[data-star]', f).forEach(b => { const n = +b.dataset.star; b.classList.toggle('on', n <= v); b.setAttribute('aria-checked', String(n === v)); }); $('#opLbl').textContent = v ? OPINION[v - 1] : 'Tocá una estrella'; $('#opSend').disabled = !v; };
  $$('[data-star]', f).forEach(b => b.onclick = () => { State.satisfaccion = +b.dataset.star; paint(State.satisfaccion); });
  f.onsubmit = async e => {
    e.preventDefault(); if(!State.satisfaccion) return;
    State.comentario = $('#opCom').value.trim().slice(0, 300); State.opinionEnviada = true; persist();
    f.outerHTML = opinionHTML();
    await sendAll();
  };
}

/* Si se imprime con el menú del navegador (Ctrl+P, Compartir → Imprimir) estando aprobado,
   se imprime la constancia en una hoja en lugar de la pantalla completa. */
window.addEventListener('beforeprint', () => {
  if(document.body.classList.contains('print-cert') || !State.recordId || State.evaluation.estado !== 'APROBADO') return;
  renderCertificate();
  const done = () => { document.body.classList.remove('print-cert'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
});

/* ---------- Inicio ---------- */
window.addEventListener('beforeunload', e => { if(State.recordId && !State.quiz.done){ e.preventDefault(); e.returnValue = ''; } });
(async function init(){
  initBrand();
  const j = jornadaParam();
  if(j && Central.enabled()){
    show(`<div class="gate-card welcome"><div class="spinner" aria-hidden="true"></div><p class="muted">Cargando la jornada…</p></div>`);
    try{
      JORNADA = await Central.jornadaPublica(j);
      if(!JORNADA) JORNADA_ERR = 'El código de jornada no existe. Consultá al capacitador.';
      else if(!JORNADA.abierta){ JORNADA_ERR = 'Esta jornada ya está cerrada. Consultá al capacitador.'; JORNADA = null; }
    }catch(e){ JORNADA_ERR = Central.isNetworkError(e) ? 'Sin conexión: tu resultado se guardará en este dispositivo y se enviará cuando vuelva la señal.' : 'No se pudo cargar la jornada.'; JORNADA = { codigo:j, empresa:'', offline:true }; }
  }
  viewForm({}, {});
})();
