'use strict';
/* deuda.js — LA DEUDA DE SUEÑO (actividad interactiva). Curva ilustrativa; no guarda datos.
   RS Consultora · Fatiga y Conducción Segura */
(() => {

const $ = s => (document.querySelector(s)), $$ = s => [...document.querySelectorAll(s)];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const PRESETS = { extras:[7, 6, 6, 5.5, 5, 9, 9.5], rot:[6, 5.5, 5, 4.5, 6, 8.5, 7], ideal:[8, 8, 7.5, 8, 8, 8.5, 8] };
const S = { n:8, h:PRESETS.extras.slice() };
const X0 = 54, X1 = 750, Y0 = 30, Y1 = 380, HMAX = 11;
const yh = h => Y1 - (Y1 - Y0) * h / HMAX;
const col = i => X0 + (X1 - X0) * (i + .5) / 7, BW = (X1 - X0) / 7 * .56;
const f1 = n => (Math.round(n * 10) / 10).toLocaleString('es-AR');

function deudas(){ let d = 0; return S.h.map(h => (d = Math.max(0, d + (S.n - h)))); }

function barras(){
  const svg = $('#cv');
  const ticks = [0, 2, 4, 6, 8, 10].map(h => `<line x1="${X0}" x2="${X1}" y1="${yh(h)}" y2="${yh(h)}" stroke="#262e38"/><text x="${X0 - 12}" y="${yh(h) + 4}" text-anchor="end">${h} h</text>`).join('');
  const reco = `<rect x="${X0}" y="${yh(9)}" width="${X1 - X0}" height="${yh(7) - yh(9)}" fill="rgba(47,179,109,.16)"/>`;
  const nec = `<line x1="${X0}" x2="${X1}" y1="${yh(S.n)}" y2="${yh(S.n)}" stroke="#5fd497" stroke-width="2.5" stroke-dasharray="8 6"/>`;
  const bs = S.h.map((h, i) => {
    const x = col(i) - BW / 2, falta = Math.max(0, S.n - h);
    return `<g class="bar" data-i="${i}">
      <rect x="${x - 10}" y="${Y0}" width="${BW + 20}" height="${Y1 - Y0}" fill="transparent"/>
      ${falta ? `<rect x="${x}" y="${yh(S.n)}" width="${BW}" height="${yh(h) - yh(S.n)}" fill="rgba(229,72,77,.28)" stroke="#e5484d" stroke-width="2" stroke-dasharray="5 4" rx="4"/>` : ''}
      <rect x="${x}" y="${yh(h)}" width="${BW}" height="${Y1 - yh(h)}" rx="6" fill="#6b95e8"/>
      <rect x="${x}" y="${yh(h)}" width="${BW}" height="6" rx="3" fill="#a9c2f5"/>
      <text x="${col(i)}" y="${yh(Math.max(h, S.n)) - 10}" text-anchor="middle" fill="#f3f5f7" font-size="16" font-weight="800">${f1(h)} h</text>
      ${falta ? `<text x="${col(i)}" y="${(yh(S.n) + yh(h)) / 2 + 5}" text-anchor="middle" fill="#ffb4b6" font-size="13" font-weight="800">−${f1(falta)}</text>` : ''}
      <text x="${col(i)}" y="${Y1 + 26}" text-anchor="middle" fill="${i > 4 ? '#f5b301' : '#a5afba'}" font-size="14" font-weight="700">${DIAS[i]}</text></g>`;
  }).join('');
  svg.innerHTML = `<g class="axis">${ticks}</g>${reco}${nec}${bs}`;
}

function acumulado(){
  const d = deudas(), max = Math.max(10, Math.ceil(Math.max(...d) / 5) * 5);
  const x0 = 46, x1 = 505, y0 = 18, y1 = 200, xi = i => x0 + (x1 - x0) * i / 6, yd = v => y1 - (y1 - y0) * v / max;
  const grid = [0, max / 2, max].map(v => `<line x1="${x0}" x2="${x1}" y1="${yd(v)}" y2="${yd(v)}" stroke="#262e38"/><text x="${x0 - 8}" y="${yd(v) + 4}" text-anchor="end">${v} h</text>`).join('');
  const linea = d.map((v, i) => `${i ? 'L' : 'M'}${xi(i)} ${yd(v)}`).join(' ');
  const noche = S.n <= max ? `<line x1="${x0}" x2="${x1}" y1="${yd(S.n)}" y2="${yd(S.n)}" stroke="#e5484d" stroke-dasharray="6 5"/><text x="${x0 + 6}" y="${yd(S.n) - 6}" fill="#ff8a8d" font-size="12" font-weight="700">= una noche entera sin dormir</text>` : '';
  $('#cv2').innerHTML = `<defs><linearGradient id="ar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e5484d" stop-opacity=".45"/><stop offset="1" stop-color="#e5484d" stop-opacity=".03"/></linearGradient></defs>
    <g class="axis">${grid}${DIAS.map((t, i) => `<text x="${xi(i)}" y="${y1 + 24}" text-anchor="middle">${t}</text>`).join('')}</g>${noche}
    <path d="${linea} L${xi(6)} ${y1} L${xi(0)} ${y1} Z" fill="url(#ar)"/><path d="${linea}" fill="none" stroke="#ff7b7f" stroke-width="3.5" stroke-linejoin="round"/>
    ${d.map((v, i) => `<circle cx="${xi(i)}" cy="${yd(v)}" r="5.5" fill="#ff7b7f" stroke="#1a2028" stroke-width="2.5"/>`).join('')}`;
}

function resultado(){
  const d = deudas(), mx = Math.max(...d), vie = d[4], fin = d[6];
  const k = mx >= S.n ? 'bad' : mx >= 3 ? 'mid' : 'ok';
  const t = { bad:'Deuda alta', mid:'Deuda en aumento', ok:'Sin deuda importante' }[k];
  const noches = mx / S.n;
  let txt = mx >= S.n ? `El viernes llegás con ${f1(vie)} horas de sueño de menos: ${noches >= 1.5 ? 'más de una noche entera' : 'como una noche entera'} sin dormir.`
          : mx >= 3 ? `Llegaste a deber ${f1(mx)} horas: el cansancio se nota aunque no lo sientas.`
          : 'Dormiste cerca de lo que necesitás: el reloj del cuerpo trabaja a favor.';
  if(fin < vie - .4) txt += ` El fin de semana la deuda baja a ${f1(fin)} h en el papel, pero el cuerpo tarda más en recuperarse.`;
  $('#res').innerHTML = `<p class="eyebrow">Tu semana</p><div class="big"><b>${f1(mx)} h</b><span>de deuda máxima (el ${DIAS[d.indexOf(mx)].toLowerCase()})</span></div>
    <span class="pill ${k}" style="justify-self:start">${t}</span><p>${txt}</p>`;
}

function botones(){
  $('#steps').innerHTML = DIAS.map((t, i) => `<div><button class="mini" id="m${i}" data-i="${i}" data-d="-0.5" aria-label="Menos horas el ${t}">−</button><button class="mini" id="p${i}" data-i="${i}" data-d="0.5" aria-label="Más horas el ${t}">+</button></div>`).join('');
  $$('.mini').forEach(b => b.onclick = () => { const i = +b.dataset.i; S.h[i] = Math.max(2, Math.min(10.5, S.h[i] + +b.dataset.d)); sinPreset(); todo(); });
}
function sinPreset(){ $$('[data-p]').forEach(x => x.setAttribute('aria-pressed', 'false')); }
function todo(){ barras(); acumulado(); resultado(); $('#lgN').textContent = S.n; }

$$('[data-n]').forEach(c => c.onclick = () => { S.n = +c.dataset.n; $$('[data-n]').forEach(x => x.setAttribute('aria-pressed', String(x === c))); todo(); });
$$('[data-p]').forEach(c => c.onclick = () => { S.h = PRESETS[c.dataset.p].slice(); $$('[data-p]').forEach(x => x.setAttribute('aria-pressed', String(x === c))); todo(); });
// arrastrar las barras
const svg = $('#cv'); let drag = -1;
function poner(e){ const r = svg.getBoundingClientRect(), y = (e.clientY - r.top) / r.width * 760; S.h[drag] = Math.max(2, Math.min(10.5, Math.round((Y1 - y) / (Y1 - Y0) * HMAX * 2) / 2)); sinPreset(); todo(); }
svg.addEventListener('pointerdown', e => { const g = e.target.closest('.bar'); if(!g) return; drag = +g.dataset.i; svg.setPointerCapture(e.pointerId); poner(e); });
svg.addEventListener('pointermove', e => { if(drag >= 0) poner(e); });
['pointerup', 'pointercancel'].forEach(n => svg.addEventListener(n, () => { drag = -1; }));
botones(); todo();

})();
initBrand();
