'use strict';
/* riesgos.js — «ENCONTRÁ LOS RIESGOS»: dibujo interactivo de la cabina de un camión de noche.
   Hay 10 factores que favorecen la fatiga escondidos en la escena (y un cartel que es la solución).
   Se juega en grupo con el proyector (riesgos.html?sala) o cada uno en su celular.
   Los textos salen del contenido de la capacitación. No guarda ni envía datos.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
const SALA = document.documentElement.classList.contains('sala');

// x, y, w, h = zona que se puede tocar (en coordenadas del dibujo, 1000 × 640)
const RIESGOS = [
  { id:'reloj', x:608, y:446, w:144, h:54, icon:'clock', t:'Madrugada: 03:12',
    d:'La madrugada es uno de los períodos de mayor tendencia al sueño: el cuerpo, por su ritmo natural, se prepara para descansar.' },
  { id:'gps', x:604, y:324, w:182, h:110, icon:'route', t:'412 km y ninguna parada prevista',
    d:'Manejar muchas horas seguidas exige atención sostenida y, sin pausas, el rendimiento cae progresivamente. Las pausas se planifican antes de salir, en lugares seguros.' },
  { id:'celular', x:84, y:322, w:96, h:156, icon:'message', t:'Presión por llegar',
    d:'«¿Llegás a las 7?». La presión por los tiempos genera estrés y tienta a omitir pausas; además, mirar el celular es una distracción. Si el horario no da, se avisa.' },
  { id:'clima', x:608, y:504, w:144, h:56, icon:'thermo', t:'Calefacción al máximo',
    d:'Las temperaturas extremas dentro de la cabina aumentan el desgaste del organismo y la sensación de cansancio.' },
  { id:'radio', x:608, y:562, w:144, h:50, icon:'music', t:'Radio al máximo',
    d:'Subir el volumen no evita dormirse: la música fuerte no impide los microsueños y, además, puede distraer.' },
  { id:'lata', x:770, y:506, w:76, h:118, icon:'zap', t:'Energizante para «aguantar»',
    d:'La cafeína puede disimular el cansancio por un rato, pero no reemplaza el sueño. Cuando su efecto baja, la fatiga sigue ahí.' },
  { id:'comida', x:862, y:470, w:132, h:156, icon:'food', t:'Comida abundante',
    d:'Comer en exceso antes de manejar o durante el viaje puede provocar somnolencia. Mejor comidas livianas y a horario.' },
  { id:'pastillas', x:512, y:382, w:88, h:42, icon:'pill', t:'Medicamentos',
    d:'Ciertos medicamentos, como algunos antialérgicos, pueden producir somnolencia. Consultá al médico o farmacéutico y leé el prospecto antes de conducir.' },
  { id:'agua', x:198, y:380, w:150, h:46, icon:'droplet', t:'Botella de agua vacía',
    d:'No tomar suficiente agua afecta la concentración y aumenta la sensación de cansancio.' },
  { id:'ruta', x:390, y:292, w:220, h:66, icon:'road', t:'Ruta recta y monótona',
    d:'Rutas rectas, paisajes repetitivos y poco tránsito reducen los estímulos y favorecen la somnolencia.' }
];
const SOLUCION = { id:'parador', x:782, y:236, w:108, h:94, icon:'bed', t:'¡Esta es la solución!',
  d:'Un parador a 2 km. Detenerse en un lugar seguro, comunicar y descansar: ninguno de los «trucos» reemplaza el descanso.' };

const S = { hall:new Set(), sol:false, ultimo:null };

/* ---------------------------------------------------------------- DIBUJO */
function dash(){   // líneas discontinuas del centro de la ruta, en perspectiva
  let s = '';
  for(const [a, b] of [[303,307],[312,320],[328,342],[354,377],[393,428],[448,500]]){
    const wa = 1 + (a - 300) * .045, wb = 1 + (b - 300) * .045;
    s += `<polygon points="${500 - wa},${a} ${500 + wa},${a} ${500 + wb},${b} ${500 - wb},${b}" fill="#f5b301" opacity=".85"/>`;
  }
  return s;
}
function escena(){
  const estrellas = [[60,70],[140,120],[230,60],[300,150],[380,90],[620,110],[700,70],[760,160],[860,100],[930,60],[520,140],[460,60],[820,200],[180,200]]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.2 : 1.8}" fill="#cfd8e6" opacity="${.35 + (i % 4) * .15}"/>`).join('');
  const vol = [0,1,2,3,4,5,6,7].map(i => `<rect x="${662 + i * 9}" y="${598 - 6 - i * 2.4}" width="6" height="${6 + i * 2.4}" rx="1" fill="${i > 5 ? '#e5484d' : '#f5b301'}"/>`).join('');
  return `<svg class="rg-svg" viewBox="0 0 1000 640" role="img" aria-label="Cabina de un camión de noche, en una ruta recta">
  <defs>
    <linearGradient id="rgCielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060a14"/><stop offset="1" stop-color="#1a2a46"/></linearGradient>
    <linearGradient id="rgTablero" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232933"/><stop offset=".25" stop-color="#171b22"/><stop offset="1" stop-color="#0d1014"/></linearGradient>
    <radialGradient id="rgFaros" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff1c9" stop-opacity=".26"/><stop offset="1" stop-color="#fff1c9" stop-opacity="0"/></radialGradient>
    <radialGradient id="rgPantalla" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#1d3d63"/><stop offset="1" stop-color="#0c1a2c"/></radialGradient>
  </defs>
  <!-- cielo, campo y ruta -->
  <rect width="1000" height="420" fill="url(#rgCielo)"/>${estrellas}
  <circle cx="880" cy="96" r="20" fill="#e9e3c8" opacity=".85"/><circle cx="889" cy="90" r="18" fill="#0a1020" opacity=".9"/>
  <path d="M0 300 C120 286 220 296 330 290 C430 284 560 296 680 288 C800 282 900 294 1000 288 V430 H0Z" fill="#0b111b"/>
  <rect y="300" width="1000" height="130" fill="#0a0e15"/>
  <polygon points="494,300 506,300 860,470 140,470" fill="#22262d"/>
  <ellipse cx="500" cy="452" rx="330" ry="70" fill="url(#rgFaros)"/>
  <line x1="496" y1="300" x2="150" y2="470" stroke="#d9dee6" stroke-width="3" opacity=".55"/>
  <line x1="504" y1="300" x2="850" y2="470" stroke="#d9dee6" stroke-width="3" opacity=".55"/>
  ${dash()}
  <!-- cartel del parador -->
  <g>
    <rect x="833" y="290" width="5" height="44" fill="#6f7a86"/>
    <rect x="792" y="244" width="88" height="50" rx="5" fill="#1d7a46" stroke="#e9f5ee" stroke-width="2"/>
    <text x="836" y="264" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" letter-spacing="1">PARADOR</text>
    <text x="836" y="284" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">2 km →</text>
  </g>
  <!-- marco de la cabina y espejo -->
  <rect width="1000" height="46" fill="#0b0e12"/>
  <polygon points="0,40 64,40 138,432 0,432" fill="#0b0e12"/><polygon points="1000,40 936,40 862,432 1000,432" fill="#0b0e12"/>
  <rect x="496" y="40" width="8" height="14" fill="#151a20"/><rect x="436" y="52" width="128" height="34" rx="9" fill="#141920" stroke="#262d36" stroke-width="2"/>
  <rect x="444" y="58" width="112" height="22" rx="6" fill="#0d1a2b"/>
  <!-- tablero -->
  <path d="M0 432 C250 404 750 404 1000 432 V640 H0Z" fill="url(#rgTablero)"/>
  <path d="M0 432 C250 404 750 404 1000 432" fill="none" stroke="#2f3742" stroke-width="3"/>
  <!-- instrumentos -->
  <path d="M188 534 C188 452 230 444 380 444 C530 444 572 452 572 534Z" fill="#0a0d11"/>
  <circle cx="300" cy="484" r="32" fill="#0f1318" stroke="#3a4450" stroke-width="3"/><line x1="300" y1="484" x2="322" y2="466" stroke="#e5484d" stroke-width="3" stroke-linecap="round"/>
  <circle cx="460" cy="484" r="32" fill="#0f1318" stroke="#3a4450" stroke-width="3"/><line x1="460" y1="484" x2="440" y2="470" stroke="#e5484d" stroke-width="3" stroke-linecap="round"/>
  <circle cx="380" cy="474" r="5" fill="#2fb36d"/><circle cx="364" cy="474" r="5" fill="#f5b301" opacity=".7"/>
  <!-- volante -->
  <circle cx="380" cy="706" r="200" fill="none" stroke="#08090b" stroke-width="36"/>
  <circle cx="380" cy="706" r="218" fill="none" stroke="#1d222a" stroke-width="2"/>
  <path d="M232 640 L330 662 M528 640 L430 662" stroke="#0a0b0e" stroke-width="30" stroke-linecap="round"/>
  <circle cx="380" cy="672" r="62" fill="#0b0d10" stroke="#1d222a" stroke-width="2"/>
  <!-- consola central: reloj, clima y radio -->
  <rect x="600" y="438" width="160" height="210" rx="14" fill="#11151a" stroke="#262d36" stroke-width="2"/>
  <rect x="614" y="452" width="132" height="44" rx="6" fill="#050709"/>
  <text x="680" y="485" text-anchor="middle" font-size="31" font-weight="800" fill="#f5b301" font-family="ui-monospace,Consolas,monospace" letter-spacing="2">03:12</text>
  <circle cx="638" cy="532" r="17" fill="#2a1012" stroke="#e5484d" stroke-width="3"/><line x1="638" y1="532" x2="651" y2="523" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <text x="684" y="541" text-anchor="middle" font-size="22" font-weight="800" fill="#ff7b7f">28°</text>
  <g stroke="#ff7b7f" stroke-width="3" stroke-linecap="round"><line x1="718" y1="524" x2="740" y2="524"/><line x1="718" y1="532" x2="740" y2="532"/><line x1="718" y1="540" x2="740" y2="540"/></g>
  <rect x="614" y="568" width="132" height="38" rx="6" fill="#050709"/>
  <text x="624" y="593" font-size="12" font-weight="700" fill="#a5afba">VOL</text>${vol}
  <!-- GPS -->
  <rect x="686" y="426" width="20" height="14" fill="#151a20"/>
  <rect x="608" y="328" width="174" height="100" rx="10" fill="#0a0d11" stroke="#2f3742" stroke-width="2"/>
  <rect x="616" y="336" width="158" height="84" rx="6" fill="url(#rgPantalla)"/>
  <path d="M628 410 C650 392 640 372 670 366 C700 360 720 352 760 344" fill="none" stroke="#f5b301" stroke-width="4" stroke-linecap="round" opacity=".8"/>
  <text x="700" y="372" text-anchor="middle" font-size="21" font-weight="800" fill="#fff">412 km</text>
  <text x="700" y="392" text-anchor="middle" font-size="12" fill="#cfd8e6">Llegada 07:50</text>
  <text x="700" y="410" text-anchor="middle" font-size="12" font-weight="700" fill="#ff8a8d">Paradas: 0</text>
  <!-- celular en el soporte -->
  <rect x="122" y="470" width="12" height="14" fill="#151a20"/>
  <rect x="88" y="326" width="88" height="148" rx="12" fill="#07090c" stroke="#2f3742" stroke-width="2"/>
  <rect x="95" y="336" width="74" height="128" rx="7" fill="#12233a"/>
  <text x="132" y="356" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">03:12</text>
  <rect x="99" y="368" width="66" height="54" rx="7" fill="#eef2f6"/>
  <text x="105" y="384" font-size="10" font-weight="800" fill="#14181d">Jefe · 3</text>
  <text x="105" y="400" font-size="10" fill="#14181d">¿Llegás</text><text x="105" y="414" font-size="10" fill="#14181d">a las 7?</text>
  <circle cx="160" cy="370" r="9" fill="#e5484d"/><text x="160" y="374" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">3</text>
  <!-- botella vacía sobre el tablero -->
  <g transform="rotate(-6 270 404)">
    <rect x="206" y="392" width="112" height="26" rx="11" fill="#9fc6e8" opacity=".28" stroke="#cfe3f5" stroke-width="2"/>
    <rect x="318" y="398" width="22" height="14" rx="3" fill="#2f6fb3"/>
    <rect x="236" y="394" width="40" height="22" fill="#2f6fb3" opacity=".55"/>
  </g>
  <!-- pastillas -->
  <rect x="520" y="390" width="46" height="26" rx="4" fill="#e9edf2" stroke="#a5afba" stroke-width="1.5" transform="rotate(4 543 403)"/>
  ${[0,1,2].map(i => `<circle cx="${532 + i * 12}" cy="${400 + i * .8}" r="4" fill="#fff" stroke="#c9d1db"/><circle cx="${532 + i * 12}" cy="${410 + i * .8}" r="4" fill="${i ? '#fff' : '#e9edf2'}" stroke="#c9d1db"/>`).join('')}
  <rect x="566" y="394" width="28" height="22" rx="2" fill="#f2c94c"/><rect x="566" y="401" width="28" height="7" fill="#e5484d"/>
  <!-- lata de energizante en el portavasos -->
  <ellipse cx="808" cy="618" rx="40" ry="12" fill="#07090c"/>
  <rect x="784" y="520" width="48" height="96" rx="7" fill="#15181d" stroke="#3a4450" stroke-width="2"/>
  <ellipse cx="808" cy="522" rx="24" ry="6" fill="#a5afba"/>
  <path d="M812 540 L798 570 L810 570 L802 598 L822 562 L810 562 L818 540Z" fill="#f5b301"/>
  <!-- comida en el asiento del acompañante -->
  <path d="M870 640 L870 520 C900 500 980 500 1000 516 V640Z" fill="#1b2027"/>
  <path d="M880 500 L960 492 L972 600 L888 610Z" fill="#8a5a2b"/><path d="M880 500 L960 492 L962 512 L884 520Z" fill="#6e451f"/>
  <circle cx="924" cy="556" r="20" fill="#e5484d"/><text x="924" y="562" text-anchor="middle" font-size="15" font-weight="900" fill="#fff">XL</text>
  <ellipse cx="936" cy="618" rx="40" ry="12" fill="#e2a64a"/><rect x="896" y="604" width="80" height="10" fill="#5a3a1c"/><ellipse cx="936" cy="602" rx="40" ry="12" fill="#f0bd62"/>
  <rect x="972" y="560" width="8" height="40" rx="2" fill="#f2c94c" transform="rotate(14 976 580)"/><rect x="980" y="556" width="8" height="40" rx="2" fill="#f2c94c" transform="rotate(-8 984 576)"/>
  <!-- marcas y zonas para tocar -->
  <g id="rgMarcas"></g>
  <g id="rgZonas">${[...RIESGOS, SOLUCION].map(r => `<rect class="rg-hit" data-id="${r.id}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="12" tabindex="0" role="button" aria-label="Elemento de la escena"/>`).join('')}</g>
