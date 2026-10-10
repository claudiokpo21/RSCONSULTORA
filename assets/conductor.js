'use strict';
/* conductor.js — «EL CONDUCTOR CANSADO»: dibujo interactivo de las señales de fatiga en el cuerpo.
   Se cambia entre «Descansado» y «Con fatiga» (párpados pesados, bostezos, cabeceos) y se toca cada
   parte del cuerpo para ver sus señales de alerta. Las señales salen del contenido de la capacitación.
   Se usa en el proyector (conductor.html?sala) o en el celular. No guarda ni envía datos.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
const SALA = document.documentElement.classList.contains('sala');

const ZONAS = [
  { id:'ojos', n:'Ojos', icon:'eyeoff', px:600, py:262,
    s:['Párpados pesados.', 'Dificultad para mantener los ojos abiertos.', 'Microsueños: los ojos se cierran unos segundos sin que te des cuenta.'],
    q:'A 100 km/h, 3 segundos con los ojos cerrados son 83 metros sin control.' },
  { id:'boca', n:'Boca', icon:'yawn', px:574, py:346,
    s:['Bostezos frecuentes, uno detrás de otro.'],
    q:'Un bostezo aislado no dice mucho; muchos seguidos, sí.' },
  { id:'cabeza', n:'Cabeza', icon:'brain', px:612, py:166,
    s:['Desconcentración.', 'Pensamiento lento.', 'Olvidar los últimos kilómetros recorridos.', 'No recordar señales o carteles.'],
    q:'¿Te pasó de llegar y no acordarte de un tramo del camino?' },
  { id:'cuello', n:'Cuello', icon:'moon', px:566, py:404,
    s:['Cabeceos: la cabeza se cae hacia adelante y se levanta de golpe.', 'Es una señal de microsueño: hay que detenerse ya.'],
    q:'Si cabeceaste una vez, el próximo puede ser más largo.' },
  { id:'espalda', n:'Espalda', icon:'move', px:700, py:470,
    s:['Necesidad constante de cambiar de posición en el asiento.', 'Incomodidad y tensión en hombros y espalda.'],
    q:'Acomodarse a cada rato es el cuerpo pidiendo una pausa.' },
  { id:'manos', n:'Manos y reacciones', icon:'lane', px:790, py:590,
    s:['Desvíos involuntarios del carril.', 'Reacciones más lentas.', 'Frenadas tardías.'],
    q:'Si el vehículo «se va» solo hacia la banquina, la fatiga ya está manejando.' }
];
const S = { cansado:false, vistas:new Set(), sel:null };

function dibujo(){
  const piel = '#d39b74', pielSombra = '#b97f5a', pelo = '#33241b';
  const ojo = (cx, k) => `<g clip-path="url(#cdOjo${k})"><ellipse cx="${cx}" cy="262" rx="19" ry="12" fill="#f4f1ea"/><circle cx="${cx}" cy="263" r="8" fill="#3b2a20"/><circle cx="${cx + 2}" cy="260" r="2.5" fill="#fff"/>
    <rect class="cd-lid" x="${cx - 22}" y="249" width="44" height="27" fill="${piel}"/></g>
    <ellipse cx="${cx}" cy="262" rx="19" ry="12" fill="none" stroke="#5a3a28" stroke-width="2"/>`;
  return `<svg class="cd-svg" viewBox="170 30 660 670" role="img" aria-label="Conductor sentado al volante">
  <defs>
    <clipPath id="cdOjo1"><ellipse cx="462" cy="262" rx="19" ry="12"/></clipPath>
    <clipPath id="cdOjo2"><ellipse cx="538" cy="262" rx="19" ry="12"/></clipPath>
    <linearGradient id="cdChaleco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc21f"/><stop offset="1" stop-color="#e0a300"/></linearGradient>
  </defs>
  <!-- cabina: luneta y asiento -->
  <rect x="190" y="40" width="620" height="230" rx="30" fill="#0e1622" stroke="#1f2833" stroke-width="4"/>
  <path d="M190 200 C330 180 670 180 810 200" stroke="#17202c" stroke-width="3" fill="none"/>
  <rect x="380" y="120" width="240" height="120" rx="40" fill="#1e252e"/>
  <path d="M270 700 V470 C270 380 330 350 500 350 C670 350 730 380 730 470 V700Z" fill="#1b2129" stroke="#262e38" stroke-width="3"/>
  <!-- torso con camisa y chaleco reflectivo -->
  <path d="M300 700 V500 C300 450 360 425 440 418 L560 418 C640 425 700 450 700 500 V700Z" fill="#2c3e57"/>
  <path d="M300 700 V500 C300 452 360 427 440 420 L470 420 L470 700Z" fill="url(#cdChaleco)"/>
  <path d="M700 700 V500 C700 452 640 427 560 420 L530 420 L530 700Z" fill="url(#cdChaleco)"/>
  <rect x="300" y="560" width="170" height="22" fill="#dfe4ea"/><rect x="530" y="560" width="170" height="22" fill="#dfe4ea"/>
  <rect x="300" y="610" width="170" height="22" fill="#dfe4ea"/><rect x="530" y="610" width="170" height="22" fill="#dfe4ea"/>
  <path d="M470 420 L500 470 L530 420" fill="#22324a" stroke="#1a2638" stroke-width="3"/>
  <!-- cuello -->
  <path d="M462 350 H538 V428 C520 440 480 440 462 428Z" fill="${pielSombra}"/>
  <!-- cabeza (se inclina con los cabeceos) -->
  <g class="cd-head">
    <ellipse cx="404" cy="282" rx="16" ry="26" fill="${piel}"/><ellipse cx="596" cy="282" rx="16" ry="26" fill="${piel}"/>
    <ellipse cx="500" cy="272" rx="96" ry="118" fill="${piel}"/>
    <path d="M404 250 C396 170 440 140 500 140 C566 140 608 170 598 252 C590 214 570 196 540 192 C500 204 450 196 430 190 C416 206 408 226 404 250Z" fill="${pelo}"/>
    <ellipse class="cd-shadow" cx="462" cy="282" rx="20" ry="7" fill="#7b4d58"/><ellipse class="cd-shadow" cx="538" cy="282" rx="20" ry="7" fill="#7b4d58"/>
    ${ojo(462, 1)}${ojo(538, 2)}
    <g class="cd-brows-ok" stroke="${pelo}" stroke-width="7" stroke-linecap="round" fill="none"><path d="M440 236 Q462 226 484 234"/><path d="M516 234 Q538 226 560 236"/></g>
    <g class="cd-brows-t" stroke="${pelo}" stroke-width="7" stroke-linecap="round" fill="none"><path d="M440 240 Q460 232 484 236"/><path d="M516 236 Q540 232 560 240"/></g>
    <path d="M500 270 C494 292 488 304 494 310 C498 313 506 313 510 310" fill="none" stroke="${pielSombra}" stroke-width="4" stroke-linecap="round"/>
    <path class="cd-mouth-ok" d="M472 340 Q500 352 528 340" fill="none" stroke="#7a3b32" stroke-width="5" stroke-linecap="round"/>
    <g class="cd-mouth-yawn"><ellipse cx="500" cy="348" rx="22" ry="27" fill="#4a1d20"/><ellipse cx="500" cy="364" rx="13" ry="7" fill="#c9575c"/></g>
    <text class="cd-zz" x="606" y="170" font-size="40" font-weight="900" fill="#f5b301">z</text>
    <text class="cd-zz b" x="630" y="132" font-size="54" font-weight="900" fill="#f5b301">Z</text>
  </g>
  <!-- brazos, manos y volante -->
  <path d="M330 450 C280 480 262 560 282 618" stroke="#2c3e57" stroke-width="58" stroke-linecap="round" fill="none"/>
  <path d="M670 450 C720 480 738 560 718 618" stroke="#2c3e57" stroke-width="58" stroke-linecap="round" fill="none"/>
  <ellipse cx="500" cy="660" rx="270" ry="74" fill="none" stroke="#090a0d" stroke-width="32"/>
  <ellipse cx="500" cy="660" rx="270" ry="74" fill="none" stroke="#2a313a" stroke-width="2" transform="translate(0 -15)"/>
  <path d="M440 640 L500 690 L560 640" stroke="#090a0d" stroke-width="26" fill="none" stroke-linejoin="round"/>
  <ellipse cx="286" cy="628" rx="34" ry="28" fill="${piel}"/><ellipse cx="714" cy="628" rx="34" ry="28" fill="${piel}"/>
  <path d="M262 626 h48 M264 638 h44" stroke="${pielSombra}" stroke-width="3"/><path d="M690 626 h48 M692 638 h44" stroke="${pielSombra}" stroke-width="3"/>
  <!-- zonas para tocar -->
  <g id="cdZonas">
    <ellipse class="cd-hit" data-id="cabeza" cx="500" cy="186" rx="104" ry="52" tabindex="0" role="button" aria-label="Cabeza"/>
    <rect class="cd-hit" data-id="ojos" x="430" y="238" width="140" height="48" rx="18" tabindex="0" role="button" aria-label="Ojos"/>
    <rect class="cd-hit" data-id="boca" x="452" y="318" width="96" height="60" rx="20" tabindex="0" role="button" aria-label="Boca"/>
    <rect class="cd-hit" data-id="cuello" x="450" y="384" width="100" height="44" rx="14" tabindex="0" role="button" aria-label="Cuello"/>
    <path class="cd-hit" data-id="espalda" d="M310 520 C310 460 370 438 440 432 L560 432 C630 438 690 460 690 520 L690 548 L310 548Z" tabindex="0" role="button" aria-label="Espalda y hombros"/>
    <rect class="cd-hit" data-id="manos" x="236" y="584" width="528" height="96" rx="40" tabindex="0" role="button" aria-label="Manos y reacciones"/>
  </g>
  <g id="cdPins">${ZONAS.map((z, i) => `<circle class="cd-pin" cx="${z.px}" cy="${z.py}" r="17"/><text class="cd-pin-t" x="${z.px}" y="${z.py + 6}" text-anchor="middle">${i + 1}</text>`).join('')}</g>
</svg>`;
}

function elegir(id){
  const z = ZONAS.find(x => x.id === id); if(!z) return;
  S.sel = id; S.vistas.add(id);
  if(!S.cansado) cambiar(true);
  pintar();
}
function cambiar(c){
  S.cansado = c;
  $('#cdStage').classList.toggle('cansado', c);
  $$('.cd-toggle button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.c === '1') === c)));
}
function pintar(){
  $$('.cd-hit').forEach(h => { h.classList.toggle('on', h.dataset.id === S.sel); h.classList.toggle('vis', S.vistas.has(h.dataset.id)); });
  $$('.cd-zonas .chip').forEach(c => { c.setAttribute('aria-pressed', String(c.dataset.id === S.sel)); c.classList.toggle('vis', S.vistas.has(c.dataset.id)); });
  const z = ZONAS.find(x => x.id === S.sel);
  $('#cdDet').innerHTML = z
    ? `<h3>${ic(z.icon)} ${esc(z.n)}</h3><ul>${z.s.map(t => `<li>${esc(t)}</li>`).join('')}</ul><p class="q">${esc(z.q)}</p>`
    : `<p class="muted">${ic('target')} Tocá una parte del cuerpo (o los números) para ver qué señales de fatiga aparecen ahí.</p>`;
  const todo = S.vistas.size === ZONAS.length;
  $('#cdCount').innerHTML = `${ic('check')} Viste ${S.vistas.size} de ${ZONAS.length} partes.`;
  $('#cdFin').innerHTML = todo ? fb('warn', 'No hace falta que aparezcan todas juntas', 'Cualquiera de estas señales indica que es momento de detenerse en un lugar seguro, comunicar y descansar.') : '';
}

function iniciar(){
  initBrand();
  view.innerHTML = `<div class="act-head"><div><p class="eyebrow">Actividad · señales de alerta</p><h1>EL CONDUCTOR CANSADO</h1>
      <p class="muted">La fatiga avisa antes de un microsueño. Pasá a <b>«Con fatiga»</b> y tocá cada parte del cuerpo para ver sus señales.</p></div></div>
    <div class="cd-layout">
      <div class="cd-stage" id="cdStage">${dibujo()}
        <div class="cd-toggle" role="group" aria-label="Estado del conductor"><button data-c="0" aria-pressed="true">Descansado</button><button data-c="1" aria-pressed="false">Con fatiga</button></div>
      </div>
      <aside class="panel cd-side">
        <div class="cd-zonas" role="group" aria-label="Partes del cuerpo">${ZONAS.map((z, i) => `<button class="chip" data-id="${z.id}" aria-pressed="false">${i + 1}. ${esc(z.n)}</button>`).join('')}</div>
        <div class="cd-det" id="cdDet" aria-live="polite"></div>
        <p class="hint sm muted" id="cdCount"></p>
        <div id="cdFin"></div>
        <p class="sm dim">Dibujo de demostración. No se guarda ningún dato.</p>
      </aside>
    </div>`;
  $$('.cd-hit').forEach(h => {
    h.addEventListener('click', () => elegir(h.dataset.id));
    h.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); elegir(h.dataset.id); } });
  });
  $$('.cd-zonas .chip').forEach(c => c.onclick = () => elegir(c.dataset.id));
  $$('.cd-toggle button').forEach(b => b.onclick = () => cambiar(b.dataset.c === '1'));
  pintar();
}
iniciar();
