'use strict';
/* reloj.js — EL RELOJ DEL CUERPO (actividad interactiva). Curva ilustrativa; no guarda datos.
   RS Consultora · Fatiga y Conducción Segura */
(() => {

const $ = s => (document.querySelector(s)), $$ = s => [...document.querySelectorAll(s)];
const S = { h:14.5, comida:'liviano', sueno:'bien', salida:13, dura:4 };
const BANDAS = [[2, 6, 'MADRUGADA'], [13, 16, 'DESPUÉS DEL ALMUERZO']];
const X0 = 70, X1 = 980, Y0 = 46, Y1 = 316;            // área del gráfico
const xh = h => X0 + (X1 - X0) * h / 24;
const ya = a => Y1 - (Y1 - Y0) * a;

// Nivel de alerta (0 a 1), modelo ilustrativo: caída grande en la madrugada y otra menor al comienzo de la tarde.
function dist(a, b){ const d = Math.abs(a - b) % 24; return Math.min(d, 24 - d); }
const g = (h, c, w) => Math.exp(-(dist(h, c) ** 2) / (2 * w * w));
function alerta(h, st = S){
  const poco = st.sueno === 'poco', abund = st.comida === 'abundante';
  let a = .76 - (poco ? .09 : 0);
  a -= (poco ? .6 : .55) * g(h, 4.2, 2.6);
  a -= (abund ? .33 : .19) * g(h, 14.5, abund ? 1.6 : 1.35);
  return Math.max(.05, Math.min(.95, a));
}
function nivel(a){ return a >= .64 ? ['ok', 'Alerta alta'] : a >= .5 ? ['mid', 'Alerta media'] : ['bad', 'Somnolencia: más riesgo']; }
const fmt = h => { const hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60); return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };

const TEXTOS = [
  [0, 2,   'Noche', 'El cuerpo se prepara para dormir: sube la melatonina, la hormona que favorece el sueño, y la alerta empieza a caer.'],
  [2, 6,   'Madrugada', 'Es el punto más bajo de alerta del día y la temperatura del cuerpo llega a su mínimo. Aunque hayas dormido, es la franja de mayor riesgo de microsueño.'],
  [6, 9,   'Despertar', 'La alerta sube con la luz del día. Recién despierto, el cuerpo tarda unos minutos en «arrancar»: no conviene salir apurado.'],
  [9, 13,  'Mañana', 'Buen nivel de alerta para la mayoría de las personas. Si dormiste poco, el cansancio se nota igual.'],
  [13, 16, 'Después del almuerzo', 'El reloj interno baja la alerta: es el «bajón de la tarde». Una comida abundante lo hace más fuerte.'],
  [16, 21, 'Tarde y anochecer', 'La alerta vuelve a subir. Ojo con el final de jornadas largas: el cansancio acumulado se suma.'],
  [21, 24, 'Noche', 'La alerta baja de a poco. Manejar a esta hora después de un día completo de trabajo suma riesgo.']
];

/* ---------- dibujo ---------- */
function dibujar(){
  const svg = $('#cv');
  // fondo del cielo según la hora
  const cielo = [[0,'#0b1020'],[4,'#0a0f1c'],[6,'#2a2440'],[7.5,'#3d4f73'],[12,'#33507a'],[17,'#3a4a6e'],[19.5,'#3a2b45'],[21,'#121a2e'],[24,'#0b1020']]
    .map(([h, c]) => `<stop offset="${(h / 24).toFixed(3)}" stop-color="${c}"/>`).join('');
  let pts = [];
  for(let i = 0; i <= 240; i++){ const h = i / 10; pts.push([xh(h), ya(alerta(h))]); }
  const linea = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const area = linea + ` L${X1} ${Y1} L${X0} ${Y1} Z`;
  const ticks = [0,3,6,9,12,15,18,21,24].map(h => `<line x1="${xh(h)}" x2="${xh(h)}" y1="${Y1}" y2="${Y1 + 6}" stroke="#4a5562"/><text x="${xh(h)}" y="${Y1 + 24}" text-anchor="middle">${String(h % 24 === 0 && h ? 24 : h).padStart(2,'0')} h</text>`).join('');
  const bandas = BANDAS.map(([a, b, t]) => `<rect x="${xh(a)}" y="${Y0 - 6}" width="${xh(b) - xh(a)}" height="${Y1 - Y0 + 6}" fill="rgba(229,72,77,.2)"/>
    <line x1="${xh(a)}" x2="${xh(a)}" y1="${Y0 - 6}" y2="${Y1}" stroke="rgba(229,72,77,.55)" stroke-dasharray="4 5"/><line x1="${xh(b)}" x2="${xh(b)}" y1="${Y0 - 6}" y2="${Y1}" stroke="rgba(229,72,77,.55)" stroke-dasharray="4 5"/>
    <text class="band-t" x="${(xh(a) + xh(b)) / 2}" y="${Y0 + 12}" text-anchor="middle" fill="#ff9a9d">${t}</text>`).join('');
  // viaje
  const segs = []; let ini = S.salida, fin = S.salida + S.dura;
  if(fin <= 24) segs.push([ini, fin]); else { segs.push([ini, 24]); segs.push([0, fin - 24]); }
  const viaje = segs.map(([a, b]) => `<rect x="${xh(a)}" y="${Y1 + 34}" width="${Math.max(2, xh(b) - xh(a))}" height="12" rx="6" fill="rgba(107,149,232,.85)"/>`).join('')
    + `<text x="${xh(ini)}" y="${Y1 + 62}" fill="#9db8f0" font-size="12.5" font-weight="700">${fmt(ini)} → ${fmt(fin % 24)}</text>`;
  // cursor
  const a = alerta(S.h), [k] = nivel(a), col = { ok:'#2fb36d', mid:'#f5b301', bad:'#e5484d' }[k];
  const cx = xh(S.h), cy = ya(a);
  // sol y luna
  const sol = `<g transform="translate(${xh(12)} 22)"><circle r="9" fill="#f5b301"/>${[0,45,90,135,180,225,270,315].map(d => `<line x1="0" y1="-13" x2="0" y2="-17" stroke="#f5b301" stroke-width="2" stroke-linecap="round" transform="rotate(${d})"/>`).join('')}</g>`;
  const luna = h => `<g transform="translate(${xh(h)} 22)"><circle r="9" fill="#d8d3bd"/><circle r="8" cx="4" cy="-3" fill="#141920"/></g>`;
  svg.innerHTML = `<title id="cvT">Curva del nivel de alerta a lo largo del día, con dos franjas de mayor somnolencia: la madrugada y el comienzo de la tarde</title>
    <defs><linearGradient id="cielo" x1="0" x2="1" y1="0" y2="0">${cielo}</linearGradient>
      <linearGradient id="relleno" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f5b301" stop-opacity=".38"/><stop offset="1" stop-color="#f5b301" stop-opacity=".03"/></linearGradient></defs>
    <rect x="${X0}" y="${Y0 - 6}" width="${X1 - X0}" height="${Y1 - Y0 + 6}" rx="8" fill="url(#cielo)"/>
    ${bandas}
    <path d="${area}" fill="url(#relleno)"/>
    <path d="${linea}" fill="none" stroke="#f5b301" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <g class="axis">${ticks}</g>
    <text class="ylab" x="${X0 - 10}" y="${Y0 + 4}" text-anchor="end">MÁS</text><text class="ylab" x="${X0 - 10}" y="${Y0 + 20}" text-anchor="end">ALERTA</text>
    <text class="ylab" x="${X0 - 10}" y="${Y1 - 18}" text-anchor="end">MÁS</text><text class="ylab" x="${X0 - 10}" y="${Y1 - 2}" text-anchor="end">SUEÑO</text>
    ${luna(1.2)}${sol}${luna(22.8)}
    ${viaje}
    <line x1="${cx}" x2="${cx}" y1="${Y0 - 6}" y2="${Y1}" stroke="#f3f5f7" stroke-width="2" stroke-dasharray="2 4"/>
    <circle cx="${cx}" cy="${cy}" r="16" fill="${col}" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="9" fill="${col}" stroke="#0f1216" stroke-width="3"/>
    <g transform="translate(${Math.min(Math.max(cx, X0 + 40), X1 - 40)} ${Math.max(Y0 + 40, cy - 30)})"><rect x="-38" y="-17" width="76" height="26" rx="8" fill="#0f1216" stroke="${col}" stroke-width="2"/><text x="0" y="2" text-anchor="middle" fill="#f3f5f7" font-size="15" font-weight="800" style="font-variant-numeric:tabular-nums">${fmt(S.h)}</text></g>`;
}

function panelHora(){
  const a = alerta(S.h), [k, t] = nivel(a), tx = TEXTOS.find(([i, f]) => S.h >= i && S.h < f);
  let extra = '';
  if(S.h >= 13 && S.h < 16 && S.comida === 'abundante') extra = '<p><b style="color:#ffb4b6">Con un almuerzo abundante</b>, el bajón se hace más profundo y dura más.</p>';
  if(S.sueno === 'poco') extra += '<p><b style="color:#ffb4b6">Dormiste poco:</b> toda la curva baja. La deuda de sueño se suma al reloj.</p>';
  $('#now').innerHTML = `<p class="eyebrow">A esta hora</p><div class="hh"><b>${fmt(S.h)}</b><span class="pill ${k}">${t}</span></div><h3>${tx[2]}</h3><p>${tx[3]}</p>${extra}`;
}

function panelViaje(){
  const horas = []; for(let x = S.salida; x < S.salida + S.dura; x += .25) horas.push(x % 24);
  const mad = horas.some(h => h >= 2 && h < 6), tar = horas.some(h => h >= 13 && h < 16);
  const min = Math.min(...horas.map(h => alerta(h)));
  const m = [];
  if(mad) m.push(['bad', 'Madrugada', 'El viaje pasa entre las 2 y las 6: la franja de mayor somnolencia del día. Si se puede, cambiá el horario.']);
  if(tar) m.push(['mid', 'Después del almuerzo', `El viaje pasa por el bajón de la tarde${S.comida === 'abundante' ? ', y con un almuerzo abundante es más fuerte' : ''}. Comé liviano y planificá una pausa.`]);
  if(!mad && !tar) m.push(['ok', 'Buen horario', 'El viaje evita las dos franjas de mayor somnolencia. Igual hay que planificar pausas.']);
  if(S.sueno === 'poco') m.push(['bad', 'Dormiste poco', 'Con poco sueño, cualquier horario es más riesgoso: descansá antes de salir.']);
  if(S.dura >= 4) m.push(['mid', 'Viaje largo', 'Pausas regulares en lugares seguros, según la política de la empresa.']);
  $('#trip').innerHTML = m.map(([k, t, d]) => `<div class="msg ${k}"><b>${t}.</b><span>${d}</span></div>`).join('');
}

function todo(){ dibujar(); panelHora(); panelViaje(); }

/* ---------- controles ---------- */
const salidas = [5, 8, 13, 18, 22], duraciones = [2, 4, 6, 8];
const filas = $$('.ctrl .row .chips');
filas[2].innerHTML = salidas.map(h => `<button class="chip" id="sal${h}" data-g="salida" data-v="${h}" aria-pressed="${h === S.salida}">${String(h).padStart(2,'0')}:00</button>`).join('');
filas[3].innerHTML = duraciones.map(h => `<button class="chip" id="dur${h}" data-g="dura" data-v="${h}" aria-pressed="${h === S.dura}">${h} h</button>`).join('');
$$('.chip').forEach(c => c.addEventListener('click', () => {
  const gr = c.dataset.g; S[gr] = isNaN(+c.dataset.v) ? c.dataset.v : +c.dataset.v;
  $$(`.chip[data-g="${gr}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === c)));
  if(gr === 'salida'){ S.h = S.salida; $('#hora').value = S.h; }
  todo();
}));
$('#hora').addEventListener('input', e => { S.h = +e.target.value; dibujar(); panelHora(); });
const svg = $('#cv');
function desdePuntero(e){
  const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 1000;
  S.h = Math.max(0, Math.min(23.75, Math.round((x - X0) / (X1 - X0) * 24 * 4) / 4));
  $('#hora').value = S.h; dibujar(); panelHora();
}
let arrastrando = false;
svg.addEventListener('pointerdown', e => { arrastrando = true; svg.setPointerCapture(e.pointerId); desdePuntero(e); });
svg.addEventListener('pointermove', e => { if(arrastrando) desdePuntero(e); });
['pointerup', 'pointercancel'].forEach(n => svg.addEventListener(n, () => { arrastrando = false; }));
todo();

})();
initBrand();
