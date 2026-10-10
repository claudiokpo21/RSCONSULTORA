'use strict';
/* referencias.js — REFERENCIAS Y MATERIAL DE CONSULTA
   Fuentes oficiales para ampliar los temas de la capacitación. Para sumar una, agregarla en REFS.
   RS Consultora · Fatiga y Conducción Segura */

/* BIBLIOGRAFÍA DE LOS DATOS: cada cifra que se muestra en la presentación lleva su número [n].
   Fuentes primarias tomadas de la bibliografía del Dossier N.º 5 de la ANSV (2021). */
const BIBLIO = [
  { n:1, cita:'Organización Mundial de la Salud (2018). Global status report on road safety 2018. Ginebra: OMS.',
    url:'https://www.who.int/publications/i/item/9789241565684', uso:'1,35 millones de muertes por año en el tránsito (pantalla 2).' },
  { n:2, cita:'Agencia Nacional de Seguridad Vial (2021). Anuario estadístico de seguridad vial, año 2019. Observatorio Vial Nacional.',
    url:'https://www.argentina.gob.ar/sites/default/files/2018/12/ansv_ov_anuario_estadistico_2019_final.pdf', uso:'99.221 siniestros con víctimas y 4.911 fallecidos en 2019 (pantalla 2).' },
  { n:3, cita:'Cardinali, D. P. et al. (2007). Trastornos del sueño y seguridad vial: un tema no resuelto. Encrucijadas, 42. Universidad de Buenos Aires.',
    url:'http://repositoriouba.sisbi.uba.ar/gsdl/collect/encruci/index/assoc/HWA_328.dir/328.PDF', uso:'La falta de sueño produce efectos similares a 0,5 g/l de alcohol en sangre (pantalla 7 y banco de preguntas).' },
  { n:4, cita:'Pérez-Chada, D. et al. (2005). Sleep habits and accident risk among truck drivers: a cross-sectional study in Argentina. Sleep, 28(9).',
    url:'https://academic.oup.com/sleep/article/28/9/1103/2708214', uso:'Encuesta a 738 camioneros: 86 % con insuficiencia de sueño y 45 % que dormía menos de 4 horas (pantalla 12).' },
  { n:5, cita:'Diez, J. J. et al. (2019). Sleep misalignment and circadian rhythm impairment in long-haul bus drivers under a two-up operations system. Sleep Health (National Sleep Foundation).',
    url:'https://doi.org/10.1016/j.sleh.2019.12.011', uso:'La mitad del sueño de los choferes de larga distancia se hace fuera de casa (pantalla 12).' },
  { n:6, cita:'Superintendencia de Riesgos del Trabajo, Área de Investigaciones en Salud Laboral y Estadística (2009). Informe sobre las condiciones y medioambiente de trabajo de conductores de transporte de pasajeros de larga distancia.',
    url:'https://www.argentina.gob.ar/sites/default/files/informe_transporte.pdf', uso:'84,9 % de los choferes se siente en condiciones al empezar el viaje y 66,1 % al terminarlo (pantalla 12).' },
  { n:7, cita:'Ledesma, R. et al. (2017). Trabajo y salud en conductores de taxis. Ciencia & Trabajo, 19(59), 113-119.',
    url:'https://ri.conicet.gov.ar/handle/11336/74600', uso:'Situaciones que generan estrés al manejar y sus señales (pantalla 6).' },
  { n:8, cita:'Organización Mundial de la Salud (2004). Informe mundial sobre prevención de los traumatismos causados por el tránsito. Ginebra: OMS.',
    url:'https://www.who.int/violence_injury_prevention/publications/road_traffic/world_report/summary_es.pdf', uso:'Efectos de la fatiga en el tiempo de reacción, la atención y el procesamiento de la información (pantallas 3 y 4).' },
  { n:9, cita:'Agencia Nacional de Seguridad Vial, Observatorio Vial Nacional (2021). Dossier N.º 5: Fatiga y estrés en la conducción de vehículos.',
    url:'https://www.argentina.gob.ar/sites/default/files/2022/04/ansv_ov_dossier_investigacion_n5.pdf', uso:'Síntesis de los estudios anteriores; estrés al volante (pantalla 6) y medidas para la organización (informe grupal).' },
  { n:10, cita:'Dawson, D. y Reid, K. (1997). Fatigue, alcohol and performance impairment. Nature, 388, 235.',
    url:'https://doi.org/10.1038/40775', uso:'17 horas despierto equivalen a 0,05 % de alcohol en sangre (0,5 g/l) y 24 horas a 0,10 % (1 g/l): actividad «¿Cuántas horas llevás despierto?» (pantalla 7) y afiche.' },
  { n:11, cita:'Centers for Disease Control and Prevention, NIOSH. Training for nurses on shift work and long work hours: impairment from fatigue.',
    url:'https://archive.cdc.gov/www_cdc_gov/niosh/emres/longhourstraining/impaired.html', uso:'Confirma la equivalencia entre horas despierto y alcohol en sangre (pantalla 7 y afiche).' },
  { n:12, cita:'Horne, J. y Reyner, L. (1995). Sleep related vehicle accidents. BMJ, 310(6979), 565-567.',
    url:'https://www.bmj.com/content/310/6979/565', uso:'Los siniestros por somnolencia se concentran en la madrugada y a primera hora de la tarde: actividades «El reloj del cuerpo» y «Turno noche y vuelta a casa».' },
  { n:13, cita:'Hirshkowitz, M. et al. (2015). National Sleep Foundation\'s sleep time duration recommendations. Sleep Health, 1(1), 40-43.',
    url:'https://doi.org/10.1016/j.sleh.2014.12.010', uso:'La mayoría de los adultos necesita dormir entre 7 y 9 horas: actividad «La deuda de sueño».' },
  { n:14, cita:'Van Dongen, H. P. A. et al. (2003). The cumulative cost of additional wakefulness. Sleep, 26(2), 117-126.',
    url:'https://pubmed.ncbi.nlm.nih.gov/12683469/', uso:'Dormir 6 horas por noche durante dos semanas deteriora el rendimiento como una o dos noches sin dormir, sin que la persona lo note: «La deuda de sueño».' },
  { n:15, cita:'Belenky, G. et al. (2003). Patterns of performance degradation and restoration during sleep restriction and subsequent recovery. Journal of Sleep Research, 12(1), 1-12.',
    url:'https://pubmed.ncbi.nlm.nih.gov/12603781/', uso:'El rendimiento tarda varios días en recuperarse después de dormir poco: «La deuda de sueño».' },
  { n:16, cita:'Department for Transport, Reino Unido. The Highway Code, regla 126: distancias típicas de detención.',
    url:'https://www.gov.uk/guidance/the-highway-code/general-rules-techniques-and-advice-for-all-drivers-and-riders-103-to-158', uso:'Distancias de frenado típicas de un automóvil en piso seco (≈ 6,5 m/s² de desaceleración) y el doble en piso mojado: frenado del «Test de reacción».' },
  { n:17, cita:'AAMVA. Manual modelo de licencia de conducir comercial (CDL), secciones 2.6 «Controlling speed» y 5 «Air brakes». Estados Unidos.',
    url:'https://www.laed.uscourts.gov/sites/default/files/pdfs/AAMVA%20-%20CDL%20Manual.pdf', uso:'Camión: unos 216 pies (66 m) de frenado a 55 mph en piso seco (≈ 4,6 m/s²) y 0,5 s de retardo de los frenos de aire: frenado del «Test de reacción».' }
];

