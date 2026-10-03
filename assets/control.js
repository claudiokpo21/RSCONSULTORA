'use strict';
/* control.js — CONTROL REMOTO DEL CAPACITADOR (celular)
   Se abre escaneando el QR del botón "Control remoto" en la presentación o en el desafío.
   El enlace trae un código secreto (#k=…) que no viaja al servidor web.
   Ver protocolo en assets/remote.js.
   RS Consultora · Fatiga y Conducción Segura */

const RC = {
  token: '', rid: '', bus: null, st: null, stAt: 0, key: '', busy: false, conn: 'wait',
  lastState: 0, helloTimer: null, cdTimer: null, lock: null, sheet: null
};
const COLORS = ['#f5b301', '#6b95e8', '#2bb3a6', '#a98bf0'];
const TIPO = { quiz:'Pregunta', vf:'Mito o realidad', encuesta:'Encuesta anónima' };
const view = $('#view'), dock = $('#dock');

/* ---------- Identidad y enlace ---------- */
function readToken(){
  const m = /[#&]k=([a-f0-9]{48})/.exec(location.hash);
  if(m){ try{ sessionStorage.setItem('rs-ctrl-token', m[1]); }catch(e){} history.replaceState(null, '', location.pathname); return m[1]; }
  try{ return sessionStorage.getItem('rs-ctrl-token') || ''; }catch(e){ return ''; }
}
function readRid(){
  let r = '';
  try{ r = localStorage.getItem('rs-ctrl-rid') || ''; }catch(e){}
  if(!/^[a-f0-9]{48}$/.test(r)){ r = randomToken(); try{ localStorage.setItem('rs-ctrl-rid', r); }catch(e){} }
  return r;
}

/* ---------- Conexión ---------- */
function send(m){ RC.bus && RC.bus.send({ ...m, rid:RC.rid }); }
function cmd(a, extra){
  if(!RC.st || RC.busy) return;
  send({ t:'cmd', a, ...(extra || {}) });
  try{ navigator.vibrate && navigator.vibrate(18); }catch(e){}
  $$('button', dock).forEach(b => { b.dataset.was = b.disabled ? '1' : ''; b.disabled = true; });
  setTimeout(() => $$('button', dock).forEach(b => { if(!b.dataset.was) b.disabled = false; }), 450);
}
function onMsg(m){
  if(m.t === 'busy' && m.rid === RC.rid){ RC.busy = true; RC.st = null; render(); return; }
  if(m.t !== 'state') return;
  if(m.owner !== RC.rid){ if(m.owner){ RC.busy = true; RC.st = null; render(); } return; }
  RC.busy = false; RC.lastState = Date.now();
  const endsIn = m.endsIn; delete m.endsIn; delete m.t; delete m.owner;
  if(endsIn !== undefined){ RC.deadline = Date.now() + endsIn; }
  const k = JSON.stringify(m);
  if(k !== RC.key){ RC.key = k; RC.st = m; render(); } else pill();
}
function connect(){
  RC.bus = openBus('rs-ctrl-' + RC.token, onMsg, s => { RC.conn = s; pill(); if(s === 'ok') setTimeout(() => send({ t:'hello' }), 0); });
  clearInterval(RC.helloTimer);
  RC.helloTimer = setInterval(() => { send({ t:'hello' }); pill(); }, 3000);
}
function alive(){ return RC.st && Date.now() - RC.lastState < 10000; }
function pill(){
  const p = $('#pill'); if(!p) return;
  let cls = '', txt = 'Conectando…';
  if(!RC.token) txt = 'Sin vincular';
  else if(RC.busy){ cls = 'bad'; txt = 'Otro celular controla'; }
  else if(RC.conn === 'error'){ cls = 'bad'; txt = 'Sin conexión'; }
  else if(alive()){ cls = 'ok'; txt = RC.st.page === 'vivo' ? 'Desafío en vivo' : 'Presentación'; }
  else if(RC.st){ txt = 'Buscando la pantalla…'; }
  p.className = 'rc-pill ' + cls; p.lastElementChild.textContent = txt;
}

/* ---------- Pantallas ---------- */
function render(){
  pill(); closeSheet(); clearInterval(RC.cdTimer);
  if(!RC.token) return empty();
  if(RC.busy) return busy();
  if(!RC.st) return waiting();
  RC.st.page === 'vivo' ? vivo(RC.st) : pres(RC.st);
  wakeLock();
}
function setDock(html){ dock.innerHTML = html; }
function empty(){
  view.innerHTML = `<div class="rc-card rc-empty">${ic('steering')}<h1>Control remoto del capacitador</h1>
    <p class="muted">Manejá la presentación y el desafío en vivo desde tu celular.</p>
    <ol><li>En la computadora, abrí la <b>Presentación</b> o el <b>Desafío en vivo</b>.</li>
    <li>Tocá el ícono del celular, arriba a la derecha.</li><li>Escaneá el código QR con este celular.</li></ol></div>`;
  setDock('');
}
function waiting(){
  view.innerHTML = `<div class="rc-card rc-empty">${ic('clock')}<h1>Buscando la pantalla…</h1>
    <p class="muted">Dejá abierta la presentación o el desafío en la computadora. Si la cerraste, volvé a abrirla y escaneá el código otra vez.</p></div>`;
  setDock(unlinkBtn());
  wireDock();
}
function busy(){
  view.innerHTML = `<div class="rc-card rc-empty">${ic('lock')}<h1>Otro celular tiene el control</h1>
    <p class="muted">Esta pantalla ya está vinculada a otro celular. Si sos el capacitador, en la computadora tocá el ícono del celular, elegí <b>Desvincular y generar un QR nuevo</b> y escaneá el código nuevo.</p></div>`;
  setDock('');
}
function unlinkBtn(){ return `<button class="btn ghost rc-small" data-a="unlink">${ic('x')} Desvincular este celular</button>`; }

function pres(s){
  const pct = Math.round((s.i + 1) / s.n * 100), last = s.i >= s.n - 1;
  view.innerHTML = `<div class="rc-card">
      <div class="rc-meta"><span>Pantalla <b>${s.i + 1}</b> de ${s.n}</span><span>${pct}%</span></div>
      <div class="rc-bar"><i style="width:${pct}%"></i></div>
      <p class="rc-eyebrow" style="margin-top:14px">${esc(s.mod)}</p>
      <h1 class="rc-title">${esc(s.title || s.mod)}</h1>
      ${s.lead ? `<p class="rc-lead">${esc(s.lead)}</p>` : ''}
    </div>
    ${s.nextMod ? `<div class="rc-card rc-next">${ic('chev')} <span>A continuación: <b>${esc(s.nextMod)}</b></span></div>` : ''}
    ${s.blank ? fb('warn', 'Pantalla en pausa', 'Los participantes ven el logo de RS Consultora. Tocá “Pausa” otra vez para volver.') : ''}
    <div class="rc-row">
      <button class="btn ghost rc-small ${s.blank ? 'on' : ''}" data-a="blank">${ic('pause')} Pausa</button>
      <button class="btn ghost rc-small" data-a="list">${ic('clipboard')} Pantallas</button>
      <button class="btn ghost rc-small" data-a="tovivo">${ic('zap')} Desafío</button>
    </div>`;
  setDock(`<div class="rc-row">
      <button class="btn ghost rc-big back" data-a="prev" ${s.i === 0 ? 'disabled' : ''}>${ic('arrowl')} Atrás</button>
      <button class="btn primary rc-big" data-a="next" ${last ? 'disabled' : ''}>${last ? 'Última pantalla' : 'Siguiente'} ${last ? '' : ic('arrow')}</button>
    </div>`);
  wireAll();
}

function vivo(s){
  const P = s.primary || { label:'', disabled:true };
  let body = '', small = [];
  small.push(`<button class="btn ghost rc-small ${s.blank ? 'on' : ''}" data-a="blank">${ic('pause')} Pausa</button>`);
  if(s.phase === 'lobby'){
    body = `<div class="rc-card"><p class="rc-eyebrow">Sala de espera · Sala ${esc(s.code)}</p>
      <h1 class="rc-title">${s.count} ${s.count === 1 ? 'participante conectado' : 'participantes conectados'}</h1>
      <div class="rc-teams">${s.teams.map(t => `<div><small>${esc(t.label)}</small><b>${t.n}</b></div>`).join('')}</div>
      <p class="rc-lead">Cuando estén todos, tocá <b>Comenzar desafío</b>. ${s.total} preguntas.</p></div>`;
    small.push(`<button class="btn ghost rc-small" data-a="bots">${ic('users')} Simulados</button>`);
  } else if(s.phase === 'question' || s.phase === 'reveal' || s.phase === 'board'){
    const poll = s.correcta === null || s.correcta === undefined;
    const head = `<div class="rc-meta"><span>Pregunta <b>${s.q + 1}</b> de ${s.total}</span><span>${esc(TIPO[s.tipo] || 'Pregunta')}</span></div>`;
    if(s.phase === 'question'){
      const pctA = s.count ? Math.round(s.answered / s.count * 100) : 0;
      body = `<div class="rc-card">${head}
        <div class="rc-meta" style="margin-top:12px"><span class="rc-count" id="cnt">${Math.ceil(Math.max(0, (RC.deadline || 0) - Date.now()) / 1000)}</span>
        <span style="text-align:right"><b style="font-size:1.4rem">${s.answered}</b> / ${s.count}<br>respondieron</span></div>
        <div class="rc-bar"><i style="width:${pctA}%"></i></div>
        <h1 class="rc-title" style="margin-top:14px">${esc(s.pregunta)}</h1>
        <div class="rc-opts">${s.opciones.map((o, k) => `<div class="rc-opt ${!poll && k === s.correcta ? 'ok' : ''}"><i class="sw" style="background:${COLORS[k]}"></i>${esc(o)}</div>`).join('')}</div>
        ${poll ? '' : `<p class="rc-private">${ic('lock')} La respuesta correcta solo se ve en tu celular.</p>`}</div>`;
      RC.cdTimer = setInterval(() => { const el = $('#cnt'); if(!el) return; const left = Math.max(0, RC.deadline - Date.now()); el.textContent = Math.ceil(left / 1000); el.classList.toggle('low', left < 5000); }, 250);
    } else if(s.phase === 'reveal'){
      body = `<div class="rc-card">${head}
        <h1 class="rc-title" style="margin-top:12px">${poll ? 'Resultado de la encuesta' : (s.pct === null ? 'Nadie respondió' : `${s.pct}% acertó`)}</h1>
        <p class="rc-lead">${s.answered} de ${s.count} respondieron.</p>
        ${poll ? '' : `<div class="rc-opts"><div class="rc-opt ok"><i class="sw" style="background:${COLORS[s.correcta]}"></i>${esc(s.opciones[s.correcta])}</div></div>`}
        <p class="rc-eyebrow" style="margin-top:16px">Para comentar con el grupo</p><p class="rc-lead" style="color:var(--text)">${esc(s.explicacion)}</p></div>`;
    } else {
      body = `<div class="rc-card">${head}<h1 class="rc-title" style="margin-top:12px">Posiciones</h1>${top3(s.top)}
        <div class="rc-teams">${s.teams.map(t => `<div><small>${esc(t.label)} · promedio</small><b>${t.avg}</b></div>`).join('')}</div></div>`;
    }
  } else if(s.phase === 'summary'){
    body = `<div class="rc-card"><p class="rc-eyebrow">Resumen del grupo (anónimo)</p>
      <h1 class="rc-title">${s.groupPct}% de aciertos del grupo</h1>
      <p class="rc-lead">La pantalla muestra la respuesta más elegida en cada pregunta. Tocá <b>Ver ganadores</b> para mostrar el top 3.</p>
      <ol class="rc-top3">${(s.items || []).map(it => `<li><span>${it.n} · ${esc(it.top || 'Sin respuestas')}${it.tot ? ` <small class="muted">${it.topP}%</small>` : ''}</span>
        <b style="color:${it.poll || !it.tot ? 'var(--muted)' : it.majorityOk ? '#5fd699' : '#ff8a8d'}">${it.poll ? 'Encuesta' : !it.tot ? '—' : it.majorityOk ? '✓ ' + it.pct + '%' : '⚠ ' + it.pct + '%'}</b></li>`).join('')}</ol></div>`;
  } else if(s.phase === 'final'){
    body = `<div class="rc-card"><p class="rc-eyebrow">Resultado final</p><h1 class="rc-title">¡Desafío terminado!</h1>${top3(s.top)}
      <p class="rc-lead">Mostrá el QR de la evaluación para que cada trabajador rinda su evaluación individual.</p></div>`;
    small.push(`<button class="btn ghost rc-small" data-a="restart">${ic('refresh')} Nueva sala</button>`);
  }
  if(s.canLeave) small.push(`<button class="btn ghost rc-small" data-a="topres">${ic('arrowl')} Presentación</button>`);
  if(s.conn === 'error') body = fb('bad', 'La pantalla perdió la conexión', 'Revisá el internet de la computadora; los celulares de los participantes no reciben las preguntas.') + body;
  if(s.blank) body += fb('warn', 'Pantalla en pausa', 'Tocá “Pausa” otra vez para volver al desafío.');
  view.innerHTML = body + `<div class="rc-row">${small.join('')}</div>`;
  setDock(`<button class="btn primary rc-big" data-a="primary" ${P.disabled || !P.label ? 'disabled' : ''}>${esc(P.label || '—')} ${ic('arrow')}</button>`);
  wireAll();
}
function top3(list){ return list && list.length ? `<ol class="rc-top3">${list.map((p, i) => `<li><span>${i + 1}º · ${esc(p.name)}</span><b>${p.score}</b></li>`).join('')}</ol>` : ''; }

/* ---------- Acciones ---------- */
async function act(a){
  const s = RC.st;
  if(a === 'unlink'){ send({ t:'bye' }); try{ sessionStorage.removeItem('rs-ctrl-token'); }catch(e){} RC.bus && RC.bus.close(); RC.token = ''; RC.st = null; clearInterval(RC.helloTimer); render(); return; }
  if(!s) return;
  if(a === 'next' || a === 'prev') return cmd(a, { from:s.i });
  if(a === 'blank') return cmd('blank');
  if(a === 'list') return openList();
  if(a === 'tovivo'){ if(await confirmDialog('Ir al desafío en vivo', 'La computadora va a abrir la sala del desafío. Vas a poder volver a la presentación desde acá.', 'Ir al desafío', 'Cancelar')) cmd('open', { page:'vivo' }); return; }
  if(a === 'topres') return cmd('open', { page:'pres' });
  if(a === 'bots') return cmd('bots');
  if(a === 'restart'){ if(await confirmDialog('Nueva sala', 'Se borrarán los puntajes de este desafío en la pantalla. ¿Empezar una sala nueva?', 'Nueva sala', 'Cancelar')) cmd('restart'); return; }
  if(a === 'primary') return cmd('primary', { phase:s.phase });
}
function wireAll(){ $$('[data-a]', view).concat($$('[data-a]', dock)).forEach(b => b.onclick = () => act(b.dataset.a)); }
function wireDock(){ $$('[data-a]', dock).forEach(b => b.onclick = () => act(b.dataset.a)); }
function openList(){
  const s = RC.st;
  const el = document.createElement('div'); el.className = 'rc-sheet'; RC.sheet = el;
  el.innerHTML = `<div role="dialog" aria-label="Ir a una pantalla"><h2>Ir a una pantalla <button class="icon-btn" data-x aria-label="Cerrar">${ic('x')}</button></h2>
    <div class="rc-list">${s.list.map((m, k) => `<button data-i="${k}" class="${k === s.i ? 'cur' : ''}"><span>${k + 1}</span>${esc(m)}</button>`).join('')}</div></div>`;
  el.onclick = e => { if(e.target === el || e.target.closest('[data-x]')) closeSheet(); const b = e.target.closest('[data-i]'); if(b){ closeSheet(); cmd('goto', { i:+b.dataset.i }); } };
  document.body.appendChild(el);
  const cur = $('.cur', el); cur && cur.scrollIntoView({ block:'center' });
}
function closeSheet(){ if(RC.sheet){ RC.sheet.remove(); RC.sheet = null; } }

/* Mantiene la pantalla del celular encendida mientras se usa el control. */
async function wakeLock(){
  try{ if('wakeLock' in navigator && !RC.lock && document.visibilityState === 'visible'){ RC.lock = await navigator.wakeLock.request('screen'); RC.lock.addEventListener('release', () => RC.lock = null); } }catch(e){}
}
document.addEventListener('visibilitychange', () => { if(document.visibilityState === 'visible' && RC.token){ send({ t:'hello' }); wakeLock(); } });

(function init(){
  initBrand();
  RC.token = readToken(); RC.rid = readRid();
  render();
  if(RC.token) connect();
  setInterval(pill, 2000);
})();
