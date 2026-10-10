'use strict';
/* ruta.js — «LA RUTA SE APAGA»: dibujo animado de un viaje de noche.
   El capacitador mueve la barra de fatiga y la escena muestra lo que pasa: la vista se oscurece y se
   achica, las líneas se desdibujan, aparecen parpadeos largos, el vehículo se desvía del carril y, al
   final, un microsueño. El botón «Detenerse y descansar» lo resuelve.
   Las etapas usan las señales de la capacitación; la barra no representa horas exactas.
   Se usa en el proyector (ruta.html?sala) o en el celular. No guarda ni envía datos.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
const REDUCIDO = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ETAPAS = [
  { t:'Descansado', d:'Atento, buena visibilidad y reacciones rápidas.' },
  { t:'Primeras señales', d:'Bostezos, ganas de cambiar de posición, subir la radio o abrir la ventanilla.' },
  { t:'Cansancio acumulado', d:'Párpados pesados, desconcentración, se olvidan tramos del camino.' },
  { t:'Somnolencia', d:'Parpadeos largos, desvíos involuntarios del carril y frenadas tardías.' },
  { t:'Microsueño', d:'Los ojos se cierran unos segundos sin que te des cuenta. A 100 km/h, 3 segundos son 83 metros sin control.' }
];
const R = {
  f:0, meta:0, t:0, z:0, vel:1, u:.5, tipo:'pesado', auto:false, descanso:0, sueno:0, proxSueno:4,
  parpado:0, parpadoHasta:0, proxParpado:3, frente:null, proxFrente:6, avisoHasta:0, aviso:'', ok:0, estrellas:null
};

function iniciar(){
  initBrand();
  view.innerHTML = `<div class="act-head"><div><p class="eyebrow">Actividad · en grupo</p><h1>LA RUTA SE APAGA</h1>
      <p class="muted">Mové la barra de <b>fatiga</b> y mirá qué le pasa al viaje. Después, probá el botón <b>Detenerse y descansar</b>.</p></div>
      <div class="chips" role="group" aria-label="Tipo de vehículo"><button class="chip" data-v="liviano" aria-pressed="false">${ic('car')} Liviano</button><button class="chip" data-v="pesado" aria-pressed="true">${ic('truck')} Pesado</button></div></div>
    <div class="rt-wrap">
      <div class="rt-stage">
        <canvas class="rt-canvas" id="rtCv" role="img" aria-label="Vehículo en una ruta de noche; la escena cambia según el nivel de fatiga"></canvas>
        <div class="rt-hud"><div class="rt-etapa" id="rtEtapa" aria-live="polite"></div><span class="score-pill" id="rtDesvio" style="display:none;background:var(--red);border-color:var(--red);color:#fff">${ic('lane')} Desvío del carril</span></div>
        <div class="rt-msg" id="rtMsg"><div><b></b><span></span></div></div>
      </div>
      <div class="panel rt-ctrl">
        <label for="rtRange">${ic('activity')} Fatiga</label>
        <div><input type="range" class="rt-range" id="rtRange" min="0" max="100" value="0" step="1" aria-describedby="rtEtapa">
          <div class="rt-scale"><span>Inicio del viaje</span><span>Muchas horas sin pausa</span></div></div>
        <div class="rt-actions"><button class="btn ghost" id="rtAuto">${ic('play')} Avanzar solo</button><button class="btn green" id="rtPara">${ic('bed')} Detenerse y descansar</button></div>
      </div>
      <p class="sm dim">Dibujo de demostración: la barra muestra etapas de la fatiga, no horas exactas. No se guarda ningún dato.</p>
    </div>`;
  const rg = $('#rtRange');
  rg.oninput = () => { R.meta = rg.value / 100; R.auto = false; botonAuto(); etapa(); };
  $('#rtAuto').onclick = () => { R.auto = !R.auto; if(R.auto && R.meta >= 1){ R.meta = 0; rg.value = 0; } botonAuto(); };
  $('#rtPara').onclick = descansar;
  $$('.chips .chip').forEach(c => c.onclick = () => { R.tipo = c.dataset.v; $$('.chips .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); });
  addEventListener('resize', medir); medir(); etapa();
  let ant = performance.now();
  const loop = now => {
    const dt = Math.max(0, Math.min(.05, (now - ant) / 1000)); ant = now;
    if(!document.hidden){ paso(REDUCIDO ? 0 : dt); dibujar(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function botonAuto(){ $('#rtAuto').innerHTML = R.auto ? `${ic('pause')} Pausar` : `${ic('play')} Avanzar solo`; }
function etapa(){
  const i = Math.min(4, Math.floor(R.meta * 4.999));
  const e = ETAPAS[R.descanso ? 0 : i];
  $('#rtEtapa').innerHTML = R.descanso ? `<b style="color:#5fd497">Descansando</b><span>Detenerse en un lugar seguro, comunicar y descansar.</span>` : `<b>${e.t}</b><span>${e.d}</span>`;
}
function mensaje(tit, txt, ok, ms){
  const m = $('#rtMsg'); m.classList.toggle('ok', !!ok); $('b', m).textContent = tit; $('span', m).textContent = txt;
  m.classList.add('on'); R.avisoHasta = R.t + ms / 1000;
}

/* ---------------------------------------------------------------- SIMULACIÓN */
function paso(dt){
  R.t += dt;
  const rg = $('#rtRange');
  if(R.auto && !R.descanso){ R.meta = Math.min(1, R.meta + dt / 40); rg.value = Math.round(R.meta * 100); etapa(); if(R.meta >= 1){ R.auto = false; botonAuto(); } }
  // descanso: se detiene en la banquina, la fatiga baja y vuelve a la ruta
  if(R.descanso){
    R.descanso -= dt;
    R.vel += ((R.descanso > 1.4 ? 0 : 1) - R.vel) * Math.min(1, dt * 1.6);
    R.u += ((R.descanso > 1.4 ? 1.1 : .5) - R.u) * Math.min(1, dt * 1.5);
    R.f += (0 - R.f) * Math.min(1, dt * 1.2); R.parpado = 0; R.sueno = 0;
    if(R.descanso <= 0){ R.descanso = 0; R.meta = 0; rg.value = 0; etapa(); }
  } else {
    R.f += (R.meta - R.f) * Math.min(1, dt * 2.5);
    R.vel += (1 - R.vel) * Math.min(1, dt);
  }
  R.z += dt * 9 * R.vel;
  const f = R.f;
  if(!R.descanso){
    // desvío: el vehículo «se va» cada vez más
    const amp = .04 + .4 * f * f;
    let u = .5 + amp * (Math.sin(R.t * .9) * .65 + Math.sin(R.t * .37 + 1.3) * .35);
    // microsueño (al máximo de la barra): 3 s con los ojos cerrados, el vehículo se va a la banquina
    if(f > .86 && R.sueno <= 0 && R.t > R.proxSueno){ R.sueno = 3; }
    if(R.sueno > 0){
      R.sueno -= dt; R.parpado = 1;
      R.uSueno = Math.min(1.25, (R.uSueno ?? R.u) + dt * .28); u = R.uSueno;
      if(R.sueno <= 0){ R.parpado = 0; R.proxSueno = R.t + 7; R.uSueno = null;
        mensaje('¡Microsueño!', '3 segundos con los ojos cerrados. A 100 km/h son 83 metros sin control.', false, 3200); }
    } else if(R.uSueno == null){
      // parpadeos largos: más frecuentes y más largos con la fatiga
      if(f > .3 && R.t > R.proxParpado){ R.parpadoHasta = R.t + .1 + f * .35; R.proxParpado = R.t + (1.2 + Math.random() * 3) / (f * 1.4); }
      const restante = R.parpadoHasta - R.t;
      R.parpado = restante > 0 ? Math.min(1, (.1 + f * .35 - restante) * 12, restante * 12) : 0;
    }
    R.u += (u - R.u) * Math.min(1, dt * 3);
  }
  // vehículo de frente en el otro carril, de vez en cuando
  if(!R.frente && R.t > R.proxFrente && !R.descanso){ R.frente = { p:.02 }; }
  if(R.frente){ R.frente.p += dt * .32 * (1 + R.frente.p * 2.5);
    if(R.frente.p >= 1){ if(R.u < .14 && R.t > R.avisoHasta) mensaje('¡Casi choque!', 'El vehículo invadió el carril contrario sin que el conductor lo notara.', false, 2600);
      R.frente = null; R.proxFrente = R.t + 6 + Math.random() * 6; } }
  if(R.t > R.avisoHasta) $('#rtMsg').classList.remove('on');
  $('#rtDesvio').style.display = (R.u < .07 || (R.u > .93 && !R.descanso)) ? '' : 'none';
}
function descansar(){
  if(R.descanso) return;
  R.auto = false; botonAuto(); R.descanso = 4.6; R.sueno = 0; R.uSueno = null; etapa();
  mensaje('Detenerse a tiempo también es seguridad', 'Parar en un lugar seguro, comunicar y descansar. Después, el viaje sigue.', true, 4200);
}

