'use strict';
/* remote.js — CONTROL REMOTO DESDE EL CELULAR (lado de la pantalla proyectada)
   Se carga en capacitacion.html (presentación) y vivo.html (desafío en vivo).
   · El botón con el ícono de celular muestra un QR con un enlace secreto a control.html.
   · El primer celular que se conecta queda vinculado: los demás son rechazados
     (si alguien escanea el QR proyectado, no puede tomar el control).
   · La vinculación sigue viva al pasar de la presentación al desafío (misma pestaña).
   · "Desvincular" genera un enlace nuevo y corta al celular anterior.
   Protocolo (canal rs-ctrl-<token>):
     celular → pantalla: hello { rid } · cmd { rid, a, ... } · bye { rid }
     pantalla → celular: state { owner, page, ... } · busy { rid }
   RS Consultora · Fatiga y Conducción Segura */

const Remote = (() => {
  const KEY = 'rs-remote';
  const PAGE = /vivo/.test(location.pathname) ? 'vivo' : 'pres';
  let S = load(), bus = null, conn = 'wait', lastKey = '', lastSeen = 0, blank = false;

  function load(){
    try{ const s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if(s && /^[a-f0-9]{48}$/.test(s.token)) return s; }catch(e){}
    return fresh();
  }
  function fresh(){ const s = { token: randomToken(), owner: null }; save(s); return s; }
  function save(s){ try{ sessionStorage.setItem(KEY, JSON.stringify(s || S)); }catch(e){} }
  function controlUrl(){ return new URL('control.html#k=' + S.token, location.href).href; }
  function jq(){ const j = typeof jornadaParam === 'function' ? jornadaParam() : ''; return j ? '?j=' + j : ''; }
  function txt(sel, max){ const el = document.querySelector(sel); const t = el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; return max && t.length > max ? t.slice(0, max - 1) + '…' : t; }

  /* ---------- Estado que ve el celular ---------- */
  function presState(){
    const i = State.current;
    return { page:'pres', i, n:SLIDES.length, mod:SLIDES[i].mod, title:txt('#stage .s-title', 160), lead:txt('#stage .lead', 320),
      nextMod: SLIDES[i + 1] ? SLIDES[i + 1].mod : '', list: SLIDES.map(s => s.mod) };
  }
  function vivoState(){
    const it = H.q >= 0 ? ITEMS[H.q] : null, b = document.getElementById('primaryAction');
    const st = { page:'vivo', phase:H.phase, code:H.code, total:ITEMS.length, count:H.players.size,
      teams: teams().map(t => ({ label:t.label, n:t.n, avg:t.avg })),
      primary: b ? { label: b.textContent.replace(/\s+/g, ' ').trim(), disabled: b.disabled } : null,
      canLeave: H.phase === 'final' || H.players.size === 0, conn: H.conn || '' };
    if(it && H.phase !== 'lobby' && H.phase !== 'final'){
      Object.assign(st, { q:H.q, tipo:it.tipo, pregunta:it.q, opciones:itemOptions(it), correcta: it.tipo === 'encuesta' ? null : it.c,
        explicacion: it.e, answered: H.phase === 'question' ? H.answers.size : (H.stats[H.q] ? H.stats[H.q].answered : 0),
        pct: H.stats[H.q] ? H.stats[H.q].correctPct : null, dur: DUR });
    }
    if(H.phase === 'summary'){
      const D = summaryData();
      st.groupPct = groupPct();
      st.items = D.map(d => ({ n:d.i + 1, poll:d.poll, tot:d.tot, pct:d.pct, majorityOk: !d.poll && d.tot > 0 && d.tops.includes(d.it.c),
        top: d.tops.map(k => d.opts[k]).join(' / '), topP: d.top >= 0 ? d.rows[d.top].p : 0 }));
    }
    if(H.phase === 'board' || H.phase === 'final') st.top = ranked().slice(0, 3).map(p => ({ name:p.name, score:p.score }));
    return st;
  }
  function snapshot(){ const s = PAGE === 'vivo' ? vivoState() : presState(); s.blank = blank; return s; }
  function push(force){
    if(!bus || !S.owner) return;
    const s = snapshot(), key = JSON.stringify(s);
    if(!force && key === lastKey) return;
    lastKey = key;
    if(PAGE === 'vivo' && H.phase === 'question') s.endsIn = Math.max(0, H.deadline - Date.now());
    bus.send({ t:'state', owner:S.owner, ...s });
  }

  /* ---------- Comandos ---------- */
  function run(m){
    const a = m.a;
    if(a === 'blank'){ setBlank(!blank); return; }
    if(PAGE === 'pres'){
      const same = m.from === undefined || m.from === State.current;   // evita saltos dobles por toques repetidos
      if(a === 'next' && same) go(State.current + 1);
      else if(a === 'prev' && same) go(State.current - 1);
      else if(a === 'goto' && Number.isInteger(m.i)) go(m.i);
      else if(a === 'open' && m.page === 'vivo') leave('vivo.html' + jq());
    } else {
      const b = document.getElementById('primaryAction');
      if(a === 'primary'){ if(b && !b.disabled && (m.phase === undefined || m.phase === H.phase)) b.click(); }
      else if(a === 'bots' && H.phase === 'lobby') addBots(8);
      else if(a === 'restart' && H.phase === 'final') restart();
      else if(a === 'open' && m.page === 'pres' && (H.phase === 'final' || H.players.size === 0)) leave('capacitacion.html' + jq());
    }
  }
  function leave(url){ blank = false; push(true); setTimeout(() => { location.href = url; }, 150); }

  function onMsg(m){
    if(!m.rid || typeof m.rid !== 'string') return;
    if(m.t === 'hello'){
      if(!S.owner){ S.owner = m.rid; save(); paired(); }
      if(S.owner !== m.rid){ bus.send({ t:'busy', rid:m.rid }); return; }
      lastSeen = Date.now(); paint(); push(true); return;
    }
    if(m.rid !== S.owner) return;
    lastSeen = Date.now();
    if(m.t === 'cmd'){ run(m); setTimeout(() => push(true), 60); }
    else if(m.t === 'bye'){ S.owner = null; save(); paint(); toast('Control remoto desconectado'); }
  }

  /* ---------- Interfaz en la pantalla ---------- */
  const PHONE = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>';
  function button(){
    const box = document.querySelector('.top-actions'); if(!box) return;
    const b = document.createElement('button');
    b.className = 'icon-btn rc-btn'; b.id = 'btnRemote'; b.type = 'button';
    b.title = 'Control remoto desde el celular'; b.setAttribute('aria-label', 'Control remoto desde el celular');
    b.innerHTML = PHONE + '<i class="rc-dot" aria-hidden="true"></i>';
    b.onclick = openDialog;
    box.insertBefore(b, document.getElementById('btnFull'));
  }
  function online(){ return S.owner && Date.now() - lastSeen < 12000; }
  function paint(){
    const b = document.getElementById('btnRemote');
    if(b){ b.classList.toggle('on', !!online()); b.title = online() ? 'Control remoto conectado' : 'Control remoto desde el celular'; }
    const d = document.getElementById('rcDlg'); if(d && d.open) d.innerHTML = dialogHTML(), wire(d);
  }
  function dialogHTML(){
    const local = !bus || bus.mode === 'local';
    const x = `<button class="icon-btn rc-close" data-rc="close" aria-label="Cerrar">${ic('x')}</button>`;
    if(S.owner) return `${x}<h2>${PHONE} Control remoto</h2>
      <div class="rc-state ${online() ? 'ok' : ''}"><span class="conn ${online() ? 'ok' : 'wait'}"></span>${online() ? 'Celular conectado' : 'Celular vinculado · esperando señal'}</div>
      <p class="muted sm">Desde el celular podés pasar las pantallas, lanzar las preguntas del desafío y poner la pantalla en pausa. El control sigue vinculado aunque pases de la presentación al desafío.</p>
      <p class="muted sm" style="margin-top:10px">La pantalla completa se activa solo desde esta computadora (tecla <b>F</b>): los navegadores no permiten hacerlo a distancia.</p>
      <div class="actions" style="margin-top:18px"><button class="btn ghost" data-rc="unlink">${ic('refresh')} Desvincular y generar un QR nuevo</button></div>`;
    return `${x}<h2>${PHONE} Control remoto</h2>
      <p class="muted sm">Escaneá este código con <b>tu</b> celular para manejar la ${PAGE === 'vivo' ? 'pantalla del desafío' : 'presentación'} sin estar al lado de la computadora.</p>
      <div class="rc-qr"><div class="qr-box" role="img" aria-label="Código QR del control remoto">${qrSVG(controlUrl())}</div></div>
      ${local ? fb('warn', 'Modo demostración', 'Sin Supabase configurado, el control solo funciona entre pestañas de este mismo navegador.') : ''}
      <p class="sm dim rc-note">${ic('lock')} El primer celular que se conecta queda vinculado y los demás son rechazados. Aun así, conviene no proyectar este código: abrilo antes de conectar el proyector o con la pantalla extendida.</p>`;
  }
  function wire(d){
    d.querySelectorAll('[data-rc]').forEach(el => el.onclick = () => {
      const a = el.dataset.rc;
      if(a === 'close') d.close();
      if(a === 'unlink') relink();
    });
  }
  function openDialog(){
    let d = document.getElementById('rcDlg');
    if(!d){ d = document.createElement('dialog'); d.id = 'rcDlg'; d.className = 'rc-dlg'; document.body.appendChild(d);
      d.addEventListener('click', e => { if(e.target === d) d.close(); }); }
    d.innerHTML = dialogHTML(); wire(d); d.showModal();
  }
  function paired(){ const d = document.getElementById('rcDlg'); if(d && d.open) d.close(); toast('Control remoto conectado'); }
  function relink(){
    if(bus && S.owner) bus.send({ t:'busy', rid:S.owner });
    if(bus) bus.close();
    S = fresh(); lastKey = ''; connect(); paint();
  }
  function toast(t){
    let el = document.getElementById('rcToast');
    if(!el){ el = document.createElement('div'); el.id = 'rcToast'; el.className = 'rc-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = PHONE + ' ' + esc(t); el.classList.add('show');
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }
  function setBlank(on){
    blank = !!on;
    let el = document.getElementById('rcBlank');
    if(!el){
      el = document.createElement('div'); el.id = 'rcBlank'; el.className = 'rc-blank';
      el.innerHTML = `<div>${brandMarkHTML()}<p class="rc-bn">${esc(CONFIG.consultora.nombre)}</p><p class="rc-bs">Pausa</p>
        <div class="callout">${ic('stop')} <span>DETENERSE A TIEMPO TAMBIÉN ES SEGURIDAD.</span></div></div>`;
      el.onclick = () => setBlank(false);
      document.body.appendChild(el);
    }
    el.classList.toggle('show', blank);
  }

  function connect(){
    bus = openBus('rs-ctrl-' + S.token, onMsg, s => { conn = s; });
  }
  function init(){
    if(typeof openBus !== 'function') return;
    button(); connect();
    setInterval(() => push(false), 400);        // envía cambios apenas ocurren
    setInterval(() => { push(true); paint(); }, 4000);  // latido: el celular sabe que la pantalla sigue ahí
    document.addEventListener('keydown', e => { if(blank && (e.key === 'Escape' || e.key === 'b' || e.key === 'B')) setBlank(false); });
  }
  return { init, open: openDialog, get state(){ return S; } };
})();
Remote.init();
