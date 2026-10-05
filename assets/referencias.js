'use strict';
/* referencias.js — REFERENCIAS Y MATERIAL DE CONSULTA
   Fuentes oficiales para ampliar los temas de la capacitación. Para sumar una, agregarla en REFS.
   RS Consultora · Fatiga y Conducción Segura */

const REFS = [
  { grupo:'Fatiga y conducción', items:[
    { org:'Agencia Nacional de Seguridad Vial (ANSV) · Observatorio Vial Nacional', t:'Fatiga y estrés en la conducción de vehículos',
      url:'https://www.argentina.gob.ar/seguridadvial/observatoriovialnacional/fatiga-y-estres-en-la-conduccion-de-vehiculos',
      d:'Cómo la fatiga y el estrés afectan la conducción y medidas de prevención: pausas, hidratación, comidas livianas.' },
    { org:'Superintendencia de Riesgos del Trabajo (SRT)', t:'Fatiga en conductores de transporte automotor de larga distancia — Ficha técnica',
      url:'https://www.argentina.gob.ar/sites/default/files/ft_fatiga_conductores_ago2021_corregido.pdf',
      d:'Ficha de prevención de la SRT sobre el riesgo de fatiga en la conducción profesional.' },
    { org:'Superintendencia de Riesgos del Trabajo (SRT)', t:'Fatiga en conductores de transporte automotor de larga distancia — Cuadríptico',
      url:'https://www.argentina.gob.ar/sites/default/files/2_cuadriptico_fatiga_1_corregido.pdf',
      d:'Versión resumida para entregar a los trabajadores.' },
    { org:'National Highway Traffic Safety Administration (NHTSA, EE. UU.) · en inglés', t:'Drowsy Driving: Avoid Falling Asleep Behind the Wheel',
      url:'https://www.nhtsa.gov/risky-driving/drowsy-driving',
      d:'Señales de somnolencia al volante, horarios de mayor riesgo y recomendaciones de prevención.' } ] },
  { grupo:'Seguridad vial', items:[
    { org:'Organización Mundial de la Salud (OMS)', t:'Traumatismos causados por el tránsito — Nota descriptiva',
      url:'https://www.who.int/es/news-room/fact-sheets/detail/road-traffic-injuries',
      d:'Panorama mundial de la siniestralidad vial y sus principales factores de riesgo.' } ] },
  { grupo:'Normativa relacionada', items:[
    { org:'Argentina · Ley 24.449', t:'Ley Nacional de Tránsito y Seguridad Vial',
      url:'https://www.argentina.gob.ar/normativa/nacional/818/actualizacion', d:'Texto actualizado.' },
    { org:'Argentina · Ley 19.587', t:'Ley de Higiene y Seguridad en el Trabajo',
      url:'https://www.argentina.gob.ar/normativa/nacional/38568/actualizacion', d:'Texto actualizado.' },
    { org:'Argentina · Ley 25.326', t:'Ley de Protección de los Datos Personales',
      url:'https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm', d:'Aplicable al registro de participantes de la capacitación. Ver también el aviso de privacidad.' } ] }
];

(function(){
  initBrand();
  $('#view').innerHTML = `<article class="doc">
    <p class="eyebrow">${esc(CONFIG.consultora.nombre)} · ${esc(CONFIG.capacitacion.nombre)}</p>
    <h1>Referencias y material de consulta</h1>
    <p class="lead">Fuentes oficiales para ampliar los temas de la capacitación. La capacitación no reemplaza la normativa vigente ni los procedimientos internos de cada empresa: ante cualquier duda, consultá a tu supervisor o al área de Higiene y Seguridad.</p>
    ${REFS.map(g => `<h2>${esc(g.grupo)}</h2><ul class="refs">${g.items.map(r => `<li><small>${esc(r.org)}</small><b>${esc(r.t)}</b><p>${esc(r.d)}</p>
      <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></li>`).join('')}</ul>`).join('')}
    <p class="sm dim" style="margin-top:22px">Enlaces consultados en octubre de 2026. ${esc(CONFIG.consultora.nombre)} no es responsable del contenido de sitios externos.</p>
    <a class="back" href="index.html" id="pvBack">${ic('arrowl')} Volver</a>
  </article>`;
  $('#pvBack').onclick = e => { if(window.opener){ e.preventDefault(); window.close(); } else if(history.length > 1){ e.preventDefault(); history.back(); } };
})();