</svg>`;
}

/* ---------------------------------------------------------------- JUEGO */
function marca(r, n){
  const cx = r.x + r.w, cy = r.y;
  const sol = r.id === 'parador';
  return `<g class="rg-mark ${sol ? 'sol' : ''}" data-id="${r.id}"><rect x="${r.x - 4}" y="${r.y - 4}" width="${r.w + 8}" height="${r.h + 8}" rx="14"/>
    <circle cx="${cx}" cy="${cy}" r="17"/><text x="${cx}" y="${cy + 6}" text-anchor="middle">${sol ? '✓' : n}</text></g>`;
}
function tocar(id){
  if(id === 'parador'){
    S.sol = true; S.ultimo = SOLUCION; pintar(); return;
  }
  const r = RIESGOS.find(x => x.id === id); if(!r) return;
  S.hall.add(id); S.ultimo = r; pintar();
}
function pista(){
  const falta = RIESGOS.filter(r => !S.hall.has(r.id));
  const r = falta.length ? falta[Math.floor(Math.random() * falta.length)] : (!S.sol ? SOLUCION : null);
  if(!r) return;
  const g = $('#rgMarcas');
  g.insertAdjacentHTML('beforeend', `<rect class="rg-pista" x="${r.x - 30}" y="${r.y - 30}" width="${r.w + 60}" height="${r.h + 60}" rx="40"/>`);
  setTimeout(() => $$('.rg-pista').forEach(x => x.remove()), 2600);
}
function verTodos(){ RIESGOS.forEach(r => S.hall.add(r.id)); S.sol = true; S.ultimo = null; pintar(); }

function pintar(){
  const orden = RIESGOS.filter(r => S.hall.has(r.id));
  $('#rgMarcas').innerHTML = orden.map((r, i) => marca(r, i + 1)).join('') + (S.sol ? marca(SOLUCION) : '');
  const n = S.hall.size, total = RIESGOS.length, fin = n === total;
  $('#rgCount').innerHTML = `<b>${n}</b> de ${total} riesgos`;
  $('#rgBar').style.width = (n / total * 100) + '%';
  const u = S.ultimo;
  let det = u ? `<div class="rg-det ${u.id === 'parador' ? 'sol' : ''}">${ic(u.icon, 'lg')}<div><h3>${esc(u.t)}</h3><p>${esc(u.d)}</p></div></div>`
              : `<p class="muted">${ic('target')} Tocá en el dibujo cada cosa que favorece la fatiga.</p>`;
  if(fin && !S.sol) det += `<div class="rg-extra">${ic('info')} <span>¡Encontraste los ${total}! Hay algo más en el dibujo que <b>no</b> es un riesgo: es la solución. ¿Lo encontrás?</span></div>`;
  if(fin && S.sol) det += `<div class="callout green rg-fin">${ic('shield')} <span>Ningún truco reemplaza al descanso. Detenerse a tiempo también es seguridad.</span></div>`;
  $('#rgDet').innerHTML = det;
  $('#rgList').innerHTML = orden.map((r, i) => `<li><b>${i + 1}</b>${esc(r.t)}</li>`).join('');
  $('#rgPista').disabled = fin && S.sol;
}

function iniciar(){
  initBrand();
  view.innerHTML = `<div class="act-head">
      <div><p class="eyebrow">Actividad · ${SALA ? 'en grupo' : 'en tu celular'}</p><h1>ENCONTRÁ LOS RIESGOS</h1>
      <p class="muted">Son las 3 de la mañana y quedan 412 km. En esta cabina hay <b>${RIESGOS.length} cosas que favorecen la fatiga</b>. Tocá cada una.</p></div>
    </div>
    <div class="rg-layout">
      <div class="rg-stage">${escena()}</div>
      <p class="act-rot sm muted">${ic('refresh')} Girá el celular para ver el dibujo más grande.</p>
      <aside class="panel rg-side">
        <div class="rg-count"><span id="rgCount"></span><div class="rg-prog"><i id="rgBar"></i></div></div>
        <div id="rgDet" aria-live="polite"></div>
        <ol class="rg-list" id="rgList"></ol>
        <div class="actions">
          <button class="btn ghost sm" id="rgPista">${ic('eye')} Pista</button>
          ${SALA ? `<button class="btn ghost sm" id="rgTodos">${ic('check')} Mostrar todos</button>` : ''}
          <button class="btn ghost sm" id="rgReset">${ic('refresh')} Empezar de nuevo</button>
        </div>
        <p class="sm dim">Dibujo de demostración. No se guarda ningún dato.</p>
      </aside>
    </div>`;
  $$('.rg-hit').forEach(h => {
    h.addEventListener('click', () => tocar(h.dataset.id));
    h.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); tocar(h.dataset.id); } });
  });
  $('#rgPista').onclick = pista;
  $('#rgReset').onclick = () => { S.hall.clear(); S.sol = false; S.ultimo = null; pintar(); };
  if($('#rgTodos')) $('#rgTodos').onclick = verTodos;
  pintar();
}
iniciar();
