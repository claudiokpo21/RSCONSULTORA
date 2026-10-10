'use strict';
/* afiche.js — AFICHE DE UNA HOJA (A4) para imprimir y pegar en el comedor, o compartir por WhatsApp.
   Toma los textos de content.js (señales, secuencia, prevención) para que coincidan con la capacitación.
   RS Consultora · Fatiga y Conducción Segura */
(function(){
  const C = CONTENT, sen = C.senales.filter(s => s.s).slice(0, 8);
  const url = new URL('afiche.html', location.href).href;
  $('#report').innerHTML = `<section class="sheet afiche">
    <header class="af-head">
      <div class="af-brand"><span class="af-mark">${esc(CONFIG.consultora.iniciales)}</span><div><b>${esc(CONFIG.consultora.nombre)}</b><small>Higiene y Seguridad</small></div></div>
      <p class="af-eyebrow">Seguridad vial laboral</p>
      <h1>FATIGA Y<br><span>CONDUCCIÓN SEGURA</span></h1>
      <p class="af-motto">Detenerse a tiempo también es seguridad</p>
    </header>
    <div class="af-body">
      <section class="af-box">
        <h2>${ic('alert')} Señales de alerta</h2>
        <ul class="af-list">${sen.map(s => `<li>${ic(s.icon)}<span>${esc(s.t)}</span></li>`).join('')}</ul>
      </section>
      <section class="af-box af-stop">
        <h2>${ic('stop')} Si aparece la fatiga</h2>
        <ol class="af-steps">${C.secuencia.map(s => `<li><b>${esc(s.t.charAt(0) + s.t.slice(1).toLowerCase())}</b></li>`).join('')}</ol>
      </section>
      <section class="af-box">
        <h2>${ic('clock')} Momentos de mayor riesgo</h2>
        <ul class="af-list"><li>${ic('moon')}<span>Madrugada (0 a 6 h)</span></li><li>${ic('sun')}<span>Primeras horas de la mañana</span></li><li>${ic('food')}<span>Después del almuerzo</span></li><li>${ic('hourglass')}<span>Final de una jornada larga</span></li></ul>
      </section>
      <section class="af-box af-myth">
        <h2>${ic('x')} No reemplazan el descanso</h2>
        <p>Café, energizantes, abrir la ventanilla o subir la radio. <b>La fatiga se resuelve durmiendo.</b></p>
      </section>
      <section class="af-dato">
        <b>17 horas despierto</b><span>afectan el rendimiento como <b>0,5 g/l de alcohol en sangre</b>. Con 24 horas, como 1 g/l.</span>
      </section>
      <section class="af-box af-prev">
        <h2>${ic('shield')} Antes y durante el viaje</h2>
        <ul class="af-list">${[...C.prevencion.antes.slice(0, 3), ...C.prevencion.durante.slice(0, 3)].map(t => `<li>${ic('check')}<span>${esc(t)}</span></li>`).join('')}</ul>
      </section>
    </div>
    <footer class="af-foot">
      <div class="af-qr">${qrSVG(url)}</div>
      <div><b>${esc(CONFIG.capacitacion.nombre)}</b><br>${esc(capacitador())} · ${esc(CONFIG.consultora.nombre)}
        <p>Fuentes: Dawson y Reid (1997), <i>Nature</i> [10]; CDC/NIOSH [11]; ANSV, Dossier N.º 5 (2021) [9]. Bibliografía completa en la página Referencias. Pausas según la política interna de cada empresa.</p></div>
    </footer>
  </section>`;
  $('#tbPrint').onclick = () => window.print();
  $('#tbWa').href = 'https://wa.me/?text=' + encodeURIComponent('Las claves para prevenir la fatiga al volante · ' + CONFIG.consultora.nombre + ': ' + url);
})();
