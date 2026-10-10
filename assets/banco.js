'use strict';
/* banco.js — BANCO DE PREGUNTAS DE LA EVALUACIÓN
   Cada uno de los 10 temas tiene varias versiones de la pregunta. En cada intento se sortea una versión
   por tema y se mezcla el orden de las opciones, así dos compañeros no tienen la misma evaluación.
   Como cada evaluación siempre tiene un tema por posición, los informes "por tema" siguen funcionando.
   · Versión 0 = la pregunta original de content.js (CONTENT.quiz).
   · Versiones 1, 2…: las de VARIANTES. Para sumar una, agregarla en el tema que corresponde.
   Formato: { q:'pregunta', o:['opción A', …], c:índice de la correcta, e:'explicación' }
   RS Consultora · Fatiga y Conducción Segura */

const VARIANTES = [
  /* 0 · Definición de fatiga */ [
    { q:'¿En qué se diferencia la fatiga del cansancio?', c:2,
      o:['No hay diferencia: son exactamente lo mismo.','La fatiga siempre desaparece con un café.','La fatiga suele ser acumulada y no siempre se resuelve con una pausa corta.','El cansancio solo afecta a quienes manejan vehículos pesados.'],
      e:'El cansancio suele recuperarse con una pausa. La fatiga es un estado físico y/o mental, a menudo acumulado, que disminuye la capacidad de realizar una tarea de manera segura.' } ],
  /* 1 · Señales de alerta */ [
    { q:'¿Cuál de estas situaciones NO es una señal de fatiga?', c:3,
      o:['Desvíos involuntarios del carril.','Frenadas tardías.','Necesidad constante de cambiar de posición.','Mantener una distancia de seguimiento constante.'],
      e:'Mantener una distancia constante es una conducta segura. Los desvíos del carril, las frenadas tardías y la necesidad de cambiar de posición son señales de alerta.' } ],
  /* 2 · Microsueño */ [
    { q:'Un microsueño puede ocurrir…', c:0,
      o:['Con los ojos abiertos, sin que la persona se dé cuenta.','Solo de noche.','Solo si se cierran los ojos por completo.','Solo en vehículos pesados.'],
      e:'El microsueño es un episodio breve e involuntario de sueño o pérdida de atención. Puede ocurrir con los ojos abiertos y, muchas veces, la persona no lo percibe.' } ],
  /* 3 · Factores de riesgo */ [
    { q:'¿Cuál de estas situaciones favorece la somnolencia al conducir?', c:1,
      o:['Hacer pausas planificadas.','La monotonía de una ruta recta y con poco tránsito.','Mantenerse hidratado.','Dormir adecuadamente antes del viaje.'],
      e:'Las rutas rectas, los paisajes repetitivos y el poco tránsito reducen los estímulos y favorecen la somnolencia.' },
    { q:'Según la ANSV, el estrés al volante puede provocar…', c:0,
      o:['Conductas agresivas, imprudentes o impulsivas.','Más atención y mejores reflejos durante todo el viaje.','Ningún efecto si el vehículo es liviano.','Solo cansancio en las piernas.'],
      e:'El estrés cambia la forma de manejar: aparecen la agresividad, la imprudencia y la impulsividad. Reconocerlo, no competir en el tránsito y salir con tiempo ayudan a controlarlo.' } ],
  /* 4 · Sueño y conducción */ [
    { q:'Dormir pocas horas varios días seguidos…', c:2,
      o:['No tiene efecto si se toma café.','Se compensa con la experiencia al volante.','Genera una "deuda de sueño" que se acumula.','Solo afecta a quienes manejan de noche.'],
      e:'Dormir menos de lo habitual genera una deuda de sueño que se acumula si se repite varios días seguidos. Nada reemplaza el descanso.' },
    { q:'Según estudios citados por la ANSV, manejar sin haber dormido lo suficiente produce efectos similares a…', c:1,
      o:['Tomar un café.','Tener 0,5 g/l de alcohol en sangre.','Manejar con la radio alta.','Nada, si se tiene experiencia.'],
      e:'La falta de sueño afecta la atención y los reflejos de forma parecida al alcohol: sus efectos son similares a tener 0,5 g/l de alcohol en sangre.' } ],
  /* 5 · Vehículos livianos */ [
    { q:'En vehículos livianos, ¿cuál es una situación de riesgo frecuente?', c:0,
      o:['El regreso a casa después de una jornada extensa.','Conducir descansado y con pausas planificadas.','Revisar el vehículo antes de salir.','Planificar el recorrido con anticipación.'],
      e:'El regreso a casa después del turno suele hacerse con el cansancio acumulado de toda la jornada. Que el vehículo sea liviano no significa que el riesgo sea menor.' } ],
  /* 6 · Vehículos pesados */ [
    { q:'En un vehículo pesado, una maniobra brusca por un microsueño puede…', c:3,
      o:['Reducir la distancia de frenado.','No tener consecuencias gracias al peso de la unidad.','Mejorar el control del vehículo.','Desestabilizar la unidad y desplazar la carga.'],
      e:'Las correcciones bruscas pueden desestabilizar la unidad y la carga. En un pesado, el margen para corregir un error es menor.' } ],
  /* 7 · Prevención antes del viaje */ [
    { q:'Mañana tenés que hacer un viaje largo. ¿Cuál es la mejor planificación?', c:1,
      o:['Salir de madrugada para "ganar tiempo".','Salir descansado, con un tiempo realista que incluya pausas.','Salir apenas termina la jornada de hoy.','No estimar la duración: se ve en el camino.'],
      e:'Salir descansado y con un tiempo realista, que incluya pausas y margen para imprevistos, reduce el riesgo desde el inicio.' } ],
  /* 8 · Mito: café y descanso */ [
    { q:'Para combatir la somnolencia al volante, ¿qué es correcto?', c:2,
      o:['Abrir la ventanilla la elimina.','Subir el volumen de la radio evita dormirse.','Ni la ventanilla, ni la radio, ni el café la eliminan: solo el descanso.','Una bebida energizante reemplaza el descanso.'],
      e:'Son mitos: pueden dar una sensación momentánea de alerta, pero no eliminan la somnolencia. La fatiga se resuelve descansando.' } ],
  /* 9 · Qué hacer ante la fatiga */ [
    { q:'Te detuviste a descansar por somnolencia. ¿Cuándo retomar la marcha?', c:0,
      o:['Solo cuando ya no haya señales de fatiga; si persisten, coordinar con la base.','En cuanto termines el café.','Apenas se cumpla el horario que tenías previsto.','Enseguida, si faltan pocos kilómetros.'],
      e:'Retomá únicamente si ya no hay señales de fatiga. Si persisten, no continúes y coordiná alternativas con la base.' } ]
];

