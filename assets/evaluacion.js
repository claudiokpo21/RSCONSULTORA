'use strict';
/* evaluacion.js — EVALUACIÓN INDIVIDUAL (celular o computadora del participante)
   Flujo: identificación → confirmación → bienvenida (repaso opcional) →
          preguntas → resultado → constancia → envío al registro
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
let syncState = '';

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
async function sendNow(){ syncState = 'sending'; paintSync(); syncState = await Sync.send(buildRecord()); paintSync(); }

/* ---------- 1. Identificación ---------- */
function field(id, label, req, val, err, hint, ac){
  return `<div class="field ${err ? 'err' : ''}"><label for="f-${id}">${label}${req ? ' <span class="req">*</span>' : ''}</label>
    <input id="f-${id}" name="${id}" value="${esc(val || '')}" ${req ? 'required aria-required="true"' : ''} autocomplete="${ac || 'off'}" ${err ? `aria-invalid="true" aria-describedby="m-${id}"` : hint ? `aria-describedby="m-${id}"` : ''}>
    ${err || hint ? `<p class="msg" id="m-${id}">${err || hint}</p>` : ''}</div>`;
}
function viewForm(v, errs){
  progress(4); setWho();
  const privacidad = Sync.enabled()
    ? `Tus datos (nombre, apellido y legajo) se usan solo para registrar esta capacitación. Al rendir, tu resultado se envía al registro de <b>${esc(CONFIG.consultora.nombre)}</b>, al que accede únicamente el responsable de la capacitación.`
    : `Tus datos (nombre, apellido y legajo) se usan solo para registrar esta capacitación. En este prototipo se guardan <b>únicamente en este dispositivo</b> y no se envían a ningún servidor.`;
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Evaluación final</p><h1>IDENTIFICACIÓN DEL PARTICIPANTE</h1><p class="muted">Fatiga y conducción segura – Vehículos livianos y pesados<br>Dicta: ${esc(capacitador())}</p></div></div>
    <form id="idForm" novalidate>
      <div class="form-grid">
        ${field('legajo','LEGAJO',true,v.legajo,errs.legajo,CONFIG.legajo.descripcion)}
        <div></div>
        ${field('nombre','NOMBRE',true,v.nombre,errs.nombre,'','given-name')}
        ${field('apellido','APELLIDO',true,v.apellido,errs.apellido,'','family-name')}
        ${field('empresa','EMPRESA',false,v.empresa ?? CONFIG.organizacion.empresa,'','','organization')}
        ${field('sector','SECTOR / ÁREA',false,v.sector,'')}
        <fieldset class="field full"><legend>TIPO DE VEHÍCULO</legend><div class="radios">${TIPOS.map(t => `<label class="radio"><input type="radio" name="tipoVehiculo" value="${t}" ${v.tipoVehiculo === t ? 'checked' : ''}> ${t}</label>`).join('')}</div></fieldset>
      </div>
      <p class="sm dim" style="margin-top:10px"><span style="color:var(--amber)">*</span> Campos obligatorios</p>
      ${errs.general ? `<div class="form-error">${fb('bad', errs.general, '')}</div>` : ''}
      <div class="privacy">${ic('lock')}<span>${privacidad}</span></div>
      <div class="actions"><button type="submit" class="btn primary lg">${ic('arrow')} CONTINUAR</button></div>
    </form>
  </div>`);
  $('#idForm').onsubmit = e => { e.preventDefault(); submitForm(new FormData(e.target)); };
  const firstErr = $('.field.err input', view); (firstErr || $('#f-legajo')).focus({ preventScroll:true });
}
function submitForm(fd){
  const v = {}; ['legajo','nombre','apellido','empresa','sector','tipoVehiculo'].forEach(k => v[k] = String(fd.get(k) || '').trim().replace(/\s+/g, ' '));
  v.legajo = v.legajo.toUpperCase();
  const errs = {}, nameRe = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]{2,60}$/;
  if(!v.legajo) errs.legajo = 'El legajo es obligatorio.';
  else if(!CONFIG.legajo.patron.test(v.legajo)) errs.legajo = 'Formato inválido. ' + CONFIG.legajo.descripcion;
  else if(SessionReg.has(v.legajo)) errs.legajo = 'Este legajo ya fue registrado en esta sesión.';
  if(!v.nombre) errs.nombre = 'El nombre es obligatorio.'; else if(!nameRe.test(v.nombre)) errs.nombre = 'Ingresá un nombre válido (solo letras).';
  if(!v.apellido) errs.apellido = 'El apellido es obligatorio.'; else if(!nameRe.test(v.apellido)) errs.apellido = 'Ingresá un apellido válido (solo letras).';
  if(v.empresa.length > 80) v.empresa = v.empresa.slice(0, 80);
  if(v.sector.length > 80) v.sector = v.sector.slice(0, 80);
  if(Object.keys(errs).length){ errs.general = 'Revisá los campos marcados.'; viewForm(v, errs); return; }
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
  $('#cEdit').onclick = () => viewForm(State.participant, {});
  $('#cOk').onclick = () => {
    if(SessionReg.has(State.participant.legajo)){ viewForm(State.participant, { legajo:'Este legajo ya fue registrado en esta sesión.', general:'Registro duplicado.' }); return; }
    State.recordId = uid();
    State.training.fechaInicio = new Date().toISOString();
    SessionReg.add(State.participant.legajo);
    persist();
    Sync.send(buildRecord());   // registra el ingreso (estado SIN COMPLETAR)
    viewWelcome();
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
function startQuiz(){ State.quiz = { idx:0, answers:[], done:false }; viewQuestion(); }
function viewQuestion(){
  const Q = CONTENT.quiz, qs = State.quiz, i = qs.idx, q = Q[i];
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
  const Q = CONTENT.quiz, e = State.evaluation;
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
    sent:    ['ok', `${ic('check')} <span>Resultado enviado al registro de ${esc(CONFIG.consultora.nombre)}.</span>`],
    error:   ['warn', `${ic('alert')} <span>No se pudo enviar el resultado (¿sin conexión?). Quedó guardado en este dispositivo.</span><button class="btn sm ghost" id="syncRetry">${ic('refresh')} Reintentar envío</button>`]
  }[syncState] || ['', ''];
  box.className = 'sync ' + M[0]; box.innerHTML = M[1]; box.hidden = !M[1];
  const r = $('#syncRetry'); if(r) r.onclick = sendNow;
}
function viewResult(){
  progress(100);
  const e = State.evaluation, ok = isApproved(e.porcentaje), min = CONFIG.aprobacion.porcentajeMinimo, Q = CONTENT.quiz;
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
  Sync.send(buildRecord());
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
    <div class="signature">${instructorCard(CONFIG.consultora.nombre + ' · Capacitación dictada por')}</div>
    <div class="actions">${ok ? `<button class="btn green" id="fPrint">${ic('print')} CONSTANCIA</button>` : ''}<button class="btn ghost" id="fNew">${ic('user')} Registrar otro participante</button></div>
    <p class="sm dim" style="margin-top:10px">Ya podés cerrar esta página. Usá “Registrar otro participante” solo si este equipo es compartido.</p>
  </div>`);
  if($('#fPrint')) $('#fPrint').onclick = printCertificate;
  $('#fNew').onclick = () => { State = newState(); syncState = ''; viewForm({}, {}); };
}

/* ---------- Inicio ---------- */
window.addEventListener('beforeunload', e => { if(State.recordId && !State.quiz.done){ e.preventDefault(); e.returnValue = ''; } });
(function init(){ initBrand(); viewForm({}, {}); })();