/* ---------------------------------------------------------------- DIBUJO */
let cv, ctx, cvMain, ctxMain, off, ctxOff, W = 1280, H = 640, DPR = 1;
function medir(){
  cv = $('#rtCv'); ctxMain = cv.getContext('2d');
  off = off || document.createElement('canvas');
  DPR = Math.min(2, devicePixelRatio || 1);
  W = cv.clientWidth || 1280; H = cv.clientHeight || 640;
  cv.width = off.width = Math.round(W * DPR); cv.height = off.height = Math.round(H * DPR);
  ctxOff = off.getContext('2d');
  R.estrellas = Array.from({ length:70 }, () => [Math.random(), Math.random() * .9, Math.random()]);
}
const mezcla = (a, b, k) => a.map((x, i) => Math.round(x + (b[i] - x) * k));
const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;

function dibujar(){
  const f = R.f, hy = H * .42, amanecer = R.descanso ? Math.min(1, (4.6 - R.descanso) / 1.5) * (R.descanso > .6 ? 1 : R.descanso / .6) : 0;
  ctx = ctxOff;   // la escena se dibuja aparte y después se pasa a la pantalla (con desenfoque si hay fatiga)
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // cielo
  const g = ctx.createLinearGradient(0, 0, 0, hy);
  g.addColorStop(0, rgb(mezcla([5, 8, 17], [40, 62, 100], amanecer))); g.addColorStop(1, rgb(mezcla([24, 38, 62], [222, 150, 92], amanecer)));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 1);
  ctx.fillStyle = '#cfd8e6';
  for(const [x, y, s] of R.estrellas){ ctx.globalAlpha = (.25 + s * .6) * (1 - amanecer); ctx.fillRect(x * W, y * hy, 1.4 + s, 1.4 + s); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = rgb(mezcla([9, 14, 22], [40, 46, 52], amanecer));
  ctx.beginPath(); ctx.moveTo(0, hy);
  for(let x = 0; x <= W; x += W / 12) ctx.lineTo(x, hy - 8 - 10 * Math.abs(Math.sin(x * .013 + 1)));
  ctx.lineTo(W, hy); ctx.fill();
  // ruta en perspectiva (por franjas)
  const curva = Math.sin(R.t * .11) * .9;
  const centro = p => W / 2 + curva * (1 - p) * (1 - p) * W * .32;
  const ancho = p => W * .5 * p + 2;
  for(let y = Math.floor(hy); y < H; y += 1){
    const p = (y - hy) / (H - hy), zz = 1 / (p + .015), fase = ((zz * 1.6 + R.z) % 2) < 1;
    const cx = centro(p), hw = ancho(p);
    ctx.fillStyle = rgb(mezcla(fase ? [12, 20, 16] : [15, 24, 19], [44, 70, 44], amanecer)); ctx.fillRect(0, y, W, 1.2);
    ctx.fillStyle = rgb(mezcla(fase ? [40, 43, 49] : [44, 47, 53], [72, 76, 82], amanecer)); ctx.fillRect(cx - hw, y, hw * 2, 1.2);
    ctx.fillStyle = fase ? '#c7303a' : '#e8ebef'; ctx.fillRect(cx - hw * 1.07, y, hw * .07, 1.2); ctx.fillRect(cx + hw, y, hw * .07, 1.2);
    ctx.fillStyle = '#e2e6ea'; ctx.fillRect(cx - hw * .95, y, Math.max(1, hw * .022), 1.2); ctx.fillRect(cx + hw * .93, y, Math.max(1, hw * .022), 1.2);
    if(((zz * .8 + R.z * .5) % 2) < 1){ ctx.fillStyle = '#f5b301'; ctx.fillRect(cx - hw * .014, y, Math.max(1, hw * .028), 1.2); }
  }
  // postes con reflectivos
  for(let k = 0; k < 8; k++){
    const zz = ((k * 2.4 - R.z * .5) % 19.2 + 19.2) % 19.2 + .6, p = 1 / zz - .015;
    if(p <= 0 || p > 1) continue;
    const y = hy + p * (H - hy), cx = centro(p), hw = ancho(p), h = 60 * p;
    for(const s of [-1, 1]){ const x = cx + s * hw * 1.18; ctx.fillStyle = '#c9ced6'; ctx.fillRect(x - 2 * p, y - h, 4 * p + 1, h); ctx.fillStyle = s < 0 ? '#e5484d' : '#f5b301'; ctx.fillRect(x - 2 * p, y - h, 4 * p + 1, h * .2); }
  }
  // vehículo de frente (luces)
  if(R.frente){
    const p = R.frente.p, y = hy + p * (H - hy), cx = centro(p), hw = ancho(p), x = cx - hw * .5, r = 3 + 26 * p;
    const lg = ctx.createRadialGradient(x, y - r, 0, x, y - r, r * 5); lg.addColorStop(0, 'rgba(255,250,230,.55)'); lg.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = lg; ctx.fillRect(x - r * 5, y - r * 6, r * 10, r * 10);
    ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(x - hw * .16, y - r, r * .45, 0, 7); ctx.arc(x + hw * .16, y - r, r * .45, 0, 7); ctx.fill();
  }
  // vehículo propio
  const pv = .86, yv = hy + pv * (H - hy), hwv = ancho(pv), xv = centro(pv) + R.u * hwv;
  faros(xv, yv, hwv, hy, centro, ancho);
  R.tipo === 'pesado' ? camion(xv, yv, hwv * .5) : auto(xv, yv, hwv * .44);
  ctx = ctxMain;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = f > .35 && 'filter' in ctx ? `blur(${((f - .35) * 4 * DPR).toFixed(2)}px)` : 'none';
  ctx.drawImage(off, 0, 0);
  ctx.filter = 'none';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // oscuridad y visión de túnel
  if(f > 0){ ctx.fillStyle = `rgba(0,0,0,${(f * .42).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
  if(f > .15){
    const rad = Math.max(W, H) * (1.05 - f * .55);
    const v = ctx.createRadialGradient(W / 2, H * .55, rad * .25, W / 2, H * .55, rad);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${Math.min(.92, f * 1.05).toFixed(3)})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  // párpados
  if(R.parpado > 0){
    const h = H / 2 * R.parpado;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
    const e1 = ctx.createLinearGradient(0, h, 0, h + 40); e1.addColorStop(0, 'rgba(0,0,0,.9)'); e1.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = e1; ctx.fillRect(0, h, W, 40);
    const e2 = ctx.createLinearGradient(0, H - h, 0, H - h - 40); e2.addColorStop(0, 'rgba(0,0,0,.9)'); e2.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = e2; ctx.fillRect(0, H - h - 40, W, 40);
    if(R.sueno > 0){ ctx.fillStyle = 'rgba(245,179,1,.85)'; ctx.font = `800 ${Math.round(H * .06)}px system-ui,sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(R.sueno)}…`, W / 2, H / 2 + H * .02); }
  }
}
function faros(xv, yv, hwv, hy, centro, ancho){
  const p2 = .55, y2 = hy + p2 * (H - hy), c2 = centro(p2), w2 = ancho(p2), top = yv - hwv * .55;
  const g = ctx.createLinearGradient(0, top, 0, y2); g.addColorStop(0, 'rgba(255,241,201,.22)'); g.addColorStop(1, 'rgba(255,241,201,0)');
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(xv - hwv * .25, top); ctx.lineTo(xv + hwv * .25, top); ctx.lineTo(c2 + (xv - centro(.9)) * .3 + w2 * .5, y2); ctx.lineTo(c2 + (xv - centro(.9)) * .3 - w2 * .5, y2); ctx.fill();
}
function rr(x, y, w, h, r){ ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function luces(x, y, w, h, k){
  ctx.fillStyle = '#ff2b2b'; rr(x, y, w, h, 3); ctx.fill();
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 2.6 * k);
  g.addColorStop(0, 'rgba(255,40,40,.45)'); g.addColorStop(1, 'rgba(255,40,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - w * 3, y - w * 3, w * 7, w * 7);
}
function camion(x, yb, w){
  const h = w * 1.02, l = x - w / 2, t = yb - h - w * .1;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x, yb, w * .62, w * .06, 0, 0, 7); ctx.fill();
  for(const s of [-1, 1]){ ctx.fillStyle = '#0b0c0f'; rr(x + s * w * .36 - w * .1, yb - w * .2, w * .2, w * .2, 4); ctx.fill(); }
  ctx.fillStyle = '#e9edf2'; rr(l, t, w, h, 6); ctx.fill();
  ctx.fillStyle = '#c9d0d8'; ctx.fillRect(x - 1.5, t + 6, 3, h - 12);
  ctx.strokeStyle = '#b3bcc6'; ctx.lineWidth = 2; ctx.strokeRect(l + 8, t + 8, w - 16, h - 16);
  for(let i = 0; i < 8; i++){ ctx.fillStyle = i % 2 ? '#fff' : '#d0242f'; ctx.fillRect(l + 8 + i * (w - 16) / 8, t + h - 22, (w - 16) / 8, 9); }
  ctx.fillStyle = '#1a1d22'; ctx.fillRect(l - 4, t + h, w + 8, w * .08);
  luces(l + 4, t + h - w * .2, w * .1, w * .07, 1); luces(l + w - 4 - w * .1, t + h - w * .2, w * .1, w * .07, 1);
  ctx.fillStyle = '#f2f4f6'; ctx.fillRect(x - w * .1, t + h + w * .015, w * .2, w * .05);
}
function auto(x, yb, w){
  const h = w * .6, l = x - w / 2, t = yb - h - w * .08;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x, yb, w * .6, w * .07, 0, 0, 7); ctx.fill();
  for(const s of [-1, 1]){ ctx.fillStyle = '#0b0c0f'; rr(x + s * w * .36 - w * .09, yb - w * .17, w * .18, w * .17, 4); ctx.fill(); }
  ctx.fillStyle = '#9aa5b3'; ctx.beginPath(); ctx.moveTo(l + w * .14, t + h * .42); ctx.lineTo(l + w * .24, t); ctx.lineTo(l + w * .76, t); ctx.lineTo(l + w * .86, t + h * .42); ctx.fill();
  ctx.fillStyle = '#1f2a38'; ctx.beginPath(); ctx.moveTo(l + w * .2, t + h * .38); ctx.lineTo(l + w * .28, t + h * .07); ctx.lineTo(l + w * .72, t + h * .07); ctx.lineTo(l + w * .8, t + h * .38); ctx.fill();
  ctx.fillStyle = '#b8c1cc'; rr(l, t + h * .38, w, h * .62, 10); ctx.fill();
  ctx.fillStyle = '#2a3038'; ctx.fillRect(l + 4, t + h * .86, w - 8, h * .14);
  luces(l + w * .04, t + h * .5, w * .16, h * .14, .7); luces(l + w * .8, t + h * .5, w * .16, h * .14, .7);
  ctx.fillStyle = '#f2f4f6'; ctx.fillRect(x - w * .13, t + h * .62, w * .26, h * .15);
}
iniciar();
