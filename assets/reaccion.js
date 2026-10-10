'use strict';
/* reaccion.js — TEST DE TIEMPO DE REACCIÓN (actividad en el celular o en el proyector)
   Ronda 1: atento. Ronda 2: simulación de cansancio (menos visibilidad, parpadeos y distracciones).
   Convierte el tiempo de reacción en metros recorridos antes de empezar a frenar.
   Es una demostración: no mide la fatiga ni la aptitud para conducir. No guarda ni envía datos.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
const N = 5, VEL = 100;                         // toques por ronda · velocidad de referencia (km/h)
const R = { ronda:0, i:0, tiempos:[[], []], estado:'', t0:0, timers:[] };
const metros = ms => Math.round(ms / 1000 * VEL / 3.6 * 10) / 10;
const fmt = n => n.toLocaleString('es-AR', { maximumFractionDigits:1 });
const prom = a => a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0;
function progress(p){ $('#progressFill').style.width = p + '%'; }
function limpiar(){ R.timers.forEach(clearTimeout); R.timers = []; }
function luego(ms, fn){ R.timers.push(setTimeout(fn, ms)); }

function intro(){
  progress(4);
  view.innerHTML = `<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Actividad</p><h1>¿CUÁNTO TARDÁS EN REACCIONAR?</h1>
      <p class="muted">Cuando el círculo se ponga <b style="color:var(--amber)">amarillo</b>, tocá la pantalla lo más rápido que puedas.</p></div></div>
    <ul class="diag-points">
      <li>${ic('target')} <span><b>Ronda 1 · atento:</b> ${N} toques.</span></li>
      <li>${ic('eyeoff')} <span><b>Ronda 2 · simulación de cansancio:</b> menos visibilidad, parpadeos y distracciones.</span></li>
      <li>${ic('ruler')} <span>Al final vas a ver cuántos metros recorrerías a ${VEL} km/h antes de empezar a frenar.</span></li>
    </ul>
    <p class="sm dim">Es un juego de demostración: no mide tu nivel de fatiga ni tu aptitud para manejar. No se guarda ningún dato.</p>
    <div class="actions"><button class="btn primary lg" id="rxGo">${ic('play')} EMPEZAR</button></div>
  </div>`;
  $('#rxGo').onclick = () => ronda(0);
}

function ronda(n){
  R.ronda = n; R.i = 0; R.tiempos[n] = [];
  view.innerHTML = `<div class="rx ${n ? 'cansado' : ''}" id="rx" tabindex="0" role="button" aria-label="Zona para tocar">
    <div class="rx-top"><span class="score-pill">${n ? 'Ronda 2 · simulación de cansancio' : 'Ronda 1 · atento'}</span><span class="rx-n" id="rxN"></span></div>
    <div class="rx-luz" id="rxLuz"></div>
    <p class="rx-msg" id="rxMsg"></p>
    <div class="rx-blink" id="rxBlink"></div>
    <div class="rx-notif" id="rxNotif">${ic('message')} <span>Mensaje nuevo</span></div>
  </div>`;
  const zona = $('#rx');
  zona.addEventListener('pointerdown', e => { e.preventDefault(); toque(); });
  zona.focus();
  esperar();
}
document.addEventListener('keydown', e => { if((e.key === ' ' || e.key === 'Enter') && $('#rx')){ e.preventDefault(); toque(); } });

function esperar(){
  limpiar();
  const zona = $('#rx'); if(!zona) return;
  R.estado = 'espera'; zona.classList.remove('ya', 'pronto');
  $('#rxN').textContent = `${R.i + 1} de ${N}`;
  $('#rxMsg').textContent = R.ronda ? 'Esperá la luz… (y no te distraigas)' : 'Esperá la luz…';
  progress(8 + Math.round((R.ronda * N + R.i) / (2 * N) * 84));
  const espera = 1500 + Math.random() * 2500;
  if(R.ronda){   // simulación de cansancio: parpadeos y una distracción antes de la luz
    luego(espera * (0.25 + Math.random() * 0.3), () => parpadeo(380 + Math.random() * 300));
    if(Math.random() < 0.6) luego(espera * (0.1 + Math.random() * 0.5), () => { const nt = $('#rxNotif'); if(nt){ nt.classList.add('show'); luego(1100, () => nt.classList.remove('show')); } });
  }
  luego(espera, () => {
    R.estado = 'ya'; zona.classList.add('ya'); $('#rxMsg').textContent = '¡TOCÁ!'; R.t0 = performance.now();
    if(R.ronda && Math.random() < 0.5) luego(40 + Math.random() * 90, () => parpadeo(260));
  });
}
function parpadeo(ms){ const b = $('#rxBlink'); if(!b) return; b.classList.add('on'); luego(ms, () => b.classList.remove('on')); }

function toque(){
  const zona = $('#rx'); if(!zona) return;
  if(R.estado === 'espera'){
    limpiar(); R.estado = 'pronto'; zona.classList.add('pronto');
    $('#rxMsg').textContent = '¡Muy pronto! Esperá a que se ponga amarillo.';
    luego(1300, esperar); return;
  }
  if(R.estado !== 'ya') return;
  const ms = Math.round(performance.now() - R.t0);
  R.tiempos[R.ronda].push(ms); R.estado = 'pausa'; zona.classList.remove('ya');
  $('#rxMsg').innerHTML = `<b>${ms} ms</b> · ${fmt(metros(ms))} m a ${VEL} km/h`;
  if(++R.i < N) luego(1100, esperar);
  else luego(1200, () => R.ronda ? final() : pausaRonda());
}

function pausaRonda(){
  limpiar();
  const p = prom(R.tiempos[0]);
  view.innerHTML = `<div class="gate-card welcome">${ic('check','xl')}<h1 style="font-size:1.5rem">Ronda 1: ${p} ms</h1>
    <p class="muted">A ${VEL} km/h recorrés <b>${fmt(metros(p))} metros</b> antes de empezar a frenar.</p>
    <p class="muted" style="margin-top:10px">Ahora la misma prueba con una <b>simulación de cansancio</b>: la luz se ve menos, hay parpadeos y alguna distracción.</p>
    <div class="actions" style="justify-content:center"><button class="btn primary lg" id="rx2">${ic('eyeoff')} RONDA 2</button></div></div>`;
  $('#rx2').onclick = () => ronda(1);
}

function final(){
  limpiar(); progress(100);
  const a = prom(R.tiempos[0]), b = prom(R.tiempos[1]), ma = metros(a), mb = metros(b), dif = Math.round((mb - ma) * 10) / 10;
  const max = Math.max(mb, ma, 1);
  view.innerHTML = `<div class="gate-card rx-fin">
    <p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Resultado</p>
    <h1>${dif > 0 ? `+${fmt(dif)} metros sin frenar` : 'Reaccionaste igual de rápido'}</h1>
    <p class="muted">Distancia que se recorre a ${VEL} km/h desde que aparece el peligro hasta que empezás a frenar.</p>
    <div class="rx-barras">
      <div><span>Atento</span><div class="rx-b"><i style="width:${ma / max * 100}%"></i></div><b>${a} ms · ${fmt(ma)} m</b></div>
      <div><span>Simulación de cansancio</span><div class="rx-b c"><i style="width:${mb / max * 100}%"></i></div><b>${b} ms · ${fmt(mb)} m</b></div>
    </div>
    ${fb('warn', 'Y eso es antes de frenar', 'A esa distancia se suma la de frenado del vehículo, que en un vehículo pesado es mayor. Con un microsueño de 3 segundos, a 100 km/h son 83 metros sin control.')}
    <div class="callout green" style="margin-top:14px">${ic('shield')} <span>Detenerse a tiempo también es seguridad.</span></div>
    <p class="sm dim" style="margin-top:12px">Demostración: no mide tu fatiga ni tu aptitud para manejar. No se guardó ningún dato.</p>
    <div class="actions" style="justify-content:center"><button class="btn ghost" id="rxOtra">${ic('refresh')} Probar de nuevo</button></div>
  </div>`;
  $('#rxOtra').onclick = intro;
}

initBrand(); intro();
