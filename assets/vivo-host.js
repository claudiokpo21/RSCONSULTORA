'use strict';
/* vivo-host.js — DESAFÍO EN VIVO · PANTALLA DEL CAPACITADOR (proyección)
   Sala → preguntas con temporizador → resultados → posiciones → podio final.
   El anfitrión es la "fuente de verdad": calcula puntajes y los transmite a los celulares.
   Los nombres solo viven en la memoria de esta pantalla mientras dura el desafío.
   RS Consultora · Fatiga y Conducción Segura */

const stageEl = $('#stage');
const ITEMS = VIVO_PREGUNTAS;
const DUR = Math.max(5, +VIVO.tiempoPregunta || 20);
const BOT_NAMES = ['Martín','Lucía','Diego','Sofía','Javier','Carla','Nicolás','Valeria','Ramiro','Paula','Gustavo','Micaela','Hernán','Florencia','Pablo','Daniela','Sergio','Romina'];

const H = {
  code: '', ch: null, phase: 'lobby', q: -1,
  players: new Map(),          // pid → { pid, name, team, score, correct, answered, last, bot }
  answers: new Map(),          // pid → { choice, ms }   (pregunta actual)
  qStart: 0, deadline: 0, tick: null, rebroadcast: null,
  results: {}, prevRank: {}, stats: [], botTimers: [], revealTimer: null
};