/** Todas las versiones de cada tema (la original primero). */
const BANCO = CONTENT.quiz.map((q, k) => [q].concat(VARIANTES[k] || []));
function preguntaDe(k, v){ return (BANCO[k] && BANCO[k][v]) || CONTENT.quiz[k]; }

/** ¿La respuesta guardada para el tema k es correcta? Acepta el formato anterior (número = opción de la
    pregunta original) y el nuevo ({ v:versión, a:opción original elegida }). */
function respOk(resp, k){
  if(resp == null || !CONTENT.quiz[k]) return false;
  if(typeof resp === 'number') return resp === CONTENT.quiz[k].c;
  if(typeof resp === 'object' && resp.a != null) return +resp.a === preguntaDe(k, +resp.v || 0).c;
  return false;
}

/** Sortea una evaluación: una versión por tema y opciones en orden aleatorio. */
function sortearEvaluacion(){
  const azar = n => { const a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return a[0] % n; };
  return CONTENT.quiz.map((_, k) => {
    const v = azar(BANCO[k].length), q = BANCO[k][v], orden = q.o.map((_, i) => i);
    for(let i = orden.length - 1; i > 0; i--){ const j = azar(i + 1); [orden[i], orden[j]] = [orden[j], orden[i]]; }
    return { k, v, orden };
  });
}
/** Pregunta tal como se muestra (opciones en el orden sorteado; c = posición de la correcta en ese orden). */
function vistaPregunta(p){
  const q = preguntaDe(p.k, p.v);
  return { q:q.q, e:q.e, o:p.orden.map(i => q.o[i]), c:p.orden.indexOf(q.c) };
}
