'use strict';
/* vivo-player.js — DESAFÍO EN VIVO · CELULAR DEL PARTICIPANTE
   Unirse a la sala → esperar → responder con botones de colores → ver aciertos y posición → resultado final.
   El nombre solo se muestra en la pantalla del capacitador durante el desafío; no se guarda en ningún servidor.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
const P = { code:'', pid:'', name:'', team:'', ch:null, joined:false, key:'', answered:{}, deadline:0, timer:null, joinRetry:null, joinTimeout:null, last:null };

function store(k, v){ try{ v === undefined ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function load(k){ try{ return JSON.parse(sessionStorage.getItem(k) || "null"); }catch(e){ return null; } }
function idKey(code){ return 'rs-vivo-jugador-' + code; }
function show(html){ view.innerHTML = `<div class="slide">${html}</div>`; window.scrollTo(0, 0); }
function setChip(){
  const c = $('#whoChip');
  if(P.joined){ c.hidden = false; c.innerHTML = `${ic((EQUIPOS.find(e => e.id === P.team) || EQUIPOS[0]).icon)} ${esc(P.name)}`; } else c.hidden = true;
}
function progress(p){ $('#progressFill').style.width = p + '%'; }

/* ---------- 1. Unirse ---------- */
function renderJoin(err, v){
  v = v || {}; P.joined = false; setChip(); progress(0);
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Desafío en vivo</p><h1>¡Sumate al desafío!</h1><p class="muted">Fatiga y conducción segura · ${esc(capacitador())}</p></div></div>
    <form id="joinForm" novalidate>
      <div class="form-grid">
        <div class="field ${err && err.code ? 'err' : ''}"><label for="f-code">CÓDIGO DE SALA</label><input id="f-code" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" value="${esc(v.code ?? P.code)}" placeholder="0000">${err && err.code ? `<p class="msg">${err.code}</p>` : ''}</div>
        <div class="field ${err && err.name ? 'err' : ''}"><label for="f-name">TU NOMBRE</label><input id="f-name" maxlength="20" autocomplete="given-name" value="${esc(v.name ?? P.name)}" placeholder="Ej.: Carla R.">${err && err.name ? `<p class="msg">${err.name}</p>` : '<p class="msg">Se verá en la pantalla durante el juego.</p>'}</div>
        <fieldset class="field full"><legend>ELEGÍ TU EQUIPO</legend>
          <div class="team-pick">${EQUIPOS.map(t => `<label class="team-opt"><input type="radio" name="team" value="${t.id}" ${(v.team ?? P.team) === t.id ? 'checked' : ''}>${ic(t.icon,'lg')}<span>${t.label}</span></label>`).join('')}</div>
          ${err && err.team ? `<p class="msg" style="color:#ff8a8d">${err.team}</p>` : ''}
        </fieldset>
      </div>
      ${err && err.general ? fb('bad', err.general, '') : ''}
      <div class="privacy">${ic('lock')}<span>Tu nombre solo se muestra en la pantalla del capacitador mientras dura el desafío. No se guarda en ningún servidor. El registro formal es la evaluación individual.</span></div>
      <div class="actions"><button type="submit" class="btn primary lg" style="width:100%">${ic('zap')} ENTRAR</button></div>
    </form>
  </div>`);
  $('#joinForm').onsubmit = e => {
    e.preventDefault();
    const code = $('#f-code').value.replace(/\D/g, ''), name = $('#f-name').value.replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim(),
          team = (view.querySelector('input[name=team]:checked') || {}).value || '';
    const er = {};
    if(!/^\d{4}$/.test(code)) er.code = 'Ingresá los 4 números que aparecen en la pantalla.';
    if(name.length < 2 || name.length > 20) er.name = 'Escribí tu nombre (entre 2 y 20 caracteres).';
    if(!team) er.team = 'Elegí un equipo.';
    if(Object.keys(er).length){ renderJoin(er, { code, name, team }); return; }
    const saved = load(idKey(code));
    P.code = code; P.name = name; P.team = team;
    P.pid = saved && saved.pid ? saved.pid : 'p-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    connect();
  };
  (P.code ? $('#f-name') : $('#f-code')).focus({ preventScroll:true });
}

/* ---------- 2. Conexión ---------- */
function connect(){
  if(P.ch) P.ch.close();
  P.ch = openChannel(P.code, onMsg, s => { if(s === 'error' && !P.joined) fail('No se pudo conectar con el servidor. Revisá tu conexión a internet.'); });
  show(`<div class="gate-card welcome"><div class="spinner" aria-hidden="true"></div><h1 style="font-size:1.5rem">Conectando a la sala ${esc(P.code)}…</h1><p class="muted">Esperá unos segundos.</p></div>`);
  const hello = () => P.ch.send({ t:'join', pid:P.pid, name:P.name, team:P.team });
  hello(); clearInterval(P.joinRetry); P.joinRetry = setInterval(hello, 2000);
  clearTimeout(P.joinTimeout);
  P.joinTimeout = setTimeout(() => { if(!P.joined) fail('No encontramos la sala. Verificá el código y que la pantalla del capacitador esté abierta.'); }, 12000);
}
function fail(msg){
  clearInterval(P.joinRetry); clearTimeout(P.joinTimeout);
  renderJoin({ general: msg }, { code:P.code, name:P.name, team:P.team });
}

/* ---------- 3. Mensajes del anfitrión ---------- */
function onMsg(m){
  if(m.t === 'welcome' && m.pid === P.pid){
    clearInterval(P.joinRetry); clearTimeout(P.joinTimeout);
    const first = !P.joined; P.joined = true; P.name = m.name; P.team = m.team;
    store(idKey(P.code), { pid:P.pid, name:P.name, team:P.team });
    setChip(); if(first){ vibrate(40); if(P.last) render(P.last, true); else renderWaiting(); }
    return;
  }
  if(m.t === 'reject' && m.pid === P.pid){ fail(m.reason || 'No fue posible ingresar a la sala.'); return; }
  if(m.t === 'state'){ P.last = m; if(P.joined) render(m); }
}
function render(s, force){
  if(s.phase === 'closed'){ store(idKey(P.code)); P.joined = false; P.key = ''; show(`<div class="gate-card welcome">${ic('flag','xl')}<h1 style="font-size:1.5rem">El capacitador cerró esta sala</h1><p class="muted">Si empieza una nueva, escaneá el nuevo código.</p><div class="actions" style="justify-content:center"><button class="btn primary" onclick="location.href='jugar.html'">Unirme a otra sala</button></div></div>`); return; }
  const key = s.phase + ':' + (s.q ?? '');
  if(s.phase === 'question'){ P.deadline = Date.now() + (s.remaining || 0); }
  if(key === P.key && !force) return;
  P.key = key;
  if(s.phase === 'lobby') renderWaiting(s);
  else if(s.phase === 'question') renderQuestion(s);
  else if(s.phase === 'reveal' || s.phase === 'board') renderResult(s);
  else if(s.phase === 'summary') renderSummary(s);
  else if(s.phase === 'final') renderFinal(s);
}
function renderSummary(s){
  progress(100);
  show(`<div class="gate-card welcome">
    ${ic('activity','xl')}
    <h1 style="font-size:1.5rem">¡Terminaron las preguntas!</h1>
    <div class="pulse-msg">${ic('eye')} Mirá la pantalla: el resumen del grupo y después, los ganadores</div>
    <p class="muted sm" style="margin-top:14px">El resumen es anónimo: muestra qué respondió el grupo, sin nombres.</p>
  </div>`);
}

/* ---------- 4. Pantallas ---------- */
function renderWaiting(s){
  progress(0);
  const t = EQUIPOS.find(e => e.id === P.team) || EQUIPOS[0];
  show(`<div class="gate-card welcome">
    ${ic('check','xl')}
    <h1>¡Estás dentro, ${esc(P.name)}!</h1>
    <p class="leg">${ic(t.icon)} ${t.label} · Sala ${esc(P.code)}</p>
    <div class="pulse-msg">${ic('eye')} Mirá la pantalla: el desafío comienza en breve</div>
    <p class="muted sm" style="margin-top:14px">Respondé rápido: los aciertos más veloces suman más puntos.</p>
  </div>`);
}
function renderQuestion(s){
  const it = s.item, q = s.q; progress(Math.round(q / s.total * 100));
  if(P.answered[q] !== undefined){ renderSent(s); return; }
  show(`<div class="pq">
    <div class="qhead"><span class="score-pill">${q+1} de ${s.total}</span><span class="tag ${it.tipo === 'encuesta' ? '' : 'warn'}">${tipoLabel(it.tipo)}</span></div>
    <div class="ptimer"><i id="ptBar"></i></div>
    <p class="pq-text">${esc(it.q)}</p>
    <div class="pbtns n${it.o.length}">${it.o.map((o,k) => `<button class="pbtn" data-k="${k}" style="--c:${OPC[k].col};--ink:${OPC[k].ink}">${shapeSVG(k)}<span>${esc(o)}</span></button>`).join('')}</div>
  </div>`);
  $$('.pbtn', view).forEach(b => b.onclick = () => answer(s, +b.dataset.k));
  clearInterval(P.timer);
  const tot = s.duration || 20000;
  P.timer = setInterval(() => {
    const left = Math.max(0, P.deadline - Date.now()), bar = $('#ptBar');
    if(bar) bar.style.width = (left / tot * 100) + '%';
    if(left <= 0){ clearInterval(P.timer); $$('.pbtn', view).forEach(b => b.disabled = true); if(bar) bar.parentElement.insertAdjacentHTML('afterend', `<p class="muted" style="text-align:center">${ic('clock')} Se terminó el tiempo</p>`); }
  }, 150);
}
function answer(s, k){
  if(P.answered[s.q] !== undefined || Date.now() > P.deadline + 500) return;
  P.answered[s.q] = k; vibrate(30);
  P.ch.send({ t:'answer', pid:P.pid, q:s.q, choice:k });
  clearInterval(P.timer); renderSent(s);
}
function renderSent(s){
  const k = P.answered[s.q], opts = s.item.o;
  show(`<div class="gate-card welcome">
    <div class="sent-chip" style="--c:${OPC[k].col};--ink:${OPC[k].ink}">${shapeSVG(k)} ${esc(opts[k])}</div>
    <h1 style="font-size:1.6rem;margin-top:18px">¡Respuesta enviada!</h1>
    <p class="muted">Esperá el resultado en la pantalla.</p>
  </div>`);
}
function renderResult(s){
  clearInterval(P.timer); progress(Math.round((s.q + 1) / s.total * 100));
  const r = (s.results || {})[P.pid] || {}, it = s.item, poll = it.tipo === 'encuesta', mine = P.answered[s.q];
  let cls, title, body;
  if(poll){ cls = 'info'; title = mine !== undefined ? '¡Gracias por responder!' : 'Encuesta anónima'; body = 'Mirá en la pantalla qué respondió el grupo.'; }
  else if(!r.answered){ cls = 'warn'; title = 'Sin respuesta'; body = `La respuesta correcta era: <b>${esc(it.o[s.correct])}</b>`; }
  else if(r.ok){ cls = 'ok'; title = '¡Correcto!'; body = `<span class="pts">+${r.pts}</span> puntos`; vibrate([30,60,30]); }
  else { cls = 'bad'; title = 'Incorrecto'; body = `La respuesta correcta era: <b>${esc(it.o[s.correct])}</b>`; }
  show(`<div class="presult ${cls}">
    ${ic(cls === 'ok' ? 'check' : cls === 'bad' ? 'x' : cls === 'warn' ? 'clock' : 'users', 'xl')}
    <h1>${title}</h1><p>${body}</p>
  </div>
  ${r.rank ? `<div class="pstats"><div class="stat"><b>${r.score ?? 0}</b>Puntos</div><div class="stat"><b>${ordinal(r.rank)}</b>Posición de ${r.of}</div></div>` : ''}
  <p class="muted sm" style="text-align:center;margin-top:16px">${ic('eye')} Mirá la pantalla para la próxima pregunta</p>`);
}
function renderFinal(s){
  clearInterval(P.timer); progress(100);
  const r = (s.results || {})[P.pid] || {}, team = (s.teams || []).find(t => t.id === P.team), won = s.winner && s.winner === P.team;
  const medal = r.rank && r.rank <= 3 ? ['🥇','🥈','🥉'][r.rank - 1] : '';
  show(`<div class="gate-card welcome">
    ${medal ? `<div class="medal" aria-hidden="true">${medal}</div>` : ic('award','xl')}
    <h1>${r.rank ? `Terminaste en el puesto ${ordinal(r.rank)}` : '¡Desafío terminado!'}</h1>
    ${r.rank ? `<p class="leg">${r.score} puntos · ${r.correct} respuestas correctas · ${r.of} participantes</p>` : ''}
    ${team ? `<p style="margin-top:10px">${won ? `${ic('award')} <b style="color:#5fd699">¡Ganó tu equipo, ${esc(team.id)}!</b>` : s.winner ? `Ganó el equipo ${esc(s.winner)}. ¡Buen trabajo!` : 'Los equipos empataron.'}</p>` : ''}
    <div class="callout" style="text-align:left">${ic('stop')} <span>DETENERSE A TIEMPO TAMBIÉN ES SEGURIDAD.</span></div>
    <div class="signature">${instructorCard(CONFIG.consultora.nombre + ' · Capacitación dictada por')}</div>
    <div class="actions" style="justify-content:center"><a class="btn primary lg" href="${esc(s.evalUrl || 'evaluacion.html')}">${ic('clipboard')} RENDIR LA EVALUACIÓN</a></div>
  </div>`);
}

/* ---------- Inicio ---------- */
(function init(){
  initBrand();
  const code = (new URLSearchParams(location.search).get('sala') || '').replace(/\D/g, '').slice(0, 4);
  P.code = code;
  const saved = code && load(idKey(code));
  if(saved && saved.pid){ Object.assign(P, { pid:saved.pid, name:saved.name, team:saved.team }); connect(); }   // reconexión automática
  else renderJoin();
})();
