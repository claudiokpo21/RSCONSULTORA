'use strict';
/* manejar.js — JUEGO «MANEJÁ VOS»: hay que recorrer 400 km manteniéndose en el carril.
   Con los kilómetros aparece la fatiga: el vehículo se desvía solo, el volante responde tarde,
   aparecen parpadeos largos y la vista se oscurece. En los paradores se puede descansar.
   Si la fatiga llega al máximo, hay un microsueño. Es un juego de demostración: no mide la fatiga
   ni la aptitud para conducir, y las distancias no son reales. No guarda ni envía datos.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
const REDUCIDO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOTAL_KM = 400, KM_FATIGA = 140, KM_POR_SEG = 4, PARADORES = [90, 180, 270, 350];
const SENALES = [[.3, 'Bostezás seguido…'], [.5, 'Te pesan los párpados'], [.68, 'No te acordás de los últimos kilómetros'], [.84, '¡Cabeceaste!']];
let G = null, vehiculo = 'liviano', raf = 0;

/* ---------------------------------------------------------------- PANTALLAS */
function intro(){
  cancelAnimationFrame(raf);
  view.innerHTML = `<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Juego</p><h1>MANEJÁ VOS</h1>
      <p class="muted">Tenés que recorrer <b>${TOTAL_KM} km</b> de noche. Mantené el vehículo en tu carril… mientras aparece la fatiga.</p></div></div>
    <ul class="diag-points">
      <li>${ic('steering')} <span><b>Cómo se maneja:</b> mantené apretado el lado izquierdo o derecho de la pantalla (en la computadora, las flechas ← →).</span></li>
      <li>${ic('activity')} <span><b>La fatiga sube con los kilómetros:</b> el vehículo se desvía solo, el volante responde tarde y aparecen parpadeos.</span></li>
      <li>${ic('bed')} <span><b>Paradores:</b> cuando aparezca el botón <b>PARAR A DESCANSAR</b>, podés detenerte. Vos decidís.</span></li>
    </ul>
    <p class="sm muted" style="margin-top:12px">Elegí el vehículo:</p>
    <div class="mv-veh" role="group" aria-label="Vehículo">
      <button class="chip" data-v="liviano" aria-pressed="${vehiculo === 'liviano'}">${ic('car')} Liviano</button>
      <button class="chip" data-v="pesado" aria-pressed="${vehiculo === 'pesado'}">${ic('truck')} Pesado</button></div>
    <p class="sm dim" style="margin-top:12px">Juego de demostración: no mide tu fatiga ni tu aptitud para manejar, y las distancias no son reales. No se guarda ningún dato.</p>
    <div class="actions"><button class="btn primary lg" id="mvGo">${ic('play')} JUGAR</button></div>
  </div>`;
  $$('.mv-veh .chip').forEach(c => c.onclick = () => { vehiculo = c.dataset.v; $$('.mv-veh .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); });
  $('#mvGo').onclick = jugar;
}

function jugar(){
  view.innerHTML = `<div class="mv-game" id="mvGame">
    <canvas class="mv-cv" id="mvCv" role="img" aria-label="Ruta vista desde arriba con tu vehículo"></canvas>
    <div class="mv-hud">
      <div class="mv-box"><small>Recorrido</small><b id="mvKm">0 km</b><div class="mv-bar"><i id="mvKmBar" style="background:var(--steel)"></i></div></div>
      <div class="mv-box"><small>Fatiga</small><b id="mvFtxt">Descansado</b><div class="mv-bar"><i id="mvFat"></i></div></div>
      <div class="mv-box" style="text-align:center"><small>Desvíos</small><b id="mvDes">0</b></div>
    </div>
    <div class="mv-toast" id="mvToast"></div>
    <div class="mv-hint" id="mvHint"><span>◀ Tocá acá</span><span>Tocá acá ▶</span></div>
    <button class="btn green lg mv-stop" id="mvStop">${ic('bed')} PARAR A DESCANSAR</button>
    <div class="mv-rest" id="mvRest"><div>${ic('bed', 'xl')}<h2>Descansando…</h2><p class="muted">Detenerse en un lugar seguro, comunicar y descansar.</p><div class="mv-bar"><i id="mvRestBar"></i></div></div></div>
  </div>`;
  const cv = $('#mvCv');
  G = { cv, ctx:cv.getContext('2d'), W:0, H:0, dpr:1, dist:0, km:0, kmDesc:0, F:0, Fmax:0, px:0, dv:0, sv:0, steer:0, hist:[], vel:1,
        des:0, fuera:false, descansos:0, estado:'juego', t:0, sueno:0, parpadoHasta:0, proxParpado:2, parpado:0,
        autos:[], proxAuto:2.5, senal:0, rest:0, restX:0, toastHasta:0, fin:null, arboles:[] };
  medir(); G.px = centro(G.dist) + ancho() * .25;
  addEventListener('resize', medir);
  // controles
  const juego = $('#mvGame');
  const tocar = e => { if(e.target.closest('.mv-stop')) return; e.preventDefault(); const r = juego.getBoundingClientRect(); G.steer = (e.clientX - r.left) < r.width / 2 ? -1 : 1; $('#mvHint').style.display = 'none'; };
  juego.addEventListener('pointerdown', e => { if(e.target.closest('.mv-stop')) return; juego.setPointerCapture?.(e.pointerId); tocar(e); });
  juego.addEventListener('pointermove', e => { if(e.buttons || e.pointerType === 'touch') { if(G.steer) tocar(e); } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => juego.addEventListener(n, () => { G.steer = 0; }));
  $('#mvStop').onclick = e => { e.stopPropagation(); parar(); };
  let ant = performance.now();
  const loop = now => {
    const dt = Math.max(0, Math.min(.05, (now - ant) / 1000)); ant = now;
    if(G && G.estado !== 'fin'){ if(!document.hidden) { paso(dt); if(G && G.estado !== 'fin') dibujar(); } raf = requestAnimationFrame(loop); }
  };
  raf = requestAnimationFrame(loop);
}
document.addEventListener('keydown', e => {
  if(!G || G.estado === 'fin') return;
  if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'){ G.steer = -1; e.preventDefault(); }
  if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){ G.steer = 1; e.preventDefault(); }
  if((e.key === 'Enter' || e.key === 'p' || e.key === 'P') && $('#mvStop')?.classList.contains('on')){ e.preventDefault(); parar(); }
});
document.addEventListener('keyup', e => { if(G && ['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) G.steer = 0; });

/* ---------------------------------------------------------------- MUNDO */
const PXKM = 105;                                  // píxeles de ruta por kilómetro de juego
function medir(){
  const c = G.cv; G.dpr = Math.min(2, devicePixelRatio || 1);
  G.W = c.clientWidth; G.H = c.clientHeight; c.width = Math.round(G.W * G.dpr); c.height = Math.round(G.H * G.dpr);
}
const ancho = () => Math.min(G.W * .66, 340);
const margen = () => Math.max(10, (G.W - ancho()) / 2 - 18);
function centro(wy){ const m = margen(); return G.W / 2 + m * (.62 * Math.sin(wy / 900) + .38 * Math.sin(wy / 2300 + 1.7)); }
const autoY = () => G.H * .74;
const pantallaY = wy => autoY() - (wy - G.dist);   // posición en pantalla de un punto de la ruta

function toast(t, rojo, ms = 1800){ const el = $('#mvToast'); el.textContent = t; el.classList.toggle('red', !!rojo); el.classList.add('on'); G.toastHasta = G.t + ms / 1000; }
function vibrar(ms){ try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} }

function paso(dt){
  G.t += dt;
  if(G.t > G.toastHasta) $('#mvToast').classList.remove('on');
  const hw = ancho() / 2;
  if(G.estado === 'descanso'){
    G.rest -= dt; G.vel += (0 - G.vel) * Math.min(1, dt * 3);
    G.px += (centro(G.dist) + hw * 1.55 - G.px) * Math.min(1, dt * 2.5);
    G.F += (0 - G.F) * Math.min(1, dt * 1.6);
    $('#mvRestBar').style.width = Math.min(100, (1 - G.rest / 2.8) * 100) + '%';
    if(G.rest <= 0){ G.F = 0; G.kmDesc = G.km; G.estado = 'volver'; $('#mvRest').classList.remove('on'); G.senal = 0; }
    hud(); return;
  }
  if(G.estado === 'volver'){
    G.vel += (1 - G.vel) * Math.min(1, dt * 1.5);
    G.px += (centro(G.dist) + hw * .5 - G.px) * Math.min(1, dt * 2.2);
    if(G.vel > .97 && Math.abs(G.px - (centro(G.dist) + hw * .5)) < 6) G.estado = 'juego';
  }
  // avance y fatiga
  const avance = KM_POR_SEG * dt * G.vel;
  G.km = Math.min(TOTAL_KM, G.km + avance); G.dist = G.km * PXKM;
  G.F = Math.min(1, (G.km - G.kmDesc) / KM_FATIGA); G.Fmax = Math.max(G.Fmax, G.F);
  const F = G.F;
  while(G.senal < SENALES.length && F >= SENALES[G.senal][0]){ toast(SENALES[G.senal][1], G.senal >= 2, 2200); G.senal++; }
  if(G.estado === 'juego'){
    // microsueño
    if(F >= 1 && G.sueno <= 0){ G.sueno = 2.6; G.dirSueno = Math.random() < .5 ? -1 : 1; toast('Microsueño…', true, 2400); vibrar(300); }
    // volante con demora (la fatiga hace reaccionar más tarde)
    G.hist.push([G.t, G.steer]);
    const lag = F * .28; while(G.hist.length > 1 && G.hist[1][0] <= G.t - lag) G.hist.shift();
    const st = G.sueno > 0 ? 0 : G.hist[0][1];
    const vVol = vehiculo === 'pesado' ? 160 : 190;
    G.sv += (st * vVol - G.sv) * Math.min(1, dt * (vehiculo === 'pesado' ? 6 : 8));   // el volante gira de a poco
    G.px += G.sv * dt;
    // desvío involuntario
    G.dv += (Math.random() - .5) * 900 * Math.pow(F, 1.6) * dt + (Math.random() - .5) * 30 * dt;
    G.dv *= Math.pow(.35, dt); G.dv = Math.max(-140, Math.min(140, G.dv));
    G.px += G.dv * dt;
    if(G.sueno > 0){ G.sueno -= dt; G.px += G.dirSueno * 85 * dt; G.parpado = 1; if(G.sueno <= 0 && G.estado === 'juego') return terminar('sueno'); }
    else {
      if(F > .28 && G.t > G.proxParpado){ G.parpadoHasta = G.t + .1 + F * .32; G.proxParpado = G.t + (1.4 + Math.random() * 3.2) / (F * 1.3); }
      const r = G.parpadoHasta - G.t; G.parpado = r > 0 ? Math.min(1, (.1 + F * .32 - r) * 12, r * 12) : 0;
    }
  }
  // posición relativa en la ruta: 0 = línea central, 0,5 = centro del carril, 1 = borde
  const rel = (G.px - centro(G.dist)) / hw;
  if(G.estado === 'juego'){
    const fuera = G.fuera ? !(rel > .3 && rel < .72) : (rel < .22 || rel > .8);
    if(fuera && !G.fuera){ G.des++; vibrar(120); toast(rel < .5 ? '¡Invadiste el carril contrario!' : '¡Te vas a la banquina!', true); }
    G.fuera = fuera;
    if(rel > 1.3 || rel < -1.15) return terminar('salida');
  }
  // autos de frente
  if(G.t > G.proxAuto && G.estado !== 'descanso'){ G.autos.push({ wy:G.dist + G.H * 1.1 }); G.proxAuto = G.t + 2.6 + Math.random() * 3.4; }
  for(const a of G.autos){ a.wy -= 330 * dt; }   // vienen de frente
  G.autos = G.autos.filter(a => pantallaY(a.wy) < G.H + 120);
  if(G.estado === 'juego'){
    const largo = vehiculo === 'pesado' ? 120 : 64;
    for(const a of G.autos){
      const ay = pantallaY(a.wy), ax = centro(a.wy) - hw * .5;
      if(Math.abs(ay - autoY()) < (largo / 2 + 30) && Math.abs(ax - G.px) < hw * .42) return terminar('choque');
    }
  }
  // paradores: el botón aparece cerca de cada uno
  const cerca = PARADORES.some(p => G.km > p - 8 && G.km < p + 3) && G.estado === 'juego' && G.sueno <= 0;
  $('#mvStop').classList.toggle('on', cerca);
  if(G.km >= TOTAL_KM) return terminar('llegaste');
  hud();
}
function parar(){
  if(!G || G.estado !== 'juego') return;
  G.estado = 'descanso'; G.rest = 2.8; G.descansos++; G.parpado = 0; G.dv = 0; G.sv = 0; G.fuera = false;
  $('#mvStop').classList.remove('on'); $('#mvRest').classList.add('on');
}
function hud(){
  $('#mvKm').textContent = Math.floor(G.km) + ' km';
  $('#mvKmBar').style.width = (G.km / TOTAL_KM * 100) + '%';
  const f = $('#mvFat'); f.style.width = Math.max(3, G.F * 100) + '%'; f.className = G.F > .66 ? 'bad' : G.F > .33 ? 'mid' : '';
  $('#mvFtxt').textContent = G.estado === 'descanso' ? 'Descansando' : G.F > .84 ? 'Somnolencia' : G.F > .5 ? 'Cansancio' : G.F > .28 ? 'Primeras señales' : 'Descansado';
  $('#mvDes').textContent = G.des;
}

/* ---------------------------------------------------------------- DIBUJO */
function dibujar(){
  const { ctx, W, H, dpr, F } = G, hw = ancho() / 2;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0e1a14'; ctx.fillRect(0, 0, W, H);
  // pasto con franjas para dar sensación de velocidad
  for(let y = 0; y < H; y += 6){
    const wy = G.dist + (autoY() - y);
    if(Math.floor(wy / 60) % 2){ ctx.fillStyle = '#10201a'; ctx.fillRect(0, y, W, 6); }
  }
  // ruta
  for(let y = -4; y < H + 4; y += 3){
    const wy = G.dist + (autoY() - y), cx = centro(wy);
    ctx.fillStyle = '#2b2f36'; ctx.fillRect(cx - hw - 10, y, hw * 2 + 20, 3.4);
    ctx.fillStyle = Math.floor(wy / 26) % 2 ? '#c7303a' : '#e8ebef'; ctx.fillRect(cx - hw - 10, y, 6, 3.4); ctx.fillRect(cx + hw + 4, y, 6, 3.4);
    ctx.fillStyle = '#dfe3e8'; ctx.fillRect(cx - hw, y, 3, 3.4); ctx.fillRect(cx + hw - 3, y, 3, 3.4);
    if(Math.floor(wy / 34) % 2){ ctx.fillStyle = '#f5b301'; ctx.fillRect(cx - 2, y, 4, 3.4); }
  }
  // árboles y postes
  for(let k = -2; k < H / 70 + 3; k++){
    const wy = Math.floor((G.dist + autoY()) / 70) * 70 - k * 70, y = pantallaY(wy), cx = centro(wy), s = (wy / 70) % 3;
    const xl = cx - hw - 34 - (s * 13 % 30), xr = cx + hw + 34 + (s * 17 % 30);
    if(Math.abs(s) % 3 === 0){ arbol(xl, y); } else if(Math.abs(s) % 3 === 1){ arbol(xr, y); }
  }
  // paradores y carteles
  for(const p of PARADORES){
    const wy = p * PXKM, y = pantallaY(wy), cx = centro(wy);
    if(y > -260 && y < H + 260){ parador(cx + hw + 14, y); }
    const ys = pantallaY(wy - 13 * PXKM), cs = centro(wy - 13 * PXKM);
    if(ys > -60 && ys < H + 60) cartel(cs + hw + 22, ys);
  }
  // autos de frente
  for(const a of G.autos){ const y = pantallaY(a.wy); auto(centro(a.wy) - hw * .5, y, hw * .42, '#c7cdd6', true); }
  // vehículo propio (con luces delanteras)
  const ay = autoY(), w = hw * (vehiculo === 'pesado' ? .5 : .42);
  const lg = ctx.createLinearGradient(0, ay - 40, 0, ay - 230);
  lg.addColorStop(0, 'rgba(255,241,201,.26)'); lg.addColorStop(1, 'rgba(255,241,201,0)');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(G.px - w * .4, ay - 30); ctx.lineTo(G.px + w * .4, ay - 30); ctx.lineTo(G.px + w * 1.4, ay - 230); ctx.lineTo(G.px - w * 1.4, ay - 230); ctx.fill();
  vehiculo === 'pesado' ? camion(G.px, ay, w) : auto(G.px, ay, w, '#f5b301', false);
  // oscuridad, visión de túnel y párpados
  if(F > 0){ ctx.fillStyle = `rgba(0,0,0,${(F * .38).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if(F > .2){
    const r = Math.max(W, H) * (1.05 - F * .5);
    const v = ctx.createRadialGradient(G.px, ay - H * .2, r * .2, G.px, ay - H * .2, r);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${Math.min(.92, F).toFixed(3)})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  if(G.fuera && G.estado === 'juego'){ ctx.fillStyle = 'rgba(229,72,77,.16)'; ctx.fillRect(0, 0, W, H); }
  if(G.parpado > 0){
    const h = H / 2 * G.parpado; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
  }
}
function arbol(x, y){ const { ctx } = G; ctx.fillStyle = '#0a1410'; ctx.beginPath(); ctx.arc(x + 4, y + 4, 15, 0, 7); ctx.fill(); ctx.fillStyle = '#1b3a2a'; ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.fill(); ctx.fillStyle = '#24503a'; ctx.beginPath(); ctx.arc(x - 4, y - 4, 7, 0, 7); ctx.fill(); }
function rr(x, y, w, h, r){ const c = G.ctx; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
function parador(x, y){
  const c = G.ctx, w = Math.min(130, G.W - x - 4);
  if(w < 40) return;
  c.fillStyle = '#3a4048'; rr(x, y - 110, w, 220, 12); c.fill();
  c.strokeStyle = '#e8ebef'; c.lineWidth = 2; for(let i = 0; i < 4; i++){ c.beginPath(); c.moveTo(x + 8, y - 70 + i * 40); c.lineTo(x + w * .6, y - 70 + i * 40); c.stroke(); }
  c.fillStyle = '#1d7a46'; rr(x + w - 44, y - 100, 36, 36, 8); c.fill();
  c.fillStyle = '#fff'; c.font = '900 24px system-ui,sans-serif'; c.textAlign = 'center'; c.fillText('P', x + w - 26, y - 73);
  c.fillStyle = '#5a3a28'; rr(x + w - 50, y + 20, 46, 70, 6); c.fill(); c.fillStyle = '#f5b301'; c.fillRect(x + w - 42, y + 40, 12, 10);
}
function cartel(x, y){
  const c = G.ctx, w = Math.min(92, G.W - x - 4); if(w < 50) return;
  c.fillStyle = '#6f7a86'; c.fillRect(x + w / 2 - 2, y, 4, 22);
  c.fillStyle = '#1d7a46'; rr(x, y - 34, w, 36, 6); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '800 11px system-ui,sans-serif'; c.fillText('PARADOR', x + w / 2, y - 19); c.font = '800 12px system-ui,sans-serif'; c.fillText('A 1 km →', x + w / 2, y - 5);
}
function auto(x, y, w, color, deFrente){
  const c = G.ctx, h = w * 1.9;
  c.fillStyle = 'rgba(0,0,0,.35)'; rr(x - w / 2 + 4, y - h / 2 + 5, w, h, w * .3); c.fill();
  c.fillStyle = color; rr(x - w / 2, y - h / 2, w, h, w * .3); c.fill();
  c.fillStyle = '#1b2532'; rr(x - w * .38, y + (deFrente ? .12 : -.36) * h, w * .76, h * .2, 5); c.fill();
  c.fillStyle = '#26303d'; rr(x - w * .36, y + (deFrente ? -.3 : .18) * h, w * .72, h * .14, 5); c.fill();
  if(deFrente){ c.fillStyle = '#fffbe8'; c.fillRect(x - w * .42, y + h / 2 - 6, w * .22, 5); c.fillRect(x + w * .2, y + h / 2 - 6, w * .22, 5);
    const g = c.createLinearGradient(0, y + h / 2, 0, y + h / 2 + 140); g.addColorStop(0, 'rgba(255,250,230,.3)'); g.addColorStop(1, 'rgba(255,250,230,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - w * .45, y + h / 2); c.lineTo(x + w * .45, y + h / 2); c.lineTo(x + w * 1.2, y + h / 2 + 140); c.lineTo(x - w * 1.2, y + h / 2 + 140); c.fill(); }
  else { c.fillStyle = '#ff3b3b'; c.fillRect(x - w * .42, y + h / 2 - 5, w * .22, 4); c.fillRect(x + w * .2, y + h / 2 - 5, w * .22, 4); }
}
function camion(x, y, w){
  const c = G.ctx, hc = w * .9, ht = w * 2.5;
  c.fillStyle = 'rgba(0,0,0,.35)'; rr(x - w / 2 + 5, y - hc / 2 - 6 + 5, w, hc + ht, 8); c.fill();
  c.fillStyle = '#f5b301'; rr(x - w / 2, y - hc - 4 - ht / 2 + 30, w, hc, w * .2); c.fill();     // cabina
  c.fillStyle = '#1b2532'; rr(x - w * .38, y - hc - ht / 2 + 34, w * .76, hc * .3, 4); c.fill();
  c.fillStyle = '#e9edf2'; rr(x - w / 2 - 2, y - ht / 2 + 28, w + 4, ht, 6); c.fill();          // semirremolque
  c.strokeStyle = '#b3bcc6'; c.lineWidth = 2; c.strokeRect(x - w / 2 + 4, y - ht / 2 + 34, w - 8, ht - 12);
  c.fillStyle = '#ff3b3b'; c.fillRect(x - w * .45, y + ht / 2 + 22, w * .2, 4); c.fillRect(x + w * .25, y + ht / 2 + 22, w * .2, 4);
}

/* ---------------------------------------------------------------- FINAL */
function terminar(motivo){
  if(G.sueno > 0 && motivo !== 'llegaste') motivo = 'sueno';   // el choque o la salida fue durante un microsueño
  G.estado = 'fin'; cancelAnimationFrame(raf); removeEventListener('resize', medir);
  const km = Math.floor(G.km), ok = motivo === 'llegaste';
  const T = {
    llegaste: G.des ? [`Llegaste, con ${G.des} desvío${G.des > 1 ? 's' : ''}`, `Cada desvío pudo terminar en un choque. Parar antes, apenas aparecen las primeras señales, es más seguro.`]
                    : ['¡Llegaste seguro!', 'Paraste a tiempo y no te desviaste del carril. Eso es planificar el viaje y escuchar al cuerpo.'],
    sueno:   ['Te dormiste al volante', 'La fatiga llegó al máximo y hubo un microsueño. A 100 km/h, 3 segundos dormido son 83 metros sin control.'],
    choque:  ['Choque frontal', 'El vehículo invadió el carril contrario. Los desvíos involuntarios son una señal de fatiga.'],
    salida:  ['Te saliste del camino', 'El vehículo se fue de la ruta. Con fatiga, el volante responde tarde y cuesta corregir.']
  }[motivo];
  view.innerHTML = `<div class="gate-card mv-fin">
    <p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Manejá vos</p>
    <h1 style="font-size:1.7rem;color:${ok && !G.des ? '#5fd497' : ok ? 'var(--amber)' : '#ff8a8d'}">${T[0]}</h1>
    <p class="muted" style="margin-top:6px">${T[1]}</p>
    <div class="mv-stats">
      <div><b>${km}</b><span>km recorridos</span></div>
      <div><b>${G.descansos}</b><span>descanso${G.descansos === 1 ? '' : 's'}</span></div>
      <div><b>${G.des}</b><span>desvío${G.des === 1 ? '' : 's'}</span></div>
      <div><b>${Math.round(G.Fmax * 100)} %</b><span>fatiga máxima</span></div>
    </div>
    ${fb('warn', 'En la vida real no hay «jugar de nuevo»', 'Ante cualquier señal de fatiga: detenerse en un lugar seguro, comunicar y descansar.')}
    <div class="callout green" style="margin-top:14px">${ic('shield')} <span>Detenerse a tiempo también es seguridad.</span></div>
    <p class="sm dim" style="margin-top:12px">Juego de demostración: no mide tu fatiga ni tu aptitud para manejar. No se guardó ningún dato.</p>
    <div class="actions" style="justify-content:center"><button class="btn primary" id="mvOtra">${ic('refresh')} Jugar de nuevo</button><a class="btn ghost" href="actividades.html">Otras actividades</a></div>
  </div>`;
  $('#mvOtra').onclick = jugar;
  G = null;
}
initBrand(); intro();
