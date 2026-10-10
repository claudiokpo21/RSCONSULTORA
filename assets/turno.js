'use strict';
/* turno.js — TURNO NOCHE Y VUELTA A CASA (actividad interactiva). Curva ilustrativa; no guarda datos.
   RS Consultora · Fatiga y Conducción Segura */
(() => {

const $ = s => (document.querySelector(s)), $$ = s => [...document.querySelectorAll(s)];
const TURNOS = [{ id:'t22', t:'22 a 06', i:22, f:30 }, { id:'t20', t:'20 a 08', i:20, f:32 }, { id:'t00', t:'00 a 08', i:24, f:32 }];
const DESP = [7, 11, 15], VIAJES = [[.5, '30 min'], [1, '1 h'], [2, '2 h']];
const S = { turno:TURNOS[0], desp:7, viaje:1 };
// eje: desde las 06:00 del día 1 hasta las 18:00 del día 2 (36 h)
const T0 = 6, T1 = 42, X0 = 70, X1 = 985, Y0 = 52, Y1 = 290;
const xt = t => X0 + (X1 - X0) * (t - T0) / (T1 - T0);
const ya = a => Y1 - (Y1 - Y0) * a;
const hh = t => String(Math.floor(((t % 24) + 24) % 24)).padStart(2, '0') + ':' + String(Math.round((t % 1) * 60)).padStart(2, '0');

function dist(a, b){ const d = Math.abs(a - b) % 24; return Math.min(d, 24 - d); }
const g = (h, c, w) => Math.exp(-(dist(h, c) ** 2) / (2 * w * w));
const reloj = h => .76 - .55 * g(h, 4.2, 2.6) - .19 * g(h, 14.5, 1.35);       // mismo modelo que «El reloj del cuerpo»
function alerta(t){ const desp = t - S.desp; if(desp < 0) return null; return Math.max(.04, Math.min(.95, reloj(t % 24) - .02 * Math.max(0, desp - 14))); }

function chips(id, items, key, eq){
  $(id).innerHTML = items.map(([v, t], k) => `<button class="chip" id="${id.slice(1)}${k}" aria-pressed="${eq(v)}">${t}</button>`).join('');
  $$(id + ' .chip').forEach((c, k) => c.onclick = () => { S[key] = items[k][0]; $$(id + ' .chip').forEach(x => x.setAttribute('aria-pressed', String(x === c))); todo(); });
}

function dibujar(){
  const tu = S.turno, vi = tu.f, vf = tu.f + S.viaje, despierto = vf - S.desp;
  const noche = [[T0 - 4, 6], [20, 30], [44, 54]].map(([a, b]) => [Math.max(T0, a), Math.min(T1, b)]).filter(([a, b]) => b > a)
    .map(([a, b]) => `<rect x="${xt(a)}" y="${Y0 - 6}" width="${xt(b) - xt(a)}" height="${Y1 - Y0 + 6}" fill="#0a0f1c"/>`).join('');
  const mad = [26, 50].filter(c => c - 2 < T1).map(c => `<rect x="${xt(Math.max(T0, c))}" y="${Y0 - 6}" width="${xt(Math.min(T1, c + 4)) - xt(Math.max(T0, c))}" height="${Y1 - Y0 + 6}" fill="rgba(229,72,77,.18)"/>`).join('');
  let pts = []; for(let t = S.desp; t <= T1; t += .1) pts.push(`${xt(t).toFixed(1)} ${ya(alerta(t)).toFixed(1)}`);
  const linea = 'M' + pts.join(' L');
  const ticks = []; for(let t = 6; t <= 42; t += 3) ticks.push(`<line x1="${xt(t)}" x2="${xt(t)}" y1="${Y1}" y2="${Y1 + 6}" stroke="#4a5562"/><text x="${xt(t)}" y="${Y1 + 22}" text-anchor="middle">${hh(t)}</text>`);
  const dia = `<text x="${xt(6) + 4}" y="${Y1 + 42}" fill="#6f7a86" font-size="12" font-weight="700">DÍA 1</text><text x="${xt(24) + 4}" y="${Y1 + 42}" fill="#6f7a86" font-size="12" font-weight="700">DÍA 2</text><line x1="${xt(24)}" x2="${xt(24)}" y1="${Y0 - 6}" y2="${Y1 + 30}" stroke="#4a5562" stroke-dasharray="3 4"/>`;
  const turno = `<rect x="${xt(tu.i)}" y="${Y0 - 34}" width="${xt(tu.f) - xt(tu.i)}" height="22" rx="6" fill="rgba(107,149,232,.75)"/><text x="${(xt(tu.i) + xt(tu.f)) / 2}" y="${Y0 - 18}" text-anchor="middle" fill="#0f1216" font-size="13" font-weight="800">TURNO ${hh(tu.i)} a ${hh(tu.f)}</text>`;
  const viaje = `<rect x="${xt(vi)}" y="${Y0 - 6}" width="${xt(vf) - xt(vi)}" height="${Y1 - Y0 + 6}" fill="rgba(229,72,77,.35)" stroke="#e5484d" stroke-width="2"/>
    <rect x="${xt(vi)}" y="${Y0 - 34}" width="${Math.max(xt(vf) - xt(vi), 6)}" height="22" rx="6" fill="#e5484d"/>
    <text x="${xt(vf) + 8}" y="${Y0 - 18}" fill="#ff9a9d" font-size="13" font-weight="800">MANEJO A CASA</text>`;
  const sol = `<g transform="translate(${xt(S.desp)} ${ya(alerta(S.desp))})"><circle r="8" fill="#f5b301" stroke="#0f1216" stroke-width="3"/></g><text x="${xt(S.desp) + 12}" y="${ya(alerta(S.desp)) - 12}" fill="#f5b301" font-size="13" font-weight="800">Me levanto ${hh(S.desp)}</text>`;
  const am = alerta(vi + S.viaje / 2);
  const pv = `<circle cx="${xt(vi + S.viaje / 2)}" cy="${ya(am)}" r="9" fill="#e5484d" stroke="#0f1216" stroke-width="3"/>`;
  // regla de horas despierto
  const r0 = Y1 + 58, marca = (h, t) => S.desp + h <= T1 ? `<line x1="${xt(S.desp + h)}" x2="${xt(S.desp + h)}" y1="${r0 - 8}" y2="${r0 + 14}" stroke="#ff8a8d" stroke-width="2"/><text x="${xt(S.desp + h)}" y="${r0 + 30}" text-anchor="middle" fill="#ff8a8d" font-size="12" font-weight="700">${h} h despierto · ${t}</text>` : '';
  const regla = `<rect x="${xt(S.desp)}" y="${r0}" width="${xt(Math.min(T1, vf)) - xt(S.desp)}" height="6" rx="3" fill="rgba(245,179,1,.55)"/>${marca(17, '≈ 0,5 g/l')}${marca(24, '≈ 1 g/l')}`;
  $('#cv').innerHTML = `<rect x="${X0}" y="${Y0 - 6}" width="${X1 - X0}" height="${Y1 - Y0 + 6}" rx="8" fill="#1c2a42"/>${noche}${mad}
    <g class="axis">${ticks.join('')}</g>${dia}${turno}${viaje}
    <path d="${linea}" fill="none" stroke="#f5b301" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>${sol}${pv}${regla}
    <text x="${X0 - 10}" y="${Y0 + 8}" text-anchor="end" fill="#6f7a86" font-size="11.5" font-weight="700">MÁS</text><text x="${X0 - 10}" y="${Y0 + 22}" text-anchor="end" fill="#6f7a86" font-size="11.5" font-weight="700">ALERTA</text>
    <text x="${X0 - 10}" y="${Y1 - 16}" text-anchor="end" fill="#6f7a86" font-size="11.5" font-weight="700">MÁS</text><text x="${X0 - 10}" y="${Y1 - 2}" text-anchor="end" fill="#6f7a86" font-size="11.5" font-weight="700">SUEÑO</text>`;
  return { vi, vf, despierto, am };
}

function resultado({ vi, vf, despierto }){
  const k = despierto >= 17 ? 'bad' : 'mid';
  const eq = despierto >= 24 ? 'como manejar con alrededor de 1 g/l de alcohol en sangre' : despierto >= 17 ? 'como manejar con más de 0,5 g/l de alcohol en sangre' : 'todavía por debajo de las 17 horas, pero en el horario de más sueño';
  const madr = (vi % 24) < 9 ? ' Y el viaje cae al final de la madrugada, cuando el cuerpo está en su punto más bajo.' : '';
  $('#res').innerHTML = `<p class="eyebrow">Tu vuelta a casa</p>
    <div class="big"><b>${Math.round(despierto * 10) / 10} h</b><span>despierto al llegar (${hh(vi)} a ${hh(vf)})</span></div>
    <span class="pill ${k}" style="justify-self:start">${despierto >= 17 ? 'Riesgo alto' : 'Riesgo medio'}</span>
    <p>Manejar después de ${Math.round(despierto)} horas sin dormir es ${eq} <sup class="ref">[10]</sup>.${madr}</p>
    <p>Levantarte más tarde o descansar antes del turno achica ese número: probá «Me levanté a las 15:00».</p>`;
}

function todo(){ resultado(dibujar()); }
chips('#cTurno', TURNOS.map(t => [t, t.t]), 'turno', v => v === S.turno);
chips('#cDesp', DESP.map(h => [h, hh(h)]), 'desp', v => v === S.desp);
chips('#cViaje', VIAJES, 'viaje', v => v === S.viaje);
todo();

})();
initBrand();
