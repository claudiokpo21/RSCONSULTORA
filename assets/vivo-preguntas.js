'use strict';
/* vivo-preguntas.js — PREGUNTAS DEL DESAFÍO EN VIVO (editables)
   Tipos:
     'quiz'     → pregunta con 2 a 4 opciones y una correcta (c = índice de la correcta)
     'vf'       → mito o realidad (c: 0 = MITO, 1 = REALIDAD)
     'encuesta' → sondeo anónimo sin respuesta correcta (no suma puntos; solo se muestran totales)
   e = explicación que se muestra en la pantalla grande después de responder.
   RS Consultora · Fatiga y Conducción Segura */

const VIVO_PREGUNTAS = [
  { tipo:'encuesta', q:'Para empezar: ¿alguna vez sentiste somnolencia mientras manejabas?',
    o:['Sí, varias veces','Alguna vez','Nunca'],
    e:'Es más común de lo que parece. Reconocerlo es el primer paso para prevenirlo. Las respuestas son anónimas: solo se muestran los totales.' },
  { tipo:'vf', q:'“Abrir la ventanilla elimina la somnolencia.”', c:0,
    e:'MITO. El aire fresco da una sensación momentánea de alerta, pero no elimina la somnolencia. Solo el descanso la resuelve.' },
  { tipo:'quiz', q:'¿Cuál de estas es una señal de alerta de fatiga?', c:1,
    o:['Mirar los espejos con regularidad','Olvidar los últimos kilómetros recorridos','Mantener la distancia de seguimiento','Respetar la velocidad máxima'],
    e:'No recordar los últimos kilómetros indica que la atención estuvo disminuida. Es momento de detenerse en un lugar seguro.' },
  { tipo:'quiz', q:'A 100 km/h, una pérdida de atención de 3 segundos equivale a recorrer aproximadamente…', c:2,
    o:['8 metros','25 metros','83 metros','300 metros'],
    e:'100 km/h ÷ 3,6 × 3 s ≈ 83 metros sin controlar el vehículo. Casi una cuadra.' },
  { tipo:'vf', q:'“Tomar café reemplaza el descanso.”', c:0,
    e:'MITO. La cafeína puede disimular el cansancio por un rato, pero no reemplaza el sueño.' },
  { tipo:'quiz', q:'¿En cuál de estos momentos aumenta más la tendencia al sueño?', c:1,
    o:['Media mañana','Madrugada','Última hora de la tarde'],
    e:'La madrugada es el período de mayor tendencia al sueño. También hay que prestar atención a las primeras horas de la mañana, después del almuerzo y al final de jornadas largas.' },
  { tipo:'quiz', q:'Vas con retraso y sentís los ojos pesados. ¿Qué hacés?', c:2,
    o:['Acelero para recuperar tiempo','Tomo un energizante y sigo','Aviso a la base y me detengo en un lugar seguro','Subo el volumen de la radio'],
    e:'El horario se puede reprogramar. Comunicar a tiempo y detenerse en un lugar seguro es la conducta correcta. Nunca acelerar para compensar.' },
  { tipo:'vf', q:'“Si el vehículo es liviano, el riesgo por fatiga es menor.”', c:0,
    e:'MITO. La fatiga afecta a todos los conductores. Lo que cambia con el vehículo son las consecuencias y la forma de gestionar el riesgo.' },
  { tipo:'quiz', q:'Te detuviste en un lugar seguro porque tenés sueño. ¿Cuál es el paso siguiente?', c:1,
    o:['Retomar enseguida','Comunicar la situación','Acelerar al retomar','Esperar 2 minutos y seguir'],
    e:'Reconocer → reducir el riesgo → detenerse → COMUNICAR → descansar → retomar solo cuando sea seguro.' },
  { tipo:'encuesta', q:'Para cerrar: ¿qué medida te comprometés a aplicar desde hoy?',
    o:['Dormir bien antes de viajar','Planificar pausas','Detenerme y avisar si tengo sueño','Hidratarme durante el viaje'],
    e:'Cada compromiso cuenta. Detenerse a tiempo también es seguridad.' }
];