/* ---------- Utilidades ---------- */
function newCode(){ return String(Math.floor(1000 + Math.random() * 9000)); }
function cleanName(s){ return String(s || '').replace(/[<>"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }
function teamOk(t){ return EQUIPOS.some(e => e.id === t) ? t : EQUIPOS[0].id; }
function teamIcon(t){ return ic((EQUIPOS.find(e => e.id === t) || EQUIPOS[0]).icon); }
function ranked(){ return [...H.players.values()].sort((a,b) => b.score - a.score || a.name.localeCompare(b.name, 'es')); }
function rankMap(){ const m = {}; ranked().forEach((p,i) => m[p.pid] = i + 1); return m; }
function teams(){
  return EQUIPOS.map(e => {
    const ms = [...H.players.values()].filter(p => p.team === e.id);
    return { ...e, n: ms.length, avg: ms.length ? Math.round(ms.reduce((s,p) => s + p.score, 0) / ms.length) : 0 };
  });
}
function setProgress(){
  const p = H.phase === 'lobby' ? 0 : (H.phase === 'final' || H.phase === 'summary') ? 100 : Math.round(((H.q + (H.phase === 'question' ? 0 : 1)) / ITEMS.length) * 100);
  $('#progressFill').style.width = p + '%'; $('#progressBar').setAttribute('aria-valuenow', p);
}
function show(html, focusPrimary){
  stageEl.innerHTML = `<section class="slide">${html}</section>`;
  stageEl.scrollTop = 0; setProgress();
  const b = $('#primaryAction'); if(focusPrimary && b) b.focus({ preventScroll:true });
}
function downloadFile(name, content, type){
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Mensajes ---------- */
function send(m){ H.ch && H.ch.send(m); }
function publicItem(i){ const it = ITEMS[i]; return { tipo: it.tipo, q: it.q, o: itemOptions(it) }; }
function stateMsg(){
  const base = { t:'state', phase:H.phase, code:H.code, total:ITEMS.length, count:H.players.size };
  if(H.phase === 'question') return { ...base, q:H.q, item:publicItem(H.q), remaining:Math.max(0, H.deadline - Date.now()), duration:DUR * 1000 };
  if(H.phase === 'reveal' || H.phase === 'board') return { ...base, q:H.q, item:publicItem(H.q), correct: ITEMS[H.q].tipo === 'encuesta' ? null : ITEMS[H.q].c, results:H.results };
  if(H.phase === 'summary') return { ...base, groupPct: groupPct() };
  if(H.phase === 'final'){
    const t = teams(), w = winnerTeam(t);
    return { ...base, results:H.results, teams:t.map(x => ({ id:x.id, n:x.n, avg:x.avg })), winner: w ? w.id : null, evalUrl: evalUrl() };
  }
  return base;
}
function broadcastState(){ send(stateMsg()); }

function onMsg(m){
  if(m.t === 'join') handleJoin(m);
  else if(m.t === 'answer') handleAnswer(m);
}
function handleJoin(m){
  const pid = String(m.pid || '').slice(0, 40); if(!pid) return;
  const existing = H.players.get(pid);
  if(existing){ send({ t:'welcome', pid, name:existing.name, team:existing.team }); broadcastState(); return; }
  if(H.players.size >= VIVO.maxParticipantes){ send({ t:'reject', pid, reason:'La sala está completa.' }); return; }
  let name = cleanName(m.name);
  if(name.length < 2){ send({ t:'reject', pid, reason:'Nombre inválido.' }); return; }
  const taken = n => [...H.players.values()].some(p => p.name.toLowerCase() === n.toLowerCase());
  if(taken(name)){ let k = 2; while(taken(name + ' ' + k)) k++; name = name + ' ' + k; }
  const p = { pid, name, team:teamOk(m.team), score:0, correct:0, answered:0, last:null, bot:!!m.bot };
  H.players.set(pid, p);
  if(!m.bot) send({ t:'welcome', pid, name, team:p.team });
  if(H.phase === 'lobby') renderPlayers(p.pid); else updateAnswered();
  broadcastState();
}
function handleAnswer(m){
  if(H.phase !== 'question' || m.q !== H.q) return;
  const p = H.players.get(m.pid); if(!p || H.answers.has(p.pid)) return;
  const n = itemOptions(ITEMS[H.q]).length, choice = +m.choice;
  if(!Number.isInteger(choice) || choice < 0 || choice >= n) return;
  const now = Date.now(); if(now > H.deadline + 800) return;
  H.answers.set(p.pid, { choice, ms: Math.max(0, now - H.qStart) });
  updateAnswered();
  if(H.answers.size >= H.players.size && !H.revealTimer) H.revealTimer = setTimeout(reveal, 900);
}

/* ---------- Participantes simulados (demostración) ---------- */
function addBots(n){
  const free = BOT_NAMES.filter(b => ![...H.players.values()].some(p => p.name === b));
  for(let i = 0; i < n && i < free.length; i++){
    handleJoin({ t:'join', pid:'bot-' + Math.random().toString(36).slice(2, 9), name:free[i], team:EQUIPOS[Math.random() < .5 ? 0 : 1].id, bot:true });
  }
}
function scheduleBots(){
  const it = ITEMS[H.q], n = itemOptions(it).length;
  [...H.players.values()].filter(p => p.bot).forEach(p => {
    const delay = 1500 + Math.random() * DUR * 700;
    H.botTimers.push(setTimeout(() => {
      let choice;
      if(it.tipo === 'encuesta') choice = Math.floor(Math.random() * n);
      else choice = Math.random() < .72 ? it.c : (it.c + 1 + Math.floor(Math.random() * (n - 1))) % n;
      handleAnswer({ t:'answer', pid:p.pid, q:H.q, choice });
    }, delay));
  });
}
function clearBots(){ H.botTimers.forEach(clearTimeout); H.botTimers = []; }

/* ---------- 1. Sala de espera ---------- */
function renderLobby(){
  H.phase = 'lobby';
  const url = playUrl(H.code), local = location.protocol === 'file:';
  show(`<div class="lobby">
    <div class="lobby-qr">
      <div class="qr-box" role="img" aria-label="Código QR para unirse al desafío">${qrSVG(url)}</div>
      <p class="qr-url">${esc(url.replace(/^https?:\/\//, ''))}</p>
      <div class="room-code"><small>Código de sala</small><strong>${esc(H.code)}</strong></div>
    </div>
    <div>
      ${head('Desafío en vivo','¡Sumate desde tu celular!','Escaneá el código QR, escribí tu nombre, elegí tu equipo y mirá la pantalla. Respondé rápido: los aciertos más veloces suman más puntos.')}
      <div class="team-counts" id="teamCounts"></div>
      <div class="players" id="players" aria-live="polite"></div>
      ${local ? fb('warn','Vista local','Para que los celulares se conecten, el sitio tiene que estar publicado (por ejemplo, en Vercel).') : ''}
      ${modeBanner()}
      <div id="connMsg"></div>
      <div class="actions">
        <button class="btn primary lg" id="primaryAction" disabled>${ic('play')} COMENZAR DESAFÍO</button>
        <button class="btn ghost" id="addBots">${ic('users')} Sumar participantes simulados</button>
      </div>
      <p class="sm dim" style="margin-top:10px">${ITEMS.length} preguntas · ${DUR} segundos cada una · Tecla <b>F</b>: pantalla completa · <b>Espacio</b>: avanzar</p>
    </div>
  </div>`);
  $('#primaryAction').onclick = () => startQuestion(0);
  $('#addBots').onclick = () => addBots(8);
  renderPlayers(); paintConnMsg();
}
function renderPlayers(newPid){
  const box = $('#players'); if(!box) return;
  const ps = [...H.players.values()];
  box.innerHTML = ps.length
    ? ps.map(p => `<span class="pchip ${p.pid === newPid ? 'new' : ''}">${teamIcon(p.team)} ${esc(p.name)}</span>`).join('')
    : `<p class="muted waiting-dots">${ic('clock')} Esperando participantes</p>`;
  $('#teamCounts').innerHTML = teams().map(t => `<span class="tcount">${ic(t.icon)} ${t.label}: <b>${t.n}</b></span>`).join('') + `<span class="tcount total">${ic('users')} Total: <b>${ps.length}</b></span>`;
  $('#primaryAction').disabled = ps.length === 0;
}

/* ---------- 2. Pregunta ---------- */
function startQuestion(i){
  clearBots(); clearTimeout(H.revealTimer); H.revealTimer = null;
  H.phase = 'question'; H.q = i; H.answers.clear();
  H.qStart = Date.now(); H.deadline = H.qStart + DUR * 1000;
  const it = ITEMS[i], opts = itemOptions(it);
  show(`<div class="q-top">
      <span class="score-pill">Pregunta ${i+1} de ${ITEMS.length}</span>
      <span class="tag ${it.tipo === 'encuesta' ? '' : 'warn'}">${tipoLabel(it.tipo)}</span>
      <span class="answered">${ic('users')} <b id="ansCount">0</b> / <span id="ansTotal">${H.players.size}</span> respondieron</span>
      <div class="timer" id="timer" style="--p:100"><span id="secs">${DUR}</span></div>
    </div>
    <h1 class="live-q">${esc(it.q)}</h1>
    <div class="live-opts n${opts.length}">${opts.map((o,k) => `<div class="lopt" style="--c:${OPC[k].col};--ink:${OPC[k].ink}">${shapeSVG(k)}<span>${esc(o)}</span></div>`).join('')}</div>
    <div class="actions" style="justify-content:flex-end"><button class="btn ghost" id="primaryAction">${ic('eye')} Mostrar resultado</button></div>`);
  $('#primaryAction').onclick = reveal;
  broadcastState(); scheduleBots();
  clearInterval(H.tick);
  H.tick = setInterval(() => {
    const left = Math.max(0, H.deadline - Date.now());
    const t = $('#timer'); if(t){ t.style.setProperty('--p', (left / (DUR * 1000) * 100).toFixed(1)); t.classList.toggle('low', left < 5000); }
    const s = $('#secs'); if(s) s.textContent = Math.ceil(left / 1000);
    if(left <= 0) reveal();
  }, 200);
}
function updateAnswered(){
  const a = $('#ansCount'), t = $('#ansTotal');
  if(a) a.textContent = H.answers.size; if(t) t.textContent = H.players.size;
}

/* ---------- 3. Resultado de la pregunta ---------- */
function reveal(){
  if(H.phase !== 'question') return;
  clearInterval(H.tick); clearBots(); clearTimeout(H.revealTimer); H.revealTimer = null;
  const it = ITEMS[H.q], opts = itemOptions(it), poll = it.tipo === 'encuesta';
  H.prevRank = rankMap();
  const dist = opts.map(() => 0);
  H.players.forEach(p => {
    const a = H.answers.get(p.pid);
    if(a) dist[a.choice]++;
    let ok = null, pts = 0;
    if(!poll){
      ok = !!a && a.choice === it.c;
      if(ok) pts = VIVO.puntosBase + Math.round(VIVO.puntosVelocidad * (1 - Math.min(a.ms, DUR * 1000) / (DUR * 1000)));
    }
    p.score += pts; if(a) p.answered++; if(ok) p.correct++;
    p.last = { ok, pts, answered:!!a, choice: a ? a.choice : null };
  });
  const rk = rankMap(); H.results = {};
  H.players.forEach(p => H.results[p.pid] = { ok:p.last.ok, pts:p.last.pts, answered:p.last.answered, score:p.score, rank:rk[p.pid], of:H.players.size });
  const answered = H.answers.size, correctN = poll ? 0 : dist[it.c];
  H.stats[H.q] = { answered, dist, correctPct: poll || !answered ? null : Math.round(correctN / answered * 100) };
  H.phase = 'reveal';
  const max = Math.max(1, ...dist), last = H.q === ITEMS.length - 1;
  const next = poll ? (last ? 'Ver resumen del grupo' : 'Siguiente pregunta') : 'Ver posiciones';
  show(`<div class="q-top">
      <span class="score-pill">Pregunta ${H.q+1} de ${ITEMS.length}</span>
      <span class="tag">${tipoLabel(it.tipo)}</span>
      <span class="answered">${ic('users')} ${answered} de ${H.players.size} respondieron${H.stats[H.q].correctPct !== null ? ` · <b style="color:#5fd699">${H.stats[H.q].correctPct}% acertó</b>` : ''}</span>
    </div>
    <h2 class="live-q sm-q">${esc(it.q)}</h2>
    <div class="bars n${opts.length}">${opts.map((o,k) => {
      const good = !poll && k === it.c, dim = !poll && !good;
      return `<div class="bcol ${good ? 'good' : ''} ${dim ? 'dim' : ''}" style="--c:${OPC[k].col};--ink:${OPC[k].ink}">
        <div class="bwrap"><b class="bnum">${dist[k]}</b><i style="--h:${(dist[k] / max * 100).toFixed(1)}%"></i></div>
        <div class="blabel">${shapeSVG(k)}<span>${esc(o)}</span>${good ? ic('check') : ''}</div></div>`; }).join('')}
    </div>
    ${fb(poll ? 'info' : 'ok', poll ? 'Encuesta anónima' : `Respuesta correcta: ${esc(opts[it.c])}`, esc(it.e))}
    <div class="actions" style="justify-content:flex-end"><button class="btn primary lg" id="primaryAction">${next} ${ic('arrow')}</button></div>`, true);
  $('#primaryAction').onclick = poll ? next_ : showBoard;
  broadcastState();
}

/* ---------- 4. Posiciones ---------- */
function showBoard(){
  H.phase = 'board';
  const top = ranked().slice(0, 5), t = teams(), maxT = Math.max(1, ...t.map(x => x.avg)), last = H.q === ITEMS.length - 1;
  show(`${head(`Después de la pregunta ${H.q+1} de ${ITEMS.length}`,'Posiciones')}
    <div class="board-grid">
      <ol class="board">${top.map((p,i) => {
        const up = (H.prevRank[p.pid] || 99) > i + 1 && p.last && p.last.pts > 0;
        return `<li style="--d:${i}"><span class="rk">${i+1}</span><span class="nm">${teamIcon(p.team)} ${esc(p.name)}</span>${p.last && p.last.pts ? `<span class="delta">+${p.last.pts}${up ? ' ▲' : ''}</span>` : ''}<b class="sc">${p.score}</b></li>`; }).join('')}
      </ol>
      <div class="panel">
        <p class="eyebrow">Equipos · promedio de puntos</p>
        ${t.map(x => `<div class="tbar"><span>${ic(x.icon)} ${x.label} <small class="muted">(${x.n})</small></span><b>${x.avg}</b><div class="bar"><i style="width:${(x.avg / maxT * 100).toFixed(1)}%"></i></div></div>`).join('')}
        <p class="sm dim" style="margin-top:10px">Se compara el promedio para que los equipos con más integrantes no tengan ventaja.</p>
      </div>
    </div>
    <div class="actions" style="justify-content:flex-end"><button class="btn primary lg" id="primaryAction">${last ? 'Ver resumen del grupo' : 'Siguiente pregunta'} ${ic('arrow')}</button></div>`, true);
  $('#primaryAction').onclick = next_;
  broadcastState();
}
function next_(){ H.q + 1 < ITEMS.length ? startQuestion(H.q + 1) : showSummary(); }

/* ---------- 5. Resumen del grupo (anónimo) ---------- */
function groupPct(){ const sc = H.stats.filter(x => x && x.correctPct !== null); return sc.length ? Math.round(sc.reduce((a,x) => a + x.correctPct, 0) / sc.length) : 0; }
function summaryData(){
  return ITEMS.map((it, i) => {
    const opts = itemOptions(it), st = H.stats[i] || { answered:0, dist:opts.map(() => 0), correctPct:null };
    const poll = it.tipo === 'encuesta', tot = st.dist.reduce((a,b) => a + b, 0), max = Math.max(...st.dist);
    const tops = tot ? st.dist.map((v,k) => v === max ? k : -1).filter(k => k >= 0) : [];
    const top = tops.length ? tops[0] : -1, tie = tops.length > 1;
    return { i, it, opts, poll, tot, top, tops, tie, dist:st.dist, pct: st.correctPct,
      rows: opts.map((o,k) => ({ o, n:st.dist[k], p: tot ? Math.round(st.dist[k] / tot * 100) : 0, ok: !poll && k === it.c })) };
  });
}
function showSummary(){
  clearInterval(H.tick); clearBots();
  H.phase = 'summary';
  const D = summaryData(), scored = D.filter(d => !d.poll && d.pct !== null);
  const best = scored.length ? scored.reduce((a,b) => b.pct > a.pct ? b : a) : null;
  const worst = scored.length > 1 ? scored.reduce((a,b) => b.pct < a.pct ? b : a) : null;
  const card = d => {
    const wrong = !d.poll && d.tot && !d.tops.includes(d.it.c);
    const tip = d.rows.map(r => `${r.o}: ${r.p}%${r.ok ? ' (correcta)' : ''}`).join(' · ');
    let chip;
    if(!d.tot) chip = `<span class="sm-chip">${ic('info')} Sin respuestas</span>`;
    else if(d.poll) chip = `<span class="sm-chip">${ic('users')} Encuesta anónima</span>`;
    else if(wrong) chip = `<span class="sm-chip bad">${ic('alert')} Correcta: ${esc(d.opts[d.it.c])} · ${d.pct}%</span>`;
    else chip = `<span class="sm-chip ok">${ic('check')} ${d.tie ? `Acertó el ${d.pct}%` : 'La mayoría acertó'}</span>`;
    const top = d.top >= 0 ? d.rows[d.top] : null;
    return `<article class="sm-card ${wrong ? 'warn' : ''}" style="--d:${d.i}" title="${esc(tip)}">
      <p class="sm-q"><b>${d.i + 1}</b> ${esc(d.it.q)}</p>
      <div class="sm-ans">
        <small>${d.tie ? 'Empate · más elegidas' : 'Más elegida'}</small>
        <strong>${top ? d.tops.map(k => esc(d.opts[k])).join(' / ') : '—'}</strong>
        <div class="sm-line"><span class="sm-bar"><i style="--w:${top ? top.p : 0}%"></i></span><b>${top ? top.p : 0}%</b></div>
      </div>
      ${chip}</article>`;
  };
  show(`<div class="summary">
    <div class="sm-head">
      <div><p class="eyebrow">Desafío en vivo · Resumen del grupo</p><h1 class="s-title">¿Qué respondió el grupo?</h1>
      <p class="sm-sub">${ic('lock')} La respuesta más elegida en cada pregunta. Anónimo: no se muestran nombres.</p></div>
      <button class="btn primary lg" id="primaryAction">${ic('flag')} VER GANADORES ${ic('arrow')}</button>
    </div>
    <div class="sm-kpis">
      <div class="sm-kpi"><small>Participantes</small><strong>${H.players.size}</strong></div>
      <div class="sm-kpi"><small>Aciertos del grupo</small><strong>${groupPct()}%</strong></div>
      <div class="sm-kpi good"><small>${ic('check')} Lo que el grupo tiene claro</small><strong>${best ? best.pct + '%' : '—'}</strong><span>${best ? 'P' + (best.i + 1) + ' · ' + esc(best.it.q) : ''}</span></div>
      <div class="sm-kpi bad"><small>${ic('alert')} Para reforzar</small><strong>${worst ? worst.pct + '%' : '—'}</strong><span>${worst ? 'P' + (worst.i + 1) + ' · ' + esc(worst.it.q) : ''}</span></div>
    </div>
    <div class="sm-grid">${D.map(card).join('')}</div>
  </div>`, true);
  stageEl.firstElementChild.classList.add('wide');
  $('#primaryAction').onclick = finish;
  broadcastState();
}

/* ---------- 6. Podio final ---------- */
function winnerTeam(t){ const withP = t.filter(x => x.n > 0); if(withP.length < 2) return null; const s = [...withP].sort((a,b) => b.avg - a.avg); return s[0].avg === s[1].avg ? null : s[0]; }
function finish(){
  H.phase = 'final';
  const r = ranked(), t = teams(), w = winnerTeam(t), rk = rankMap();
  H.results = {}; H.players.forEach(p => H.results[p.pid] = { score:p.score, rank:rk[p.pid], of:H.players.size, correct:p.correct });
  const scored = H.stats.filter(s => s && s.correctPct !== null), grp = scored.length ? Math.round(scored.reduce((s,x) => s + x.correctPct, 0) / scored.length) : 0;
  const pod = [r[1], r[0], r[2]];
  show(`<div class="final">
    <p class="eyebrow" style="text-align:center">Desafío en vivo · Top 3</p>
    <h1 class="s-title" style="text-align:center">¡Felicitaciones a los ganadores!</h1>
    <div class="podium">${pod.map((p,i) => { const place = [2,1,3][i]; return p ? `<div class="pcol p${place}" style="--d:${[1,2,0][i]}"><div class="pname">${teamIcon(p.team)} ${esc(p.name)}</div><div class="pscore">${p.score} pts</div><div class="pblock"><span>${place}º</span></div></div>` : '<div class="pcol empty"></div>'; }).join('')}</div>
    <div class="grid g3" style="margin-top:22px">
      <div class="card"><p class="eyebrow">Equipo ganador</p><h3 class="h3" style="margin:0">${w ? `${ic(w.icon)} ${w.label}` : 'Empate'}</h3><p class="muted sm">${t.map(x => `${x.label}: ${x.avg} pts promedio`).join(' · ')}</p></div>
      <div class="card"><p class="eyebrow">Participantes</p><h3 class="h3" style="margin:0">${H.players.size}</h3><p class="muted sm">jugaron el desafío</p></div>
      <div class="card"><p class="eyebrow">Aciertos del grupo</p><h3 class="h3" style="margin:0">${grp}%</h3><p class="muted sm">promedio en las preguntas con respuesta correcta</p></div>
    </div>
    <div class="callout">${ic('stop')} <span>DETENERSE A TIEMPO TAMBIÉN ES SEGURIDAD.</span></div>
    <div class="final-bottom">
      ${instructorCard(CONFIG.consultora.nombre + ' · Capacitación dictada por')}
      <div class="actions" style="margin:0">
        <button class="btn primary lg" id="primaryAction">${ic('clipboard')} QR DE LA EVALUACIÓN</button>
        <button class="btn ghost" id="csv">${ic('download')} Resultados (CSV)</button>
        <button class="btn ghost" id="again">${ic('refresh')} Nueva sala</button>
      </div>
    </div>
    <div id="saveMsg"></div>
    <div id="evalQr"></div>
    <p class="disclaimer">${ic('info')} El desafío es una actividad de repaso grupal. El registro formal es la evaluación individual.</p>
  </div>`);
  $('#primaryAction').onclick = showEvalQr;
  $('#csv').onclick = exportCsv;
  saveDesafio(grp, t, w);
  $('#again').onclick = async () => { if(await confirmDialog('Nueva sala','Se borrarán los puntajes de este desafío. ¿Querés empezar una sala nueva?','Nueva sala','Cancelar')) restart(); };
  broadcastState();
}
/** Guarda el resumen del desafío en el informe de la jornada (requiere ?j= y sesión de administrador). */
async function saveDesafio(grp, t, w){
  const box = $('#saveMsg'), j = typeof jornadaParam === 'function' ? jornadaParam() : '';
  if(!box || !j || H.saved || liveMode() !== 'supabase') return;
  const s = await Central.session().catch(() => null);
  if(!s){ box.innerHTML = fb('info','Resumen no guardado',`Para sumar este desafío al informe de la jornada ${esc(j)}, iniciá sesión en Administración en este equipo antes de empezar.`); return; }
  const r = ranked();
  const datos = {
    fecha: new Date().toISOString(), sala: H.code, participantes: H.players.size, aciertosGrupo: grp,
    ganador: w ? w.label : null, equipos: t.map(x => ({ id:x.id, n:x.n, promedio:x.avg })),
    podio: r.slice(0, 3).map(p => ({ nombre:p.name, equipo:p.team, puntos:p.score })),
    preguntas: ITEMS.map((it, i) => ({ tipo:it.tipo, q:it.q, opciones:itemOptions(it), correcta: it.tipo === 'encuesta' ? null : it.c,
      dist: H.stats[i] ? H.stats[i].dist : null, respondieron: H.stats[i] ? H.stats[i].answered : 0, correctPct: H.stats[i] ? H.stats[i].correctPct : null }))
  };
  try{ await Central.rpc('rs_admin_guardar_desafio', { p_codigo:j, p_sala:H.code, p_datos:datos }); H.saved = true;
       box.innerHTML = fb('ok','Guardado en el informe',`El resumen del desafío quedó registrado en la jornada ${esc(j)}.`); }
  catch(e){ box.innerHTML = fb('warn','No se pudo guardar el resumen', esc(e.code === '42501' ? 'Tu usuario no tiene permisos de administrador.' : e.message)); }
}
function showEvalQr(){
  const box = $('#evalQr'), url = evalUrl();
  box.innerHTML = `<div class="panel qr-slide" style="margin-top:20px">
    <div style="text-align:center"><div class="qr-box" role="img" aria-label="Código QR de la evaluación">${qrSVG(url)}</div><p class="qr-url">${esc(url.replace(/^https?:\/\//, ''))}</p></div>
    <div>${head('Evaluación final','Ahora, tu evaluación individual','Escaneá el código para rendir la evaluación y obtener tu constancia.')}
    <ol class="steps"><li>Escaneá el código QR</li><li>Completá tu legajo, nombre y apellido</li><li>Respondé ${CONTENT.quiz.length} preguntas (aprobás con ${CONFIG.aprobacion.porcentajeMinimo}% o más)</li><li>Si aprobás, guardá tu constancia</li></ol></div></div>`;
  box.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block:'start' });
}
function exportCsv(){
  const cell = v => { let s = String(v ?? ''); if(/^[=+\-@]/.test(s)) s = "'" + s; return /[";\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const rows = ranked().map((p,i) => [i+1, p.name, p.team, p.score, p.correct, p.answered, p.bot ? 'Sí' : 'No']);
  const csv = '﻿' + [['Puesto','Nombre','Equipo','Puntaje','Correctas','Respondidas','Simulado'], ...rows].map(r => r.map(cell).join(';')).join('\r\n');
  downloadFile(`desafio_en_vivo_sala${H.code}_${isoLocal(new Date())}.csv`, csv, 'text/csv;charset=utf-8');
}

/* ---------- Ciclo de vida ---------- */
function setConn(s){
  const el = $('#connDot'); if(!el) return;
  el.className = 'conn ' + (s === 'ok' ? 'ok' : s === 'error' ? 'bad' : 'wait');
  H.conn = s; paintConnMsg();
  el.title = s === 'ok' ? (H.ch && H.ch.mode === 'supabase' ? 'Conectado en tiempo real' : 'Modo demostración') : s === 'error' ? 'Sin conexión con el servidor en tiempo real' : 'Conectando…';
}
function paintConnMsg(){
  const box = $('#connMsg'); if(!box) return;
  box.innerHTML = H.conn === 'error' ? fb('bad','Sin conexión en tiempo real','No se pudo conectar con Supabase. Verificá la conexión a internet de esta computadora; el sistema reintenta solo. Mientras tanto podés mostrar el desafío con participantes simulados.') : '';
}
function start(){
  H.code = newCode();
  $('#roomChip').textContent = 'Sala ' + H.code;
  H.ch = openChannel(H.code, onMsg, setConn);
  if(H.ch.mode === 'local') setConn('ok');
  clearInterval(H.rebroadcast);
  H.rebroadcast = setInterval(broadcastState, 3000);   // para quienes se conectan tarde o se reconectan
  renderLobby();
}
function restart(){
  clearInterval(H.tick); clearBots(); clearInterval(H.rebroadcast);
  send({ t:'state', phase:'closed', code:H.code });
  H.ch && H.ch.close();
  Object.assign(H, { phase:'lobby', q:-1, players:new Map(), answers:new Map(), results:{}, prevRank:{}, stats:[], saved:false });
  start();
}
document.addEventListener('keydown', e => {
  if(e.target.closest('input,select,textarea') || ($('#dlg') && $('#dlg').open)) return;
  if(e.key === 'f' || e.key === 'F'){ toggleFullscreen(); return; }
  if(e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight'){
    const b = $('#primaryAction');
    if(b && !b.disabled && document.activeElement !== b){ e.preventDefault(); b.click(); }
  }
});
window.addEventListener('beforeunload', e => { if(H.players.size && H.phase !== 'final'){ e.preventDefault(); e.returnValue = ''; } });
(function init(){ initBrand(); $('#btnFull').onclick = toggleFullscreen; start(); })();
