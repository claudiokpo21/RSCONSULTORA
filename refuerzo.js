'use strict';
/* refuerzo.js — REFUERZO A LOS 30 DÍAS (anónimo)
   Unas pocas preguntas (CONFIG.reportes.refuerzo), en la versión alternativa del banco para que no
   sean idénticas a las de la evaluación. Muestra la respuesta correcta y la explicación después de
   cada una: sirve para repasar y, a nivel de grupo, para medir cuánto se retuvo.
   No pide nombre, DNI ni legajo. Se puede responder hasta 180 días después de la jornada.
   Se guarda { tema: opción elegida (índice original de la versión 1) }.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
const REF_V = 1;   // versión del banco que se usa en el refuerzo
const KS = ((CONFIG.reportes && CONFIG.reportes.refuerzo) || [2, 8, 9]).filter(k => CONTENT.quiz[k]);
const R = { j:jornadaParam(), jornada:null, i:0, resp:{}, ok:0, orden:{} };
const doneKey = () => 'rs-ref-' + R.j;
const preg = k => preguntaDe(k, REF_V);
function show(html){ view.innerHTML = html; window.scrollTo(0, 0); const h = $('h1,h2', view); if(h){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll:true }); } }
function progress(p){ $('#progressFill').style.width = p + '%'; }
function uuid(){ return (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16; return (c === 'x' ? r : (r & 3 | 8)).toString(16); })); }
function card(icon, title, body, extra){ return `<div class="gate-card welcome">${ic(icon, 'xl')}<h1 style="font-size:1.5rem">${title}</h1><p class="muted">${body}</p>${extra || ''}</div>`; }
function mezclar(n){ const o = [...Array(n).keys()]; for(let i = n - 1; i > 0; i--){ const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [o[i], o[j]] = [o[j], o[i]]; } return o; }

function intro(){
  progress(4);
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Refuerzo</p><h1>¿TE ACORDÁS?</h1>
      <p class="muted">${esc(CONFIG.capacitacion.nombre)}${R.jornada ? `<br>${esc(R.jornada.empresa || '')} · capacitación del ${fmtDate(R.jornada.fecha + 'T12:00:00')}` : ''}</p></div></div>
    <ul class="diag-points">
      <li>${ic('clock')} <span><b>${KS.length} preguntas</b>, un minuto.</span></li>
      <li>${ic('lock')} <span><b>Es anónimo:</b> no pide tu nombre ni tu DNI. <a href="privacidad.html" target="_blank" rel="noopener" style="color:var(--amber)">Aviso de privacidad</a></span></li>
      <li>${ic('repeat')} <span><b>Es un repaso.</b> Después de cada respuesta vas a ver la correcta y por qué.</span></li>
    </ul>
    <div class="actions"><button class="btn primary lg" id="rGo">${ic('play')} COMENZAR</button></div>
  </div>`);
  $('#rGo').onclick = () => { R.i = 0; R.resp = {}; R.ok = 0; question(); };
}
function question(){
  const k = KS[R.i], q = preg(k), orden = R.orden[k] || (R.orden[k] = mezclar(q.o.length));
  progress(10 + Math.round(R.i / KS.length * 80));
  show(`<div class="qcard">
    <div class="qhead"><span class="score-pill">Pregunta ${R.i + 1} de ${KS.length}</span>
      <div class="qprog" aria-hidden="true">${KS.map((_, n) => `<i class="${n < R.i ? 'done' : n === R.i ? 'cur' : ''}"></i>`).join('')}</div></div>
    <h2 class="qtext">${q.q}</h2>
    <div class="options" role="group" aria-label="Opciones">${orden.map((a, n) => `<button class="opt" data-a="${a}"><span class="opt-l">${'ABCD'[n]}</span>${q.o[a]}</button>`).join('')}</div>
    <div id="rFb"></div></div>`);
  $$('.opt', view).forEach(b => b.onclick = () => {
    const a = +b.dataset.a, bien = a === q.c;
    R.resp[k] = a; if(bien) R.ok++;
    $$('.opt', view).forEach(x => { x.disabled = true; const xa = +x.dataset.a;
      if(xa === q.c) x.classList.add('right'); else if(x === b) x.classList.add('wrong'); else x.classList.add('faded'); });
    const ult = R.i === KS.length - 1;
    $('#rFb').innerHTML = `<div class="fb ${bien ? 'fb-ok' : 'fb-bad'}">${ic(bien ? 'check' : 'x')}<div><strong>${bien ? '¡Correcto!' : 'No es correcta.'}</strong><p>${q.e}</p></div></div>
      <div class="actions"><button class="btn primary" id="rNext">${ult ? ic('check') + ' Terminar' : 'Siguiente ' + ic('arrow')}</button></div>`;
    $('#rNext').onclick = () => { if(++R.i < KS.length) question(); else send(); };
    $('#rNext').focus();
  });
}
async function send(){
  progress(95);
  show(card('clock', 'Enviando…', 'Un segundo.'));
  try{
    await Central.rpc('rs_registrar_refuerzo', { p:{ id:uuid(), jornada:R.j, respuestas:R.resp } });
    try{ localStorage.setItem(doneKey(), JSON.stringify({ at:new Date().toISOString(), ok:R.ok })); }catch(e){}
    done(R.ok);
  }catch(e){
    const noDisp = e && (e.code === 'PGRST202' || /Could not find the function|schema cache/i.test(e.message || ''));
    if(noDisp) return done(R.ok, true);
    show(card('alert', 'No se pudo enviar', esc(Central.isNetworkError(e) ? 'Sin conexión a internet. Revisá la señal y volvé a intentar.' : e.message),
      `<div class="actions" style="justify-content:center"><button class="btn primary" id="rRetry">${ic('refresh')} Reintentar</button></div>`));
    $('#rRetry').onclick = send;
  }
}
function done(ok, sinRegistro){
  progress(100);
  const todo = ok === KS.length;
  show(card(todo ? 'award' : 'check', `${ok} de ${KS.length} correctas`,
    todo ? '¡Excelente! Lo que aprendiste sigue firme.' : 'Gracias por repasar. Releé las explicaciones: son las ideas que más importan en la ruta.',
    `<div class="callout green" style="margin-top:18px;text-align:left">${ic('shield')} <span>Ante señales de fatiga, detenete en un lugar seguro. Detenerse a tiempo también es seguridad.</span></div>
     ${sinRegistro ? '<p class="sm dim" style="margin-top:12px">El registro de respuestas todavía no está habilitado; el repaso igual sirvió.</p>' : ''}`));
}

(async function init(){
  initBrand();
  if(!R.j) return show(card('alert', 'Falta el código de jornada', 'Abrí el enlace completo que te enviaron.'));
  if(!Central.enabled()) return show(card('info', 'Refuerzo no disponible', 'El refuerzo necesita el registro central configurado.'));
  let prev = null; try{ prev = JSON.parse(localStorage.getItem(doneKey()) || 'null'); }catch(e){}
  show(card('clock', 'Cargando…', ''));
  try{
    R.jornada = await Central.jornadaPublica(R.j);
    if(!R.jornada) return show(card('alert', 'Enlace no válido', 'El código de jornada no existe.'));
  }catch(e){ return show(card('alert', 'Sin conexión', 'Revisá la señal y volvé a abrir el enlace.')); }
  const dias = Math.floor((Date.now() - new Date(R.jornada.fecha + 'T12:00:00')) / 864e5);
  if(dias > 180) return show(card('lock', 'Refuerzo cerrado', 'Este refuerzo ya no recibe respuestas.'));
  if(prev) return show(card('check', 'Ya hiciste este refuerzo', `Resultado: ${prev.ok != null ? prev.ok + ' de ' + KS.length : 'registrado'}. ¡Gracias!`));
  intro();
})();
