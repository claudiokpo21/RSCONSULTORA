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
      <li>${ic('ruler')} <span>Al final vas a ver cuántos metros necesitarías para detenerte, en un liviano o en un pesado con carga.</span></li>
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

/* ---- Frenado aproximado: liviano o pesado con carga ----
   Distancia para detenerse = reacción (tu tiempo medido) + retardo de los frenos de aire (solo pesados) + frenado.
   Frenado = v² / (2 · a). Valores de referencia en piso seco:
   · liviano: a ≈ 6,5 m/s², deducido de las distancias de frenado típicas del Highway Code del Reino Unido [16];
   · pesado con carga: a ≈ 4,6 m/s² y 0,5 s de retardo de los frenos de aire, deducidos del manual modelo CDL de la AAMVA (EE. UU.) [17].
   Piso mojado: el frenado se duplica [16]. Son aproximaciones de manual, no un cálculo pericial. */
const FRENO = { liviano:{ a:6.5, lag:0, t:'Liviano' }, pesado:{ a:4.6, lag:.5, t:'Pesado con carga' } };
const F = { veh:'liviano', vel:100, piso:'seco' };
function detencion(ms){
  const v = F.vel / 3.6, k = FRENO[F.veh];
  const reac = v * ms / 1000, lag = v * k.lag, fren = v * v / (2 * k.a) * (F.piso === 'mojado' ? 2 : 1);
  return { reac, lag, fren, total:reac + lag + fren };
}
function chipsF(key, opts){ return `<div class="chips" role="group">${opts.map(([v, t]) => `<button class="chip" data-f="${key}" data-v="${v}" aria-pressed="${F[key] == v}">${t}</button>`).join('')}</div>`; }

function final(){
  limpiar(); progress(100);
  const a = prom(R.tiempos[0]), b = prom(R.tiempos[1]);
  const A = detencion(a), B = detencion(b), dif = Math.round((B.total - A.total) * 10) / 10, max = Math.max(A.total, B.total);
  const barra = (d, c) => `<div class="rx-stack${c ? ' c' : ''}"><i class="re" style="width:${d.reac / max * 100}%"></i>${d.lag ? `<i class="lg" style="width:${d.lag / max * 100}%"></i>` : ''}<i class="fr" style="width:${d.fren / max * 100}%"></i></div>`;
  view.innerHTML = `<div class="gate-card rx-fin">
    <p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Resultado</p>
    <h1>${dif > 0 ? `+${fmt(dif)} metros para detenerte` : 'Reaccionaste igual de rápido'}</h1>
    <p class="muted">Distancia total hasta detener el vehículo: lo que recorrés mientras reaccionás, más lo que tarda en frenar.</p>
    <div class="rx-opts">
      <div><span>Vehículo</span>${chipsF('veh', [['liviano', 'Liviano'], ['pesado', 'Pesado con carga']])}</div>
      <div><span>Velocidad</span>${chipsF('vel', [[60, '60 km/h'], [80, '80 km/h'], [100, '100 km/h']])}</div>
      <div><span>Piso</span>${chipsF('piso', [['seco', 'Seco'], ['mojado', 'Mojado']])}</div>
    </div>
    <div class="rx-barras rx-det">
      <div><span>Atento <small>${a} ms</small></span>${barra(A)}<b>${fmt(A.total)} m</b></div>
      <div><span>Simulación de cansancio <small>${b} ms</small></span>${barra(B, 1)}<b>${fmt(B.total)} m</b></div>
    </div>
    <div class="rx-ley"><span><i class="re"></i>Mientras reaccionás: ${fmt(A.reac)} m → ${fmt(B.reac)} m</span>${A.lag ? `<span><i class="lg"></i>Frenos de aire (0,5 s): ${fmt(A.lag)} m</span>` : ''}<span><i class="fr"></i>Frenando: ${fmt(A.fren)} m</span></div>
    ${fb('warn', 'La fatiga suma metros antes de tocar el freno', `El frenado es el mismo: lo que cambia es cuánto tardás en reaccionar. ${F.veh === 'pesado' ? 'Un pesado con carga necesita bastante más distancia para frenar que un liviano.' : 'Probá con «Pesado con carga» para comparar.'} Con un microsueño de 3 segundos, a ${F.vel} km/h son ${fmt(Math.round(F.vel / 3.6 * 3))} metros sin control.`)}
    <details class="rx-calc"><summary>${ic('info')} ¿Cómo se calcula?</summary>
      <ul>
        <li><b>Reacción:</b> velocidad × tu tiempo de reacción (lo que tardaste en tocar la pantalla). A ${F.vel} km/h el vehículo recorre ${fmt(Math.round(F.vel / 3.6 * 10) / 10)} metros por segundo.</li>
        <li><b>Frenado:</b> velocidad² ÷ (2 × desaceleración). Liviano: 6,5 m/s², tomado de las distancias de frenado típicas del Highway Code del Reino Unido <sup>[16]</sup>. Pesado con carga: 4,6 m/s² más 0,5 s de retardo de los frenos de aire, según el manual modelo de licencia profesional (CDL) de EE. UU. <sup>[17]</sup>.</li>
        <li><b>Piso mojado:</b> la distancia de frenado se duplica <sup>[16]</sup>.</li>
        <li><b>La segunda ronda es una simulación:</b> el juego achica la luz y agrega parpadeos y distracciones. No mide tu fatiga.</li>
        <li>Al volante el tiempo de reacción real es mayor que tocar una pantalla (hay que ver, decidir y mover el pie), así que en la ruta los metros serían más. Las distancias de frenado dependen del vehículo, las cubiertas, los frenos y la carga: son aproximaciones de manual.</li>
      </ul>
      <p class="sm dim">Fuentes en <a href="referencias.html" target="_blank" rel="noopener">Referencias</a> [16] y [17].</p>
    </details>
    <div class="callout green" style="margin-top:14px">${ic('shield')} <span>Detenerse a tiempo también es seguridad.</span></div>
    <p class="sm dim" style="margin-top:12px">Demostración: no mide tu fatiga ni tu aptitud para manejar. No se guardó ningún dato.</p>
    <div class="actions" style="justify-content:center"><button class="btn ghost" id="rxOtra">${ic('refresh')} Probar de nuevo</button></div>
  </div>`;
  $$('[data-f]').forEach(c => c.onclick = () => { const k = c.dataset.f; F[k] = k === 'vel' ? +c.dataset.v : c.dataset.v; const open = $('.rx-calc')?.open; final(); if(open) $('.rx-calc').open = true; });
  $('#rxOtra').onclick = intro;
}

initBrand(); intro();