const REFS = [
  { grupo:'Fatiga y conducción', items:[
    { org:'Agencia Nacional de Seguridad Vial (ANSV) · Observatorio Vial Nacional', t:'Fatiga y estrés en la conducción de vehículos',
      url:'https://www.argentina.gob.ar/seguridadvial/observatoriovialnacional/fatiga-y-estres-en-la-conduccion-de-vehiculos',
      d:'Cómo la fatiga y el estrés afectan la conducción y medidas de prevención: pausas, hidratación, comidas livianas.' },
    { org:'Agencia Nacional de Seguridad Vial (ANSV) · Observatorio Vial Nacional', t:'Dossier N.º 5 — Fatiga y estrés en la conducción de vehículos (PDF, 2021)',
      url:'https://www.argentina.gob.ar/sites/default/files/2022/04/ansv_ov_dossier_investigacion_n5.pdf',
      d:'Documento completo con los datos de Argentina que usa la capacitación: siniestros 2019, estudios en camioneros y choferes, equivalencia entre falta de sueño y alcohol, y recomendaciones.' },
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
    <h2>Bibliografía de los datos</h2>
    <p>Cada cifra de la presentación lleva entre corchetes el número de su fuente. Son las fuentes primarias citadas por la ANSV en el Dossier N.º 5 (2021).</p>
    <ol class="refs biblio">${BIBLIO.map(b => `<li id="ref-${b.n}"><small>[${b.n}]</small><b>${esc(b.cita)}</b><p>${esc(b.uso)}</p>
      <a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></li>`).join('')}</ol>
    ${REFS.map(g => `<h2>${esc(g.grupo)}</h2><ul class="refs">${g.items.map(r => `<li><small>${esc(r.org)}</small><b>${esc(r.t)}</b><p>${esc(r.d)}</p>
      <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></li>`).join('')}</ul>`).join('')}
    <p class="sm dim" style="margin-top:22px">Enlaces consultados en octubre de 2026. ${esc(CONFIG.consultora.nombre)} no es responsable del contenido de sitios externos.</p>
    <a class="back" href="index.html" id="pvBack">${ic('arrowl')} Volver</a>
  </article>`;
  $('#pvBack').onclick = e => { if(window.opener){ e.preventDefault(); window.close(); } else if(history.length > 1){ e.preventDefault(); history.back(); } };
})();
