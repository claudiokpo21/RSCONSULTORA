'use strict';
/* capacitacion.js — MODO PRESENTACIÓN (proyección grupal, sin registro)
   RS Consultora · Fatiga y Conducción Segura */

/* =====================================================================
   e) PANTALLAS
   Cada pantalla: { mod: módulo, html(): marcado, init(root): interacción }
   ===================================================================== */
const SLIDES = [
/* 1 — PORTADA */
{ mod:'Inicio', html(){
  const o = CONFIG.organizacion;
  const meta = [ o.fecha && `${ic('calendar')} ${esc(o.fecha)}`,
                 o.duracion && `${ic('clock')} ${esc(o.duracion)}`, o.sector && `${ic('building')} ${esc(o.sector)}` ].filter(Boolean);
  return `<div class="cover">
    <div>
      <span class="cover-tag">${ic('shield')} ${esc(CONFIG.consultora.nombre)} · Seguridad vial laboral</span>
      <h1 class="cover-title">FATIGA Y<br><span>CONDUCCIÓN SEGURA</span></h1>
      <p class="cover-sub">Vehículos livianos y pesados</p>
      <p class="muted" style="margin-bottom:22px">Capacitación de Higiene y Seguridad${o.empresa ? ' · ' + esc(o.empresa) : ''}</p>
      ${meta.length ? `<div class="cover-meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>` : ''}
      <button class="btn primary lg" id="startBtn">${ic('play')} COMENZAR CAPACITACIÓN</button>
      ${instructorCard('Dicta la capacitación')}
    </div>
    <div class="cover-art">${ART_ROAD}</div>
  </div>`; },
  init(r){ $('#startBtn', r).onclick = () => go(1); } },

/* 2 — OBJETIVOS */
{ mod:'Introducción', html(){
  return `${head('Introducción','Objetivos de la capacitación','Al finalizar, vas a poder:')}
  <div class="grid g3">${CONTENT.objetivos.map((o,i) => `
    <button class="card obj" aria-pressed="false"><span class="obj-n">${pad(i+1)}</span>${ic(o.icon,'lg')}<strong>${o.t}</strong><span class="muted sm">${o.d}</span><span class="obj-check">${ic('check')}</span></button>`).join('')}
  </div>
  <p class="hint">${ic('info')} Tocá cada objetivo para marcarlo como revisado.</p>
  ${pledgeHTML()}`; },
  init(r){ $$('.obj', r).forEach(b => b.onclick = () => toggleBtn(b)); } },

/* 3 — ¿QUÉ ES LA FATIGA? */
{ mod:'Módulo 1 · Conceptos', html(){
  return `${head('Módulo 1 · Conceptos','¿Qué es la fatiga?')}
  <blockquote class="definition">La fatiga es un estado de cansancio físico y/o mental que disminuye la capacidad de una persona para realizar una tarea de manera segura.</blockquote>
  <div class="split">
    <div><h3 class="h3">Puede producir</h3><ul class="checklist warn">${CONTENT.efectos.map(e => `<li>${ic('alert')}${e}</li>`).join('')}</ul></div>
    <div class="panel">
      <div class="seg" role="group" aria-label="Comparar conductor">
        <button class="seg-btn" data-m="ok" aria-pressed="true">Conductor descansado</button>
        <button class="seg-btn" data-m="bad" aria-pressed="false">Conductor fatigado</button>
      </div>
      <div class="driver-viz" id="driverViz" data-mode="ok">
        <div class="driver-state"><span class="ds-ok">${ic('eye','xl')} Alerta y atento</span><span class="ds-bad">${ic('eyeoff','xl')} Capacidades disminuidas</span></div>
        ${CONTENT.medidores.map(m => `<div class="meter"><span>${m.t}</span><div class="bar"><i style="--ok:${m.ok}%;--bad:${m.bad}%"></i></div></div>`).join('')}
      </div>
      <p class="sm dim" style="margin-top:12px">Representación ilustrativa: no corresponde a mediciones reales.</p>
    </div>
  </div>`; },
  init(r){
    const viz = $('#driverViz', r), btns = $$('.seg-btn', r);
    btns.forEach(b => b.onclick = () => { btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); viz.dataset.mode = b.dataset.m; });
    if(!REDUCED) setTimeout(() => { if(viz.isConnected && !State.ui.s3){ State.ui.s3 = 1; btns[1].click(); } }, 1600);
  } },

/* 4 — CANSANCIO / FATIGA / SOMNOLENCIA */
{ mod:'Módulo 1 · Conceptos', html(){
  const C = CONTENT.conceptos;
  return `${head('Módulo 1 · Conceptos','Fatiga, cansancio y somnolencia','Son conceptos relacionados pero distintos. Tocá cada uno para compararlos.')}
  <div class="tabs" role="tablist">${Object.keys(C).map((k,i) => `
    <button class="tab" role="tab" id="tab-${k}" aria-selected="${i===0}" aria-controls="conceptPanel" data-k="${k}" style="--c:${C[k].c};--cs:${C[k].cs}">${ic(C[k].icon)}${C[k].nombre}<small>${C[k].nivelTxt}</small></button>`).join('')}
  </div>
  <div class="panel" id="conceptPanel" role="tabpanel"></div>
  ${fb('warn','Importante','La somnolencia puede llevar a microsueños y a una pérdida momentánea de la conciencia del entorno mientras el vehículo sigue en movimiento.')}`; },
  init(r){
    const C = CONTENT.conceptos, panel = $('#conceptPanel', r);
    const show = k => {
      const c = C[k];
      $$('.tab', r).forEach(t => t.setAttribute('aria-selected', String(t.dataset.k === k)));
      panel.style.setProperty('--c', c.c);
      panel.setAttribute('aria-labelledby', 'tab-' + k);
      panel.innerHTML = `<div class="concept-body">
        <div><h4>Definición</h4><p>${c.def}</p></div>
        <div><h4>Ejemplos</h4><ul>${c.ej.map(e => `<li>${e}</li>`).join('')}</ul></div>
        <div><h4>Riesgo para la conducción</h4><div class="level" aria-hidden="true">${[1,2,3,4].map(n => `<i class="${n<=c.nivel?'on':''}"></i>`).join('')}</div><p>${c.riesgo}</p></div>
      </div>`;
    };
    $$('.tab', r).forEach(t => t.onclick = () => show(t.dataset.k));
    show('cansancio');
  } },

/* 5 — FACTORES DE RIESGO */
{ mod:'Módulo 2 · Causas', html(){
  return `${head('Módulo 2 · Causas','¿Por qué aparece la fatiga?','Seleccioná cada factor para conocer cómo influye.')}
  <div class="factor-layout">
    <div class="grid g-auto">${CONTENT.factores.map((f,i) => `<button class="card factor" data-i="${i}" aria-pressed="false">${ic(f.icon)}<span>${f.t}</span></button>`).join('')}</div>
    <aside class="panel detail" id="factorDetail" aria-live="polite"><p class="muted">${ic('info')} Seleccioná un factor para ver la explicación.</p></aside>
  </div>
  <p class="hint" id="factorCount"></p>`; },
  init(r){
    const seen = State.ui.factores = State.ui.factores || new Set();
    const count = () => $('#factorCount', r).innerHTML = `${ic('check')} Exploraste ${seen.size} de ${CONTENT.factores.length} factores.`;
    $$('.factor', r).forEach(b => { if(seen.has(+b.dataset.i)) b.classList.add('visited');
      b.onclick = () => {
        const f = CONTENT.factores[+b.dataset.i];
        $$('.factor', r).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        b.classList.add('visited'); seen.add(+b.dataset.i); count();
        $('#factorDetail', r).innerHTML = `${ic(f.icon,'xl')}<h3>${f.t}</h3><p>${f.d}</p>`;
      }; });
    count();
  } },

/* 6 — SUEÑO Y CONDUCCIÓN */
{ mod:'Módulo 2 · Causas', html(){
  const n = CONTENT.cadena.length;
  return `${head('Módulo 2 · Causas','El sueño y la conducción','El descanso es la base de la capacidad de atención. Cuando falta, se desencadena una cadena de efectos:')}
  <div class="chain" id="chain">${CONTENT.cadena.map((c,i) => `
    <div class="chain-step" style="--d:${i};${c.c ? '--c:'+c.c : ''}">${ic(c.icon)}<span>${c.t}</span></div>${i < n-1 ? `<div class="chain-arrow" style="--d:${i}" aria-hidden="true">→</div>` : ''}`).join('')}
  </div>
  <div class="actions"><button class="btn ghost sm" id="replay">${ic('refresh')} Repetir animación</button></div>
  <div class="callout">${ic('bed')} <span>Dormir no es una pérdida de tiempo: es una medida de seguridad.</span></div>
  <div class="grid g3" style="margin-top:18px">
    <div class="card">${ic('moon','lg')}<h3 class="h3" style="margin-top:10px">El sueño se recupera durmiendo</h3><p class="muted sm">Café, energizantes, aire fresco o música no reemplazan el descanso.</p></div>
    <div class="card">${ic('bed','lg')}<h3 class="h3" style="margin-top:10px">La calidad también importa</h3><p class="muted sm">Un ambiente oscuro, silencioso y sin interrupciones favorece un descanso reparador.</p></div>
    <div class="card">${ic('message','lg')}<h3 class="h3" style="margin-top:10px">Si no descansaste, avisá</h3><p class="muted sm">Informarlo antes de salir permite reorganizar la tarea de forma segura.</p></div>
  </div>`; },
  init(r){ $('#replay', r).onclick = () => { const c = $('#chain', r); const h = c.innerHTML; c.innerHTML = ''; void c.offsetWidth; c.innerHTML = h; }; } },

/* 7 — MOMENTOS DE MAYOR RIESGO */
{ mod:'Módulo 2 · Causas', html(){
  const F = CONTENT.franjas;
  return `${head('Módulo 2 · Causas','Momentos de mayor riesgo','Nuestro "reloj interno" (ritmo circadiano) hace que el estado de alerta varíe a lo largo del día. Seleccioná los períodos que considerás de mayor riesgo y verificá.')}
  <div class="timeline" role="group" aria-label="Franjas horarias del día">${F.map(f => `
    <button class="tl-seg ${f.night ? 'night' : ''}" style="flex:${f.span}" data-id="${f.id}" aria-pressed="false"><span class="tl-h">${f.h}</span><strong>${f.t}</strong></button>`).join('')}
  </div>
  <div class="tl-scale" aria-hidden="true"><span style="left:0">00 h</span><span style="left:25%">06 h</span><span style="left:50%">12 h</span><span style="left:75%">18 h</span><span style="left:100%">24 h</span></div>
  <button class="chip-toggle" data-id="fin" aria-pressed="false">${ic('clock')} ${CONTENT.finJornada.t}</button>
  <div class="actions"><button class="btn primary" id="tlCheck">${ic('check')} Verificar</button><button class="btn ghost" id="tlReset">${ic('refresh')} Reiniciar</button></div>
  <div id="tlResult"></div>`; },
  init(r){
    const items = [...CONTENT.franjas, CONTENT.finJornada];
    const btns = $$('[data-id]', r);
    btns.forEach(b => b.onclick = () => { if(!r.dataset.checked) toggleBtn(b); });
    $('#tlCheck', r).onclick = () => {
      r.dataset.checked = '1'; let hit = 0, wrong = 0;
      btns.forEach(b => {
        const it = items.find(x => x.id === b.dataset.id), sel = b.getAttribute('aria-pressed') === 'true';
        b.classList.remove('is-right','is-missed','is-wrong');
        if(it.riesgo && sel){ b.classList.add('is-right'); hit++; }
        else if(it.riesgo){ b.classList.add('is-missed'); }
        else if(sel){ b.classList.add('is-wrong'); wrong++; }
      });
      const risky = items.filter(i => i.riesgo);
      const ok = hit === risky.length && wrong === 0;
      $('#tlResult', r).innerHTML = (ok ? fb('ok','¡Correcto!','Identificaste todos los períodos de mayor riesgo.')
        : fb('warn',`Identificaste ${hit} de ${risky.length} períodos de mayor riesgo${wrong ? ` y marcaste ${wrong} que no están entre los más críticos` : ''}.`,'Revisá la explicación de cada período:'))
        + `<div class="explain-list">${items.map(i => `<div><strong style="color:${i.riesgo ? 'var(--amber)' : 'var(--muted)'}">${i.riesgo ? '▲ Mayor riesgo' : 'Menor riesgo relativo'} · ${i.t}${i.h ? ' (' + i.h + ')' : ''}</strong><p class="sm" style="margin-top:4px">${i.exp}</p></div>`).join('')}</div>`
        + fb('info','Para recordar','El riesgo real también depende del descanso previo de cada persona. Con poco sueño, cualquier horario puede ser de riesgo.');
    };
    $('#tlReset', r).onclick = () => { delete r.dataset.checked; btns.forEach(b => { b.setAttribute('aria-pressed','false'); b.classList.remove('is-right','is-missed','is-wrong'); }); $('#tlResult', r).innerHTML = ''; };
  } },

/* 8 — SEÑALES DE ALERTA */
{ mod:'Módulo 3 · Señales', html(){
  return `${head('Módulo 3 · Señales','Señales de alerta','Seleccioná las señales que indican que deberías dejar de conducir.')}
  <div class="grid g4">${CONTENT.senales.map((s,i) => `<button class="card tile" data-i="${i}" aria-pressed="false">${ic(s.icon)}<span>${s.t}</span></button>`).join('')}</div>
  <div class="actions"><button class="btn primary" id="sgCheck">${ic('check')} Verificar selección</button><button class="btn ghost" id="sgReset">${ic('refresh')} Reiniciar</button></div>
  <div id="sgResult"></div>`; },
  init(r){
    const tiles = $$('.tile', r);
    tiles.forEach(t => t.onclick = () => { if(!r.dataset.checked) toggleBtn(t); });
    $('#sgCheck', r).onclick = () => {
      r.dataset.checked = '1'; let missed = 0, wrong = 0;
      tiles.forEach(t => {
        const s = CONTENT.senales[+t.dataset.i], sel = t.getAttribute('aria-pressed') === 'true';
        $('.mark', t)?.remove();
        if(s.s && sel){ t.classList.add('is-right'); }
        else if(s.s){ t.classList.add('is-missed'); missed++; t.insertAdjacentHTML('beforeend','<span class="mark" style="color:var(--amber)">Es señal</span>'); }
        else if(sel){ t.classList.add('is-wrong'); wrong++; t.insertAdjacentHTML('beforeend','<span class="mark" style="color:#ff8a8d">Conducta segura</span>'); }
      });
      const msg = 'Cualquiera de estas señales indica que es momento de detenerse en un lugar seguro, comunicar y descansar. No hace falta que aparezcan todas juntas.';
      $('#sgResult', r).innerHTML = (missed === 0 && wrong === 0)
        ? fb('ok','¡Muy bien! Reconociste todas las señales de alerta.', msg)
        : fb('warn', `${missed ? `Te faltaron ${missed} señal${missed>1?'es':''}` : 'Reconociste todas las señales'}${wrong ? `${missed ? ' y m' : ', pero m'}arcaste ${wrong} conducta${wrong>1?'s':''} segura${wrong>1?'s':''} que no indica${wrong>1?'n':''} fatiga` : ''}.`, msg);
    };
    $('#sgReset', r).onclick = () => { delete r.dataset.checked; tiles.forEach(t => { t.setAttribute('aria-pressed','false'); t.classList.remove('is-right','is-missed','is-wrong'); $('.mark', t)?.remove(); }); $('#sgResult', r).innerHTML = ''; };
  } },

/* 9 — MICROSUEÑO */
{ mod:'Módulo 3 · Señales', html(){
  return `${head('Módulo 3 · Señales','Microsueño','Es un episodio breve e involuntario de sueño o pérdida de atención que puede durar pocos segundos. Puede ocurrir con los ojos abiertos y, muchas veces, la persona no se da cuenta.')}
  <div class="split">
    <div class="ms-viz" id="msViz" role="img" aria-label="Simulación: vista superior de un vehículo en la ruta">
      <svg viewBox="0 0 400 240" aria-hidden="true">
        <rect width="400" height="240" fill="#18231b"/>
        <rect x="110" width="180" height="240" fill="#2a3139"/>
        <rect x="114" width="3" height="240" fill="#e8eaed" opacity=".8"/><rect x="283" width="3" height="240" fill="#e8eaed" opacity=".8"/>
        <g class="lane-dashes">${Array.from({length:8}, (_,i) => `<rect x="198" y="${i*40 - 40}" width="4" height="20" fill="#f5b301"/>`).join('')}</g>
        <g transform="translate(222 150)"><rect width="40" height="66" rx="9" fill="#f5b301"/><rect x="5" y="12" width="30" height="13" rx="3" fill="#1a2330"/><rect x="6" y="46" width="28" height="9" rx="2" fill="#1a2330"/><rect x="3" y="0" width="8" height="4" rx="1" fill="#fff6d6"/><rect x="29" y="0" width="8" height="4" rx="1" fill="#fff6d6"/></g>
      </svg>
      <div class="lid top"></div><div class="lid bottom"></div>
      <div class="ms-hud"><span id="msStatus">Atento</span><strong id="msDist">0 m</strong></div>
    </div>
    <div class="panel">
      <h3 class="h3">${ic('ruler')} ¿Cuánto se recorre sin control?</h3>
      <span class="field-label">Velocidad</span>
      <div class="chips" id="msSpeed" role="group" aria-label="Velocidad">${[60,80,100,120].map(v => `<button class="chip" data-v="${v}" aria-pressed="${v===100}">${v} km/h</button>`).join('')}</div>
      <span class="field-label">Duración de la pérdida de atención</span>
      <div class="chips" id="msSec" role="group" aria-label="Segundos">${[2,3,4,5].map(v => `<button class="chip" data-v="${v}" aria-pressed="${v===3}">${v} s</button>`).join('')}</div>
      <div class="ms-out"><span class="sm muted">Distancia recorrida sin controlar el vehículo</span><strong id="msCalc">–</strong><span class="sm muted" id="msEq"></span></div>
      <div class="actions"><button class="btn primary" id="msRun">${ic('eyeoff')} Simular microsueño</button></div>
      <p class="sm dim" style="margin-top:10px">Cálculo: velocidad (km/h) ÷ 3,6 × segundos.</p>
    </div>
  </div>
  ${fb('warn','Mensaje clave','Unos pocos segundos de pérdida de atención pueden ser suficientes para recorrer una distancia considerable sin controlar correctamente el vehículo.')}`; },
  init(r){
    let speed = 100, secs = 3;
    const viz = $('#msViz', r), dist = $('#msDist', r), status = $('#msStatus', r);
    const meters = () => Math.round(speed / 3.6 * secs);
    const calc = () => { const m = meters(); $('#msCalc', r).textContent = m + ' metros'; $('#msEq', r).textContent = `≈ ${(m/100).toLocaleString('es-AR',{maximumFractionDigits:1})} cuadras de 100 m, en solo ${secs} segundos.`; };
    const bind = (id, set) => $$('#' + id + ' .chip', r).forEach(c => c.onclick = () => { $$('#' + id + ' .chip', r).forEach(x => x.setAttribute('aria-pressed', String(x === c))); set(+c.dataset.v); calc(); });
    bind('msSpeed', v => speed = v); bind('msSec', v => secs = v); calc();
    $('#msRun', r).onclick = () => {
      const btn = $('#msRun', r), total = meters(); btn.disabled = true;
      const alarma = despertador();   // se prepara con el toque (requisito de los navegadores para reproducir sonido)
      if(REDUCED){ dist.textContent = total + ' m'; status.textContent = 'Recorridos sin control'; btn.disabled = false; alarma(); return; }
      viz.classList.add('closed'); status.textContent = 'Microsueño'; const t0 = performance.now();
      const step = now => {
        if(!viz.isConnected) return;
        const p = Math.min(1, (now - t0) / (secs * 1000)); dist.textContent = Math.round(total * p) + ' m';
        if(p < 1) requestAnimationFrame(step);
        else { viz.classList.remove('closed'); viz.classList.add('wake'); setTimeout(() => viz.classList.remove('wake'), 1200); status.textContent = `${secs} s sin control`; btn.disabled = false; alarma(); }
      };
      requestAnimationFrame(step);
    };
  } },

/* 10 — VEHÍCULOS LIVIANOS */
{ mod:'Módulo 4 · Tipos de vehículo', html(){
  const L = CONTENT.livianos;
  return `${head('Módulo 4 · Tipos de vehículo','Fatiga en vehículos livianos')}
  <div class="grid g3">${L.tipos.map(t => `<div class="card vtype">${ic(t.icon,'xl')}<div><strong>${t.t}</strong><p class="muted sm">${t.d}</p></div></div>`).join('')}</div>
  <h3 class="h3" style="margin-top:24px">Situaciones de riesgo frecuentes</h3>
  <div class="grid g-auto">${L.situaciones.map(s => revealCard(s)).join('')}</div>
  <div class="callout">${ic('alert')} <span>Que el vehículo sea liviano no significa que el riesgo sea menor.</span></div>`; },
  init(r){ bindReveal(r); } },

/* 11 — VEHÍCULOS PESADOS */
{ mod:'Módulo 4 · Tipos de vehículo', html(){
  const P = CONTENT.pesados;
  return `${head('Módulo 4 · Tipos de vehículo','Fatiga en vehículos pesados','La fatiga afecta igual a la persona; lo que cambia son las características del vehículo y, por lo tanto, el margen para corregir un error.')}
  <div class="grid g3">${P.tipos.map(t => `<div class="card vtype heavy">${ic(t.icon,'xl')}<div><strong>${t.t}</strong><p class="muted sm">${t.d}</p></div></div>`).join('')}</div>
  <h3 class="h3" style="margin-top:24px">¿Por qué las consecuencias pueden ser más importantes?</h3>
  <div class="grid g-auto">${P.factores.map(f => revealCard(f)).join('')}</div>
  ${fb('info','Gestión del riesgo','En vehículos pesados, la gestión de la fatiga requiere planificación de recorridos, pausas, relevos y comunicación permanente con la base.')}`; },
  init(r){ bindReveal(r); } },

/* 12 — COMPARACIÓN */
{ mod:'Módulo 4 · Tipos de vehículo', html(){
  return `${head('Módulo 4 · Tipos de vehículo','Vehículo liviano vs. vehículo pesado','Tocá cada fila para ver qué implica frente a la fatiga.')}
  <div class="cmp">
    <div class="cmp-head"><div>Aspecto</div><div>${ic('car')} VEHÍCULO LIVIANO</div><div>${ic('truck')} VEHÍCULO PESADO</div></div>
    ${CONTENT.comparacion.map(c => `<button class="cmp-row" aria-expanded="false"><span>${ic(c.icon)} ${c.t}<svg class="ic chev" aria-hidden="true"><use href="#i-chev"/></svg></span><span>${c.l}</span><span>${c.p}</span><span class="cmp-note">▸ ${c.n}</span></button>`).join('')}
  </div>
  <div class="callout">${ic('shield')} <span>La fatiga afecta a todos los conductores. Las características del vehículo modifican las consecuencias y la forma de gestionar el riesgo.</span></div>`; },
  init(r){ $$('.cmp-row', r).forEach(b => b.onclick = () => b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true'))); } },

/* 13 — MITO O REALIDAD */
{ mod:'Módulo 5 · Mitos y casos', html(){
  return `${head('Módulo 5 · Mitos y casos','Mito o realidad','Leé cada frase y elegí si es un MITO o una REALIDAD.')}
  <p style="margin-bottom:14px"><span class="score-pill" id="mythScore"></span></p>
  <div id="myths">${CONTENT.mitos.map((m,i) => `
    <div class="card myth" data-i="${i}"><q>${m.q}</q>
      <div class="myth-btns"><button class="btn" data-a="mito">MITO</button><button class="btn" data-a="realidad">REALIDAD</button></div></div>`).join('')}
  </div>
  <div class="actions"><button class="btn ghost" id="mythReset">${ic('refresh')} Reiniciar juego</button></div>`; },
  init(r){
    const ans = State.ui.mitos = State.ui.mitos || {};
    const paint = () => {
      $$('.myth', r).forEach(card => {
        const i = +card.dataset.i, m = CONTENT.mitos[i], a = ans[i];
        $('.fb', card)?.remove();
        $$('.btn', card).forEach(b => { b.className = 'btn'; b.disabled = a !== undefined; });
        if(a !== undefined){
          const correct = (a === 'realidad') === m.r;
          $(`[data-a="${a}"]`, card).classList.add(correct ? 'pick-ok' : 'pick-bad');
          card.insertAdjacentHTML('beforeend', fb(correct ? 'ok' : 'bad', `${correct ? 'Correcto' : 'Incorrecto'}: es ${m.r ? 'REALIDAD' : 'MITO'}.`, m.e));
        }
      });
      const done = Object.keys(ans).length, ok = Object.entries(ans).filter(([i,a]) => (a === 'realidad') === CONTENT.mitos[i].r).length;
      $('#mythScore', r).innerHTML = `${ic('target')} ${done < CONTENT.mitos.length ? `Respondidas: ${done} de ${CONTENT.mitos.length}` : `Resultado: ${ok} de ${CONTENT.mitos.length} correctas`}`;
    };
    $$('.myth .btn', r).forEach(b => b.onclick = () => { ans[+b.closest('.myth').dataset.i] = b.dataset.a; paint(); });
    $('#mythReset', r).onclick = () => { Object.keys(ans).forEach(k => delete ans[k]); paint(); };
    paint();
  } },

/* 14 — CASO PRÁCTICO 1 */
{ mod:'Módulo 5 · Mitos y casos', html(){ return caseHTML(0); }, init(r){ caseInit(r, 0); } },
/* 15 — CASO PRÁCTICO 2 */
{ mod:'Módulo 5 · Mitos y casos', html(){ return caseHTML(1); }, init(r){ caseInit(r, 1); } },

/* 16 — QUÉ HACER ANTE LA FATIGA */
{ mod:'Módulo 6 · Qué hacer', html(){
  return `${head('Módulo 6 · Qué hacer','¿Qué hacer ante la fatiga?','Seguí esta secuencia. Tocá cada paso o reproducí la secuencia completa.')}
  <div class="seq">${CONTENT.secuencia.map((s,i) => `<button class="seq-step ${s.cls || ''}" data-i="${i}" aria-pressed="false"><span class="seq-num">${i+1}</span>${ic(s.icon)}<span>${s.t}</span></button>`).join('')}</div>
  <div class="panel seq-detail" id="seqDetail" aria-live="polite"><p class="muted">${ic('info')} Seleccioná un paso para ver el detalle.</p></div>
  <div class="actions"><button class="btn ghost" id="seqPlay">${ic('play')} Reproducir secuencia</button></div>
  <div class="callout green">${ic('shield')} <span>Reconocer la fatiga no es una debilidad. Es una conducta preventiva.</span></div>`; },
  init(r){
    const steps = $$('.seq-step', r);
    const show = i => { const s = CONTENT.secuencia[i]; steps.forEach((b,j) => b.setAttribute('aria-pressed', String(j <= i))); $('#seqDetail', r).innerHTML = `<p class="eyebrow">Paso ${i+1} de ${steps.length}</p><h3 class="h3">${s.t}</h3><p>${s.d}</p>`; };
    steps.forEach(b => b.onclick = () => show(+b.dataset.i));
    $('#seqPlay', r).onclick = () => {
      if(REDUCED){ show(steps.length - 1); return; }
      let i = 0; const tick = () => { if(!r.isConnected) return; show(i); if(++i < steps.length) setTimeout(tick, 1900); }; tick();
    };
  } },

/* 17 — PREVENCIÓN */
{ mod:'Módulo 6 · Qué hacer', html(){
  const P = CONTENT.prevencion;
  const col = (title, icon, items, k) => `<div class="prev-col"><h3>${ic(icon)} ${title}</h3>${items.map((t,i) => `<button class="check-item" data-k="${k}${i}" aria-pressed="false"><span class="check-box">${ic('check')}</span>${t}</button>`).join('')}</div>`;
  return `${head('Módulo 6 · Qué hacer','Prevención','Marcá las medidas que ya aplicás o que te comprometés a aplicar.')}
  <div class="grid g2">${col('ANTES DEL VIAJE','clipboard',P.antes,'a')}${col('DURANTE EL VIAJE','steering',P.durante,'d')}</div>
  <p class="hint" id="prevCount"></p>`; },
  init(r){
    const st = State.ui.prev = State.ui.prev || {}, items = $$('.check-item', r);
    const count = () => $('#prevCount', r).innerHTML = `${ic('check')} Medidas marcadas: ${Object.values(st).filter(Boolean).length} de ${items.length}.`;
    items.forEach(b => { if(st[b.dataset.k]) b.setAttribute('aria-pressed','true'); b.onclick = () => { st[b.dataset.k] = toggleBtn(b); count(); }; });
    count();
  } },

/* 18 — PLANIFICACIÓN DE VIAJES */
{ mod:'Módulo 6 · Qué hacer', html(){
  const P = CONTENT.plan;
  return `${head('Módulo 6 · Qué hacer','Planificación de viajes','Armá tu plan para este viaje hipotético.')}
  <div class="panel plan-scn">${ic('route','xl')}<div><p class="eyebrow">Escenario</p><p style="font-size:1.08rem;font-weight:600">${P.escenario}</p></div></div>
  ${P.preguntas.map(q => `<div class="plan-q" data-q="${q.id}"><h4>${ic(q.icon)} ${q.t}</h4><div class="plan-opts">${q.o.map((o,i) => `<button class="plan-opt" data-i="${i}" aria-pressed="false">${o.t}</button>`).join('')}</div></div>`).join('')}
  <div class="actions"><button class="btn primary" id="planEval" disabled>${ic('clipboard')} Evaluar mi plan</button><button class="btn ghost" id="planReset">${ic('refresh')} Reiniciar</button></div>
  <div id="planResult"></div>`; },
  init(r){
    const P = CONTENT.plan, sel = {}, evalBtn = $('#planEval', r);
    $$('.plan-q', r).forEach(qEl => $$('.plan-opt', qEl).forEach(b => b.onclick = () => {
      if(r.dataset.done) return;
      $$('.plan-opt', qEl).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      sel[qEl.dataset.q] = +b.dataset.i; evalBtn.disabled = Object.keys(sel).length < P.preguntas.length;
    }));
    evalBtn.onclick = () => {
      r.dataset.done = '1'; let ok = 0;
      P.preguntas.forEach(q => {
        const qEl = $(`[data-q="${q.id}"]`, r), i = sel[q.id], o = q.o[i], b = $$('.plan-opt', qEl)[i];
        b.classList.add(o.ok ? 'right' : 'wrong'); b.insertAdjacentHTML('beforeend', `<span class="pf">${o.ok ? '✔ ' : '✖ '}${o.f}</span>`);
        if(o.ok) ok++; else { const good = q.o.findIndex(x => x.ok); $$('.plan-opt', qEl)[good].classList.add('right'); }
      });
      $('#planResult', r).innerHTML = (ok === P.preguntas.length ? fb('ok', `Plan seguro: ${ok} de ${P.preguntas.length} decisiones adecuadas.`, '') : fb('warn', `${ok} de ${P.preguntas.length} decisiones adecuadas.`, 'Las opciones recomendadas quedaron marcadas en verde.'))
        + fb('info','¿Por qué planificar reduce el riesgo?','Planificar permite salir descansado, evitar los horarios de mayor somnolencia, prever pausas en lugares seguros y viajar sin presión de tiempo. Además, la base sabe dónde estás y puede reorganizar si algo cambia. Los tiempos de conducción y descanso deben respetar la política interna de la empresa y la normativa vigente aplicable.');
    };
    $('#planReset', r).onclick = () => { delete r.dataset.done; Object.keys(sel).forEach(k => delete sel[k]); evalBtn.disabled = true; $$('.plan-opt', r).forEach(b => { b.setAttribute('aria-pressed','false'); b.classList.remove('right','wrong'); $('.pf', b)?.remove(); }); $('#planResult', r).innerHTML = ''; };
  } },

/* 19 — DECISIÓN SEGURA */
{ mod:'Módulo 6 · Qué hacer', html(){ return `${head('Módulo 6 · Qué hacer','Decisión segura','Tres situaciones rápidas. Elegí qué harías.')}<div id="decBox"></div>`; },
  init(r){
    const D = CONTENT.decisiones, st = State.ui.dec = State.ui.dec || { i:0, res:[] }, box = $('#decBox', r);
    const render = () => {
      if(st.i >= D.length){
        const ok = st.res.filter(Boolean).length;
        box.innerHTML = `<div class="qcard">${fb(ok === D.length ? 'ok' : 'warn', `Tomaste ${ok} de ${D.length} decisiones seguras.`, 'En todas las situaciones la respuesta segura es la misma: detenerse, comunicar y descansar. Nunca acelerar ni recurrir a "trucos" para seguir.')}
          <div class="callout">${ic('stop')} <span>DETENERSE A TIEMPO TAMBIÉN ES SEGURIDAD.</span></div>
          <div class="actions"><button class="btn ghost" id="decAgain">${ic('refresh')} Repetir situaciones</button></div></div>`;
        $('#decAgain', box).onclick = () => { st.i = 0; st.res = []; render(); };
        return;
      }
      const d = D[st.i];
      box.innerHTML = `<div class="qcard">
        <div class="qhead"><span class="score-pill">Situación ${st.i+1} de ${D.length}</span><div class="qprog">${D.map((_,k) => `<i class="${k < st.i ? (st.res[k] ? 'ok' : 'bad') : k === st.i ? 'cur' : ''}"></i>`).join('')}</div></div>
        <div class="situation">${ic(d.icon,'xl')}<p>${d.s}</p></div>
        <div class="opt-grid">${d.o.map((o,i) => `<button class="opt" data-i="${i}"><span class="opt-l">${'ABCD'[i]}</span>${o.t}</button>`).join('')}</div>
        <div id="decFb"></div></div>`;
      $$('.opt', box).forEach(b => b.onclick = () => {
        const o = d.o[+b.dataset.i];
        $$('.opt', box).forEach((x,k) => { x.disabled = true; if(d.o[k].ok) x.classList.add('right'); else if(x !== b) x.classList.add('faded'); });
        if(!o.ok) b.classList.add('wrong');
        st.res[st.i] = o.ok;
        $('#decFb', box).innerHTML = fb(o.ok ? 'ok' : 'bad', o.ok ? 'Decisión segura' : 'Decisión insegura', o.f + (o.ok ? '' : ' La recomendación preventiva es detenerse en un lugar seguro y comunicar.'))
          + `<div class="actions"><button class="btn primary" id="decNext">${st.i < D.length-1 ? 'Siguiente situación' : 'Ver resumen'} ${ic('arrow')}</button></div>`;
        $('#decNext', box).onclick = () => { st.i++; render(); };
        $('#decNext', box).focus();
      });
    };
    render();
  } },

/* 20 — CIERRE */
{ mod:'Cierre', html(){
  const o = CONFIG.organizacion, refs = [o.politicaConduccion, o.procedimientoFatiga].filter(x => x && x.titulo);
  return `<div class="closing">
    ${ic('shield','xl')}
    <h1>LA FATIGA TAMBIÉN<br>ES UN RIESGO</h1>
    <p class="big">Si estás fatigado, no continúes conduciendo.</p>
    <p class="big muted">Detenerse, comunicar y descansar también es trabajar de manera segura.</p>
    <span class="motto">DETENERSE A TIEMPO TAMBIÉN ES SEGURIDAD</span>
    <p class="big" style="margin-top:26px">Gracias por ser parte de esta cultura preventiva.</p>
    <div class="signature">${instructorCard(CONFIG.consultora.nombre + ' · Capacitación dictada por')}</div>
    ${refs.length ? `<div class="panel refs"><p class="eyebrow">Documentos internos de referencia</p>${refs.map(d => `<p>${ic('clipboard')} ${d.enlace ? `<a href="${esc(d.enlace)}" target="_blank" rel="noopener" style="color:var(--amber)">${esc(d.titulo)}</a>` : esc(d.titulo)}</p>`).join('')}</div>` : ''}
    <div class="actions" style="justify-content:center;margin-top:30px"><a class="btn primary lg" href="vivo.html">${ic('zap')} DESAFÍO EN VIVO</a><button class="btn ghost lg" id="toEval">${ic('clipboard')} CONTINUAR A LA EVALUACIÓN</button></div>
    <p class="sm dim" style="text-align:center;margin-top:14px"><a href="referencias.html" target="_blank" rel="noopener" style="color:var(--muted)">Referencias y material de consulta</a></p>
  </div>`; },
  init(r){ $('#toEval', r).onclick = () => go(LAST); } },

/* 21 — EVALUACIÓN INDIVIDUAL (QR) */
{ mod:'Evaluación', html(){
  const url = evalUrl(), local = location.protocol === 'file:';
  return `<div class="qr-slide">
    <div style="text-align:center">
      <div class="qr-box" role="img" aria-label="Código QR para abrir la evaluación">${qrSVG(url)}</div>
      <p class="qr-url">${esc(url.replace(/^https?:\/\//, ''))}</p>
    </div>
    <div>
      ${head('Evaluación final','Ahora, tu evaluación individual','Escaneá el código con la cámara de tu celular o abrí el enlace en tu computadora.')}
      <ol class="steps">
        <li>Escaneá el código QR</li>
        <li>Completá tu legajo, nombre y apellido</li>
        <li>Respondé ${CONTENT.quiz.length} preguntas (aprobás con ${CONFIG.aprobacion.porcentajeMinimo}% o más)</li>
        <li>Si aprobás, guardá tu constancia</li>
      </ol>
      ${local ? fb('warn','Vista local','El QR funciona cuando el sitio está publicado (por ejemplo, en Vercel). Abierto como archivo, apunta a esta computadora.') : ''}
      <div class="actions"><a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">${ic('arrow')} Abrir la evaluación en este equipo</a><a class="btn primary" href="index.html">${ic('flag')} FINALIZAR CAPACITACIÓN</a></div>
    </div>
  </div>`; } }
];

function caseHTML(n){
  const c = CONTENT.casos[n];
  return `${head('Módulo 5 · Mitos y casos', `Caso práctico ${n+1}`)}
  <div class="case">
    <div class="panel case-scene">${ic(c.icon,'xl')}<p class="eyebrow">Situación</p><p class="case-text">${c.s}</p><div class="tags">${c.tags.map((t,i) => `<span class="tag ${i ? 'warn' : ''}">${t}</span>`).join('')}</div></div>
    <div><h3 class="qtext">${c.q}</h3><div class="options">${c.o.map((o,i) => `<button class="opt" data-i="${i}"><span class="opt-l">${'ABCD'[i]}</span>${o.t}</button>`).join('')}</div><div class="caseFb"></div></div>
  </div>`;
}
function caseInit(r, n){
  const c = CONTENT.casos[n], opts = $$('.opt', r), out = $('.caseFb', r);
  const answer = i => {
    opts.forEach((x,k) => { x.disabled = true; if(k === c.c) x.classList.add('right'); else if(k !== i) x.classList.add('faded'); });
    const ok = i === c.c; if(!ok) opts[i].classList.add('wrong');
    out.innerHTML = fb(ok ? 'ok' : 'bad', ok ? 'Respuesta segura' : 'Respuesta insegura', c.o[i].e)
      + (ok ? '' : fb('ok', `Conducta segura: ${'ABCD'[c.c]}`, c.o[c.c].e))
      + `<div class="actions"><button class="btn ghost sm caseRetry">${ic('refresh')} Volver a intentar</button></div>`;
    $('.caseRetry', out).onclick = () => { State.ui['case' + n] = undefined; opts.forEach(x => { x.disabled = false; x.classList.remove('right','wrong','faded'); }); out.innerHTML = ''; };
    State.ui['case' + n] = i;
  };
  opts.forEach(b => b.onclick = () => answer(+b.dataset.i));
  if(State.ui['case' + n] !== undefined) answer(State.ui['case' + n]);
}

/* =====================================================================
   f) NAVEGACIÓN
   ===================================================================== */
const stage = $('#stage'), btnPrev = $('#btnPrev'), btnNext = $('#btnNext');
const LAST = SLIDES.length - 1;

function go(i){
  i = Math.max(0, Math.min(LAST, i));
  State.current = i;
  const s = SLIDES[i];
  stage.innerHTML = `<section class="slide" aria-label="Pantalla ${i+1}: ${s.mod}">${s.html()}</section>`;
  s.init && s.init(stage.firstElementChild);
  stage.scrollTop = 0;
  stage.focus({preventScroll:true});
  updateNav();
}
function updateNav(){
  const i = State.current, N = SLIDES.length, pct = Math.round((i+1) / N * 100);
  $('#progressFill').style.width = pct + '%';
  $('#progressBar').setAttribute('aria-valuenow', pct);
  $('#counterText').innerHTML = `Pantalla <strong>${i+1}</strong> de ${N} · ${SLIDES[i].mod}`;
  $('#dots').innerHTML = SLIDES.map((_,k) => `<i class="${k === i ? 'on' : k < i ? 'done' : ''}"></i>`).join('');
  btnPrev.disabled = i === 0;
  btnNext.style.visibility = i === LAST ? 'hidden' : 'visible';
  btnNext.disabled = false;
}
btnPrev.onclick = () => go(State.current - 1);
btnNext.onclick = () => { if(!btnNext.disabled) go(State.current + 1); };
document.addEventListener('keydown', e => {
  if($('#dlg') && $('#dlg').open) return;
  if(e.target.closest('input,select,textarea')) return;
  if(e.key === 'ArrowRight' || e.key === 'PageDown'){ e.preventDefault(); btnNext.click(); }
  if(e.key === 'f' || e.key === 'F'){ toggleFullscreen(); }
  if(e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); if(!btnPrev.disabled) btnPrev.click(); }
});
// Soporte de deslizamiento táctil (swipe) entre pantallas
(function(){ let x0 = null, y0 = null;
  stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive:true});
  stage.addEventListener('touchend', e => { if(x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if(Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2){ dx < 0 ? btnNext.click() : (!btnPrev.disabled && btnPrev.click()); } x0 = null; }, {passive:true});
})();


/* =====================================================================
   INICIO (modo presentación)
   ===================================================================== */
(function init(){
  initBrand();
  const fs = $('#btnFull'); if(fs) fs.onclick = toggleFullscreen;
  go(0);
})();
