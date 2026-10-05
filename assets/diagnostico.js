'use strict';
/* diagnostico.js — DIAGNÓSTICO INICIAL ANÓNIMO (antes de la capacitación)
   5 preguntas de la evaluación final (CONFIG.reportes.diagnostico). No pide nombre ni legajo
   y no muestra las respuestas correctas: se comparan al final con la evaluación, a nivel de grupo.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
const KS = ((CONFIG.reportes && CONFIG.reportes.diagnostico) || [1, 2, 4, 8, 9]).filter(k => CONTENT.quiz[k]);
const D = { j:jornadaParam(), jornada:null, i:0, resp:{} };
const doneKey = () => 'rs-diag-' + D.j;
function show(html){ view.innerHTML = html; window.scrollTo(0, 0); const h = $('h1,h2', view); if(h){ h.setAttribute('tabindex', '-1'); h.focus({ preventScroll:true }); } }
function progress(p){ $('#progressFill').style.width = p + '%'; }
function uuid(){ return (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = crypto.getRandomValues(new Uint8Array(1))[0] % 16; return (c === 'x' ? r : (r & 3 | 8)).toString(16); })); }
function card(icon, title, body, extra){ return `<div class="gate-card welcome">${ic(icon, 'xl')}<h1 style="font-size:1.5rem">${title}</h1><p class="muted">${body}</p>${extra || ''}</div>`; }

function intro(){
  progress(4);
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Antes de empezar</p><h1>DIAGNÓSTICO INICIAL</h1>
      <p class="muted">${esc(CONFIG.capacitacion.nombre)}${D.jornada ? `<br>${esc(D.jornada.empresa)} · ${fmtDate(D.jornada.fecha + 'T12:00:00')}` : ''}</p></div></div>
    <ul class="diag-points">
      <li>${ic('clock')} <span><b>${KS.length} preguntas</b>, menos de 2 minutos.</span></li>
      <li>${ic('lock')} <span><b>Es anónimo:</b> no pide tu nombre ni tu legajo. <a href="privacidad.html" target="_blank" rel="noopener" style="color:var(--amber)">Aviso de privacidad</a></span></li>
      <li>${ic('info')} <span><b>No es un examen.</b> Respondé lo que sabés hoy: sirve para medir cuánto aprende el grupo con la capacitación.</span></li>
    </ul>
    <div class="actions"><button class="btn primary lg" id="dGo">${ic('play')} COMENZAR</button></div>
  </div>`);
  $('#dGo').onclick = () => { D.i = 0; D.resp = {}; question(); };
}
function question(){
  const k = KS[D.i], q = CONTENT.quiz[k];
  progress(10 + Math.round(D.i / KS.length * 80));
  show(`<div class="qcard">
    <div class="qhead"><span class="score-pill">Pregunta ${D.i + 1} de ${KS.length}</span>
      <div class="qprog" aria-hidden="true">${KS.map((_, n) => `<i class="${n < D.i ? 'done' : n === D.i ? 'cur' : ''}"></i>`).join('')}</div></div>
    <h2 class="qtext">${q.q}</h2>
    <div class="options" role="group" aria-label="Opciones">${q.o.map((o, n) => `<button class="opt" data-n="${n}"><span class="opt-l">${'ABCD'[n]}</span>${o}</button>`).join('')}</div>
    <p class="sm dim" style="margin-top:12px">Las respuestas correctas las vas a ver durante la capacitación.</p></div>`);
  $$('.opt', view).forEach(b => b.onclick = () => {
    D.resp[k] = +b.dataset.n;
    $$('.opt', view).forEach(x => { x.disabled = true; x.classList.toggle('faded', x !== b); });
    b.classList.add('picked');
    setTimeout(() => { if(++D.i < KS.length) question(); else send(); }, 280);
  });
}
async function send(){
  progress(95);
  show(card('clock', 'Enviando…', 'Un segundo.'));
  try{
    await Central.rpc('rs_registrar_diagnostico', { p:{ id:uuid(), jornada:D.j, respuestas:D.resp } });
    try{ localStorage.setItem(doneKey(), new Date().toISOString()); }catch(e){}
    done();
  }catch(e){
    const noDisp = e && (e.code === 'PGRST202' || /Could not find the function|schema cache/i.test(e.message || ''));
    show(card('alert', noDisp ? 'Diagnóstico no disponible' : 'No se pudo enviar',
      noDisp ? 'El diagnóstico todavía no está habilitado en el sistema. Podés seguir con la capacitación normalmente.'
             : esc(Central.isNetworkError(e) ? 'Sin conexión a internet. Revisá la señal y volvé a intentar.' : e.message),
      noDisp ? '' : `<div class="actions" style="justify-content:center"><button class="btn primary" id="dRetry">${ic('refresh')} Reintentar</button></div>`));
    if($('#dRetry')) $('#dRetry').onclick = send;
  }
}
function done(){
  progress(100);
  show(card('check', '¡Listo, gracias!', 'Ahora prestá atención a la capacitación. Al final vas a hacer la evaluación y vas a ver cuánto aprendiste.',
    `<div class="callout green" style="margin-top:18px;text-align:left">${ic('shield')} <span>Detenerse a tiempo también es seguridad.</span></div>`));
}

(async function init(){
  initBrand();
  if(!D.j) return show(card('alert', 'Falta el código de jornada', 'Escaneá el código QR que muestra el capacitador.'));
  if(!Central.enabled()) return show(card('info', 'Diagnóstico no disponible', 'El diagnóstico necesita el registro central configurado.'));
  let prev = null; try{ prev = localStorage.getItem(doneKey()); }catch(e){}
  show(card('clock', 'Cargando…', ''));
  try{
    D.jornada = await Central.jornadaPublica(D.j);
    if(!D.jornada) return show(card('alert', 'Jornada no encontrada', 'El código no existe. Consultá al capacitador.'));
    if(!D.jornada.abierta) return show(card('lock', 'Jornada cerrada', 'Esta jornada ya no recibe respuestas.'));
  }catch(e){ return show(card('alert', 'Sin conexión', 'Revisá la señal y volvé a abrir el enlace.')); }
  if(prev) return show(card('check', 'Ya respondiste el diagnóstico', 'Gracias. Ahora seguí con la capacitación.'));
  intro();
})();
