'use strict';
/* content.js — CONTENIDO DE LA CAPACITACIÓN (textos, casos, preguntas)
   RS Consultora · Fatiga y Conducción Segura */

/* =====================================================================
   b) CONTENIDO DE LA CAPACITACIÓN
   ===================================================================== */
const CONTENT = {
  objetivos: [
    { icon:'eye', t:'Reconocer qué es la fatiga', d:'Y en qué se diferencia del cansancio y la somnolencia.' },
    { icon:'alert', t:'Identificar factores de riesgo', d:'Qué situaciones favorecen su aparición.' },
    { icon:'activity', t:'Detectar señales de alerta', d:'Las propias y las que se reflejan en la conducción.' },
    { icon:'steering', t:'Comprender sus efectos', d:'Cómo afecta la conducción de vehículos livianos y pesados.' },
    { icon:'shield', t:'Conocer medidas preventivas', d:'Antes y durante cada viaje.' },
    { icon:'stop', t:'Saber cuándo detenerse', d:'Y cómo comunicar la situación a tiempo.' }
  ],
  efectos: ['Menor atención','Mayor tiempo de reacción','Dificultad para mantener la concentración','Errores de percepción','Toma de decisiones más lenta','Microsueños','Pérdida de control del vehículo'],
  medidores: [
    { t:'Atención', ok:92, bad:38 }, { t:'Rapidez de reacción', ok:88, bad:34 },
    { t:'Concentración', ok:90, bad:36 }, { t:'Percepción del entorno', ok:86, bad:44 },
    { t:'Toma de decisiones', ok:88, bad:40 }
  ],
  conceptos: {
    cansancio: { nombre:'CANSANCIO', icon:'hourglass', c:'var(--steel)', cs:'var(--steel-soft)', nivel:2, nivelTxt:'Riesgo moderado si no se gestiona',
      def:'Sensación de agotamiento que aparece después de un esfuerzo físico o mental. En general se recupera con una pausa o descanso.',
      ej:['Después de una tarea física intensa.','Tras varias horas seguidas de conducción.','Al final de un día de mucha actividad.'],
      riesgo:'Disminuye la atención y la comodidad al conducir. Si no se atiende con pausas y descanso, puede evolucionar hacia la fatiga.' },
    fatiga: { nombre:'FATIGA', icon:'activity', c:'var(--amber)', cs:'var(--amber-soft)', nivel:3, nivelTxt:'Riesgo alto',
      def:'Estado de cansancio físico y/o mental, a menudo acumulado, que disminuye la capacidad para realizar una tarea de manera segura. No siempre se resuelve con una pausa corta.',
      ej:['Varios días seguidos durmiendo poco.','Turnos rotativos o nocturnos sostenidos.','Jornadas extensas con horas extras.'],
      riesgo:'Reacción más lenta, errores de percepción, decisiones más lentas y menor capacidad para responder ante imprevistos.' },
    somnolencia: { nombre:'SOMNOLENCIA', icon:'eyeoff', c:'var(--red)', cs:'var(--red-soft)', nivel:4, nivelTxt:'Riesgo muy alto: detenerse',
      def:'Tendencia a quedarse dormido y dificultad para mantenerse despierto. Es la señal más directa de que el cuerpo necesita dormir.',
      ej:['Párpados pesados y bostezos frecuentes.','Cabeceos o "cerrar los ojos un segundo".','No recordar los últimos kilómetros.'],
      riesgo:'Puede llevar a microsueños: una pérdida momentánea de la conciencia del entorno mientras el vehículo sigue en movimiento.' }
  },
  factores: [
    { icon:'eyeoff', t:'Falta de sueño', d:'El cuerpo necesita dormir para recuperarse. Cuando el sueño es insuficiente, la atención y la capacidad de reacción disminuyen, aunque la persona no siempre lo perciba.' },
    { icon:'bed', t:'Dormir pocas horas', d:'Dormir menos de lo habitual genera una "deuda de sueño" que se acumula si se repite varios días seguidos.' },
    { icon:'clock', t:'Jornadas prolongadas', d:'Cuantas más horas de actividad continua, mayor es el desgaste físico y mental al momento de conducir.' },
    { icon:'moon', t:'Turnos nocturnos', d:'Trabajar o conducir de noche va en contra del ritmo natural del cuerpo, que en ese horario tiende a descansar.' },
    { icon:'repeat', t:'Horarios rotativos', d:'Los cambios frecuentes de horario dificultan que el cuerpo se adapte y que el descanso sea de buena calidad.' },
    { icon:'calendar', t:'Horas extras', d:'Extender la jornada reduce el tiempo disponible para descansar antes del próximo turno o del viaje de regreso.' },
    { icon:'steering', t:'Conducción prolongada', d:'Manejar muchas horas seguidas exige atención sostenida. Sin pausas, el rendimiento cae progresivamente.' },
    { icon:'road', t:'Monotonía', d:'Rutas rectas, paisajes repetitivos y poco tránsito reducen los estímulos y favorecen la somnolencia.' },
    { icon:'thermo', t:'Calor o frío extremo', d:'Las temperaturas extremas, dentro o fuera de la cabina, aumentan el desgaste del organismo y la incomodidad.' },
    { icon:'food', t:'Mala alimentación', d:'Saltear comidas o comer en exceso antes de manejar puede provocar baja de energía o somnolencia.' },
    { icon:'droplet', t:'Deshidratación', d:'No tomar suficiente agua afecta la concentración y aumenta la sensación de cansancio.' },
    { icon:'zap', t:'Estrés', d:'Las preocupaciones y la presión por los tiempos consumen energía mental y dificultan el descanso.' },
    { icon:'pill', t:'Algunos medicamentos', d:'Ciertos medicamentos pueden producir somnolencia. Consultá al médico o farmacéutico y leé el prospecto antes de conducir.' },
    { icon:'glass', t:'Alcohol u otras sustancias', d:'Alteran la percepción, la coordinación y el juicio, y potencian los efectos de la fatiga. Son incompatibles con la conducción.' }
  ],
  cadena: [
    { icon:'bed', t:'Dormir poco', c:'var(--steel)' }, { icon:'eyeoff', t:'Mayor somnolencia' },
    { icon:'eye', t:'Menor atención' }, { icon:'hourglass', t:'Mayor tiempo de reacción' },
    { icon:'alert', t:'Mayor riesgo', c:'var(--red)' }
  ],
  franjas: [
    { id:'madrugada', h:'00–06 h', t:'Madrugada', span:6, riesgo:true, night:true, exp:'El reloj biológico favorece el sueño: es el período de mayor tendencia a dormirse.' },
    { id:'manana', h:'06–09 h', t:'Primeras horas de la mañana', span:3, riesgo:true, exp:'El cuerpo todavía puede estar en "modo descanso", sobre todo después de una noche de poco sueño o un turno nocturno.' },
    { id:'media', h:'09–13 h', t:'Media mañana', span:4, riesgo:false, exp:'Suele ser un período de mayor estado de alerta, siempre que se haya descansado bien.' },
    { id:'almuerzo', h:'13–16 h', t:'Después del almuerzo', span:3, riesgo:true, exp:'Hay una baja natural del estado de alerta a primera hora de la tarde, que se suma a la digestión.' },
    { id:'tarde', h:'16–19 h', t:'Tarde', span:3, riesgo:false, exp:'En general el nivel de alerta se recupera, aunque depende del descanso y de la carga de la jornada.' },
    { id:'noche', h:'19–24 h', t:'Noche', span:5, riesgo:false, night:true, exp:'No es de los períodos más críticos señalados, pero el riesgo aumenta a medida que se avanza hacia la madrugada.' }
  ],
  finJornada: { id:'fin', t:'Final de una jornada prolongada (cualquier horario)', riesgo:true, exp:'El desgaste acumulado reduce la atención, sin importar la hora del día.' },
  senales: [
    { icon:'yawn', t:'Bostezos frecuentes', s:true }, { icon:'eyeoff', t:'Párpados pesados', s:true },
    { icon:'eye', t:'Dificultad para mantener los ojos abiertos', s:true }, { icon:'brain', t:'Desconcentración', s:true },
    { icon:'target', t:'Mirar los espejos con regularidad', s:false },
    { icon:'hourglass', t:'Pensamiento lento', s:true }, { icon:'road', t:'Olvidar los últimos kilómetros recorridos', s:true },
    { icon:'lane', t:'Desvíos involuntarios del carril', s:true }, { icon:'brake', t:'Frenadas tardías', s:true },
    { icon:'sign', t:'No recordar señales o carteles', s:true },
    { icon:'ruler', t:'Mantener una distancia de seguimiento constante', s:false },
    { icon:'activity', t:'Reacciones más lentas', s:true }, { icon:'move', t:'Necesidad constante de cambiar de posición', s:true },
    { icon:'moon', t:'Microsueños', s:true }
  ],
  livianos: {
    tipos: [
      { icon:'car', t:'Automóviles', d:'Traslados de personal, recorridas y viajes cortos o largos.' },
      { icon:'car', t:'Camionetas', d:'Uso intensivo en rutas, caminos internos y yacimientos.' },
      { icon:'truck', t:'Utilitarios', d:'Transporte de herramientas, materiales y cuadrillas.' }
    ],
    situaciones: [
      { icon:'home', t:'Traslados hacia y desde el trabajo', d:'El regreso a casa después del turno suele hacerse con el cansancio acumulado de toda la jornada.' },
      { icon:'road', t:'Viajes por ruta', d:'Velocidades mayores y tramos monótonos: un segundo de distracción implica muchos metros recorridos.' },
      { icon:'building', t:'Conducción urbana', d:'Mucha información para procesar: peatones, semáforos, motos. La fatiga reduce la capacidad de anticipar.' },
      { icon:'clock', t:'Viajes prolongados', d:'Muchas horas al volante sin pausas planificadas aumentan progresivamente el riesgo.' },
      { icon:'moon', t:'Después de jornadas extensas', d:'Conducir al final de un turno largo o con horas extras suma el desgaste de todo el día.' }
    ]
  },
  pesados: {
    tipos: [
      { icon:'truck', t:'Camiones', d:'Transporte de cargas generales, fluidos, materiales y equipos.' },
      { icon:'box', t:'Equipos de transporte', d:'Semirremolques, cisternas, hidrogrúas y equipos especiales.' },
      { icon:'truck', t:'Vehículos de gran porte', d:'Unidades de gran tamaño que requieren planificación y maniobras cuidadosas.' }
    ],
    factores: [
      { icon:'weight', t:'Mayor masa', d:'Más peso implica más energía en movimiento, que es más difícil de controlar y detener.' },
      { icon:'brake', t:'Mayor distancia de frenado', d:'Necesita más metros para detenerse. Una reacción tardía se traduce en mucha más distancia.' },
      { icon:'steering', t:'Mayor dificultad para maniobrar', d:'Las correcciones bruscas pueden desestabilizar la unidad y la carga.' },
      { icon:'zap', t:'Mayor energía en una colisión', d:'Las consecuencias pueden alcanzar a más personas y vehículos.' },
      { icon:'box', t:'Cargas transportadas', d:'Pueden desplazarse, ser voluminosas o peligrosas, y agregan riesgo ante un error.' },
      { icon:'clock', t:'Jornadas prolongadas', d:'Los recorridos largos suelen implicar muchas horas de actividad.' },
      { icon:'hourglass', t:'Conducción por períodos extensos', d:'La exposición continua a la monotonía de la ruta favorece la aparición de la fatiga.' }
    ]
  },
  comparacion: [
    { icon:'steering', t:'Maniobrabilidad', l:'Mayor agilidad para esquivar o corregir.', p:'Maniobras más lentas; requieren más espacio y anticipación.', n:'Con fatiga, la capacidad de corregir a tiempo disminuye en ambos. En un pesado, el margen es menor.' },
    { icon:'brake', t:'Distancia de frenado', l:'Menor, aunque aumenta con la velocidad.', p:'Mayor, por la masa y la carga.', n:'Una reacción tardía por fatiga se suma a la distancia de frenado del vehículo.' },
    { icon:'weight', t:'Masa', l:'Menor.', p:'Muy superior.', n:'A mayor masa, mayor energía involucrada si ocurre un error.' },
    { icon:'eye', t:'Visibilidad', l:'Buena visibilidad general; puntos ciegos acotados.', p:'Puntos ciegos más amplios alrededor de la cabina y el acoplado.', n:'La fatiga reduce la frecuencia y la calidad de los controles visuales (espejos, entorno).' },
    { icon:'box', t:'Carga', l:'Pasajeros, herramientas o equipos livianos.', p:'Cargas de gran volumen o peso, a veces peligrosas.', n:'Una maniobra brusca por un microsueño puede desplazar la carga.' },
    { icon:'alert', t:'Consecuencias de una pérdida de atención', l:'Pueden ser graves para ocupantes y terceros.', p:'Suelen involucrar más energía y afectar a más personas.', n:'En ambos casos, unos pocos segundos sin control pueden tener consecuencias serias.' },
    { icon:'clipboard', t:'Necesidad de planificación', l:'Traslados cotidianos que también requieren descanso y planificación.', p:'Planificación detallada de recorridos, pausas y relevos.', n:'Planificar es la principal herramienta para gestionar el riesgo de fatiga.' }
  ],
  mitos: [
    { q:'Abrir la ventanilla elimina la somnolencia.', r:false, e:'El aire fresco puede dar una sensación momentánea de alerta, pero no elimina la somnolencia. Solo el descanso la resuelve.' },
    { q:'Subir el volumen de la radio evita dormirse.', r:false, e:'La música fuerte no impide los microsueños y, además, puede distraer.' },
    { q:'Tomar café reemplaza el descanso.', r:false, e:'La cafeína puede disimular el cansancio por un rato, pero no reemplaza el sueño. Cuando su efecto baja, la fatiga sigue ahí.' },
    { q:'Si faltan pocos kilómetros, puedo continuar.', r:false, e:'Un microsueño puede ocurrir en cualquier tramo. Los últimos kilómetros no son más seguros si hay somnolencia.' },
    { q:'Una ducha fría elimina la fatiga.', r:false, e:'Puede despejar por un momento, pero no recupera al organismo. La fatiga se resuelve descansando.' },
    { q:'Si siento sueño, debo tomarlo como una señal de alerta.', r:true, e:'La somnolencia es un aviso del cuerpo: es momento de detenerse en un lugar seguro, comunicar y descansar.' }
  ],
  casos: [
    { icon:'car', tags:['Vehículo liviano','Regreso a domicilio','150 km'],
      s:'Un conductor termina una jornada extensa. Debe conducir 150 km hasta su domicilio. Durante el viaje comienza a bostezar, siente pesadez en los ojos y nota que le cuesta mantener la concentración.',
      q:'¿Qué debería hacer?', c:3,
      o:[ { t:'Subir el volumen de la radio.', e:'La radio no elimina la somnolencia y puede distraer. El riesgo sigue presente.' },
          { t:'Abrir la ventanilla.', e:'El aire fresco da una sensación momentánea de alerta, pero no resuelve la fatiga.' },
          { t:'Continuar porque faltan pocos kilómetros.', e:'Un microsueño puede ocurrir en cualquier tramo. No existe una distancia "segura" cuando aparece la somnolencia.' },
          { t:'Detenerse en un lugar seguro y comunicar la situación.', e:'Es la conducta segura: detenerse en un lugar seguro, comunicar la situación y descansar antes de continuar.' } ] },
    { icon:'truck', tags:['Vehículo pesado','Pocas horas de sueño','Mitad del recorrido'],
      s:'Un conductor de vehículo pesado comienza su turno después de haber dormido pocas horas. A mitad del recorrido empieza a tener dificultades para concentrarse.',
      q:'¿Cuál es la conducta correcta?', c:2,
      o:[ { t:'Continuar para cumplir el horario.', e:'Cumplir un horario nunca justifica conducir con fatiga. El horario se puede reprogramar; un incidente, no.' },
          { t:'Tomar una bebida energizante y continuar.', e:'Las bebidas energizantes no reemplazan el descanso y pueden generar una falsa sensación de alerta.' },
          { t:'Informar la situación y detenerse de manera segura.', e:'Es la conducta correcta. Informar permite a la organización reprogramar, relevar o reorganizar la tarea de forma segura.' },
          { t:'Aumentar la velocidad para terminar antes.', e:'Aumentar la velocidad incrementa la distancia recorrida durante una distracción y la distancia de frenado. Nunca es una opción.' } ] }
  ],
  secuencia: [
    { icon:'eye', t:'RECONOCER', d:'Identificá tus propias señales: bostezos, párpados pesados, desconcentración, olvidar tramos recorridos.' },
    { icon:'shield', t:'REDUCIR EL RIESGO', d:'No aceleres. Aumentá la distancia con el vehículo de adelante, evitá maniobras y empezá a buscar dónde detenerte.' },
    { icon:'stop', t:'DETENERSE EN UN LUGAR SEGURO', d:'Área de descanso, estación de servicio, playa de estacionamiento o banquina amplia. Señalizá correctamente.', cls:'stop' },
    { icon:'message', t:'COMUNICAR', d:'Avisá a tu supervisor, base o coordinación según el procedimiento interno. Comunicar a tiempo es parte del trabajo seguro.' },
    { icon:'bed', t:'DESCANSAR', d:'Tomá el descanso necesario. Una pausa breve puede no ser suficiente si la somnolencia persiste.' },
    { icon:'check', t:'RETOMAR SOLO CUANDO SEA SEGURO', d:'Retomá únicamente si ya no hay señales de fatiga. Si persisten, no continúes y coordiná alternativas con la base.', cls:'go' }
  ],
  prevencion: {
    antes: ['Dormir adecuadamente.','Planificar el recorrido.','Revisar duración y horarios.','Considerar pausas.','Evitar iniciar un viaje estando fatigado.','Evitar comidas abundantes antes de salir.'],
    durante: ['Realizar pausas.','Hidratarse.','Prestar atención a las señales de fatiga.','Informar cualquier condición insegura.','Hacer estiramientos en cada pausa.','No continuar si existe somnolencia.']
  },
  plan: {
    escenario:'Tenés que realizar un traslado de aproximadamente 400 km por ruta hasta una locación de trabajo. El viaje es mañana y hoy terminás tu jornada a las 18:00.',
    preguntas: [
      { id:'salida', icon:'clock', t:'Horario de salida', o:[
        { t:'03:00 — salir de madrugada para "ganar tiempo".', ok:false, f:'La madrugada es uno de los períodos de mayor tendencia al sueño.' },
        { t:'08:00 — después de una noche de descanso.', ok:true, f:'Salir descansado y con luz de día reduce el riesgo.' },
        { t:'Hoy a las 18:30 — apenas termina la jornada.', ok:false, f:'Iniciar un viaje largo al final de la jornada suma el desgaste acumulado.' } ] },
      { id:'duracion', icon:'hourglass', t:'Duración estimada', o:[
        { t:'Tiempo mínimo posible, sin margen.', ok:false, f:'Sin margen, cualquier demora genera presión por llegar y tentación de acelerar u omitir pausas.' },
        { t:'No estimar: se ve en el camino.', ok:false, f:'Sin estimación no se pueden prever pausas ni informar un horario de llegada.' },
        { t:'Tiempo realista, con pausas y margen para imprevistos.', ok:true, f:'Un tiempo realista quita presión y evita la tentación de apurarse.' } ] },
      { id:'pausas', icon:'pause', t:'Pausas', o:[
        { t:'Pausas regulares en lugares seguros identificados de antemano.', ok:true, f:'Correcto. La frecuencia y duración deben respetar la política interna de la empresa.' },
        { t:'Solo parar para cargar combustible.', ok:false, f:'Las pausas deben planificarse para descansar, no solo por necesidades del vehículo.' },
        { t:'Sin pausas para llegar antes.', ok:false, f:'La conducción continua sin pausas es uno de los principales factores de fatiga.' } ] },
      { id:'descanso', icon:'bed', t:'Descanso previo', o:[
        { t:'Dormir pocas horas y compensar con café o energizantes.', ok:false, f:'Los estimulantes no reemplazan el sueño.' },
        { t:'Dormir adecuadamente la noche anterior.', ok:true, f:'El descanso previo es la base de un viaje seguro.' },
        { t:'Salir sin dormir y descansar al llegar.', ok:false, f:'Conducir sin haber dormido expone a microsueños durante todo el recorrido.' } ] },
      { id:'condiciones', icon:'route', t:'Condiciones de conducción', o:[
        { t:'No consultar nada: se resuelve en el camino.', ok:false, f:'Los imprevistos (clima, cortes de ruta) alargan el viaje y aumentan el cansancio.' },
        { t:'Consultar clima y estado de ruta, e informar el itinerario a la base.', ok:true, f:'Conocer las condiciones y que la base sepa tu recorrido permite actuar si algo cambia.' },
        { t:'Consultar el clima, pero no informar el recorrido.', ok:false, f:'Informar el itinerario permite saber dónde estás y reorganizar si surge un problema.' } ] }
    ]
  },
  decisiones: [
    { icon:'car', s:'Tenés sueño, faltan 20 km y estás cerca del destino.', o:[
      { t:'Continúo', ok:false, f:'Un microsueño puede ocurrir en cualquier tramo. Veinte kilómetros son suficientes para un incidente.' },
      { t:'Me detengo', ok:true, f:'Detenerse en un lugar seguro, comunicar y descansar. Llegar un poco más tarde también es llegar bien.' },
      { t:'Abro la ventanilla', ok:false, f:'El aire fresco no elimina la somnolencia: solo la disimula por unos minutos.' },
      { t:'Subo la radio', ok:false, f:'La música fuerte no impide los microsueños y suma distracción.' } ] },
    { icon:'truck', s:'Vas con retraso respecto del horario previsto y empezás a sentir los ojos pesados.', o:[
      { t:'Acelero para recuperar el tiempo', ok:false, f:'Aumentar la velocidad nunca compensa un retraso: aumenta la distancia recorrida sin control y la distancia de frenado.' },
      { t:'Aviso a la base y me detengo en un lugar seguro', ok:true, f:'Comunicar permite reprogramar. El horario se ajusta; la seguridad no se negocia.' },
      { t:'Tomo una bebida energizante y sigo', ok:false, f:'Los energizantes no reemplazan el descanso y pueden dar una falsa sensación de alerta.' },
      { t:'Sigo sin avisar para no generar problemas', ok:false, f:'Comunicar no genera un problema: permite a la organización reorganizar la tarea de forma segura.' } ] },
    { icon:'bed', s:'Te detuviste a descansar un rato, pero seguís bostezando y te cuesta concentrarte.', o:[
      { t:'Retomo: ya hice la pausa', ok:false, f:'Lo que define si retomar es tu estado, no el tiempo que pasó. Si las señales siguen, no es seguro.' },
      { t:'Retomo, pero manejo más despacio', ok:false, f:'Ir más despacio no evita un microsueño.' },
      { t:'Retomo y pido que alguien me hable por teléfono', ok:false, f:'Hablar por teléfono mientras se conduce es una distracción adicional y no resuelve la fatiga.' },
      { t:'Comunico la situación y no retomo hasta estar en condiciones', ok:true, f:'Correcto. Si la somnolencia persiste, se coordina con la base: más descanso, relevo u otra alternativa.' } ] }
  ],
  // Repaso rápido opcional antes de la evaluación individual
  repaso: [
    { icon:'eye', t:'La fatiga disminuye la capacidad de conducir de manera segura: afecta la atención, la reacción y las decisiones.' },
    { icon:'alert', t:'Señales de alerta: bostezos, párpados pesados, desconcentración, olvidar tramos recorridos, desvíos del carril.' },
    { icon:'moon', t:'Un microsueño dura pocos segundos, pero en ese tiempo el vehículo recorre muchos metros sin control.' },
    { icon:'clock', t:'Momentos de mayor riesgo: madrugada, primeras horas de la mañana, después del almuerzo y al final de jornadas largas.' },
    { icon:'x', t:'Abrir la ventanilla, subir la radio, el café o los energizantes NO reemplazan el descanso.' },
    { icon:'stop', t:'Ante la fatiga: detenerse en un lugar seguro, comunicar la situación y descansar. Nunca acelerar para compensar.' }
  ],
  // DATOS DE CONTEXTO — ANSV, Observatorio Vial Nacional: «Fatiga y estrés en la conducción de vehículos»
  // (Dossier N.º 5, diciembre de 2021). Se muestran siempre con su fuente y su año.
  datos: {
    // ref = número de la fuente en la bibliografía (pantalla Referencias).
    fuente: 'Fuente: ANSV · Observatorio Vial Nacional, Dossier N.º 5 «Fatiga y estrés en la conducción de vehículos» (2021). Bibliografía numerada en Referencias.',
    contexto: [
      { n:'99.221', t:'siniestros viales con víctimas en Argentina en 2019', ref:2 },
      { n:'4.911', t:'personas fallecidas en esos siniestros (2019)', ref:2 },
      { n:'1,35 millones', t:'de muertes por año en el tránsito en el mundo (OMS, 2018)', ref:1 }
    ],
    alcohol: 'Según estudios citados por la ANSV, la falta de sueño produce efectos similares a tener 0,5 g/l de alcohol en sangre [3].',
    pesados: [
      { n:'86 %', t:'de 738 camioneros encuestados tenía insuficiencia de sueño (Mercado Central de Buenos Aires, 2005).', ref:4 },
      { n:'45 %', t:'de esos camioneros dormía menos de 4 horas en los días de semana.', ref:4 },
      { n:'50 %', t:'del sueño de los choferes de larga distancia se hace fuera de casa: en hoteles o en el vehículo (2019).', ref:5 },
      { n:'85 % → 66 %', t:'choferes que se sienten en condiciones al empezar y al terminar el viaje (SRT, 2009).', ref:6 }
    ]
  },
  // ESTRÉS AL VOLANTE (pantalla 6). Basado en el Dossier N.º 5 de la ANSV.
  estres: {
    def: 'Es la reacción del cuerpo ante una exigencia: se aceleran el corazón y la respiración y el cuerpo se prepara para «luchar o huir». Puede ayudar a reaccionar, pero se vuelve un problema cuando es muy intenso o se prolonga.',
    efectos: [
      { icon:'zap', t:'Agresividad', d:'Bocinazos, insultos o «pelear» el lugar en el tránsito. Aumentan los conflictos y las maniobras bruscas.' },
      { icon:'alert', t:'Imprudencia', d:'Acelerar, adelantarse sin margen o apurarse para «recuperar tiempo».' },
      { icon:'activity', t:'Impulsividad', d:'Decisiones rápidas sin medir el riesgo: frenadas, volantazos o cambios de carril bruscos.' }
    ],
    disparadores: ['Embotellamientos y cortes', 'Calor', 'Cansancio visual', 'Monotonía del recorrido', 'Presión por los horarios', 'Problemas personales'],
    senales: ['Malhumor e irritabilidad', 'Ansiedad o nervios', 'Corazón acelerado y respiración agitada', 'Ganas de «ganarle» a otro conductor'],
    hacer: ['Reconocé que estás estresado: ponerle nombre ayuda a controlarlo.', 'No compitas en el tránsito: dejá pasar y aumentá la distancia.', 'Salí con tiempo: el apuro es uno de los mayores generadores de estrés.', 'Si estás muy alterado, detenete en un lugar seguro y hacé una pausa.']
  },
  quiz: [
    { q:'¿Cuál es la mejor definición de fatiga?', c:1, e:'La fatiga es un estado de cansancio físico y/o mental que disminuye la capacidad de realizar una tarea de manera segura.',
      o:['Una sensación que desaparece al subir el volumen de la radio.','Un estado de cansancio físico y/o mental que disminuye la capacidad de realizar una tarea de manera segura.','Un problema que afecta únicamente a conductores de camiones.','La falta de experiencia al volante.'] },
    { q:'¿Cuál de estas situaciones es una señal de alerta de fatiga?', c:2, e:'Olvidar los últimos kilómetros recorridos indica que la atención estuvo disminuida. Es momento de detenerse.',
      o:['Mirar los espejos con regularidad.','Mantener una velocidad constante y segura.','No recordar los últimos kilómetros recorridos.','Respetar la distancia con el vehículo de adelante.'] },
    { q:'¿Qué es un microsueño?', c:1, e:'Es un episodio breve e involuntario de sueño o pérdida de atención de pocos segundos. Puede ocurrir con los ojos abiertos.',
      o:['Una siesta planificada durante una pausa.','Un episodio breve e involuntario de sueño o pérdida de atención, que puede ocurrir con los ojos abiertos.','Un sueño profundo de varias horas.','Una técnica para mantenerse despierto.'] },
    { q:'¿Cuál de los siguientes es un factor de riesgo de fatiga?', c:0, e:'Los turnos nocturnos y los horarios rotativos alteran el ritmo natural de sueño y descanso.',
      o:['Turnos nocturnos y horarios rotativos.','Planificar pausas durante el viaje.','Mantenerse hidratado.','Dormir adecuadamente antes de salir.'] },
    { q:'Sobre el sueño y la conducción, es correcto afirmar que:', c:1, e:'Dormir no es una pérdida de tiempo: es una medida de seguridad. Nada lo reemplaza.',
      o:['El café puede reemplazar una noche de sueño.','Dormir es una medida de seguridad, no una pérdida de tiempo.','El sueño solo importa a quienes manejan de noche.','Con experiencia, se puede manejar bien sin dormir.'] },
    { q:'Respecto a los vehículos livianos:', c:2, e:'La fatiga afecta a todos los conductores. Que el vehículo sea liviano no significa que el riesgo sea menor.',
      o:['Como son más ágiles, la fatiga no representa un riesgo.','En trayectos cortos se puede manejar con sueño.','Que el vehículo sea liviano no significa que el riesgo sea menor.','Solo hay riesgo en viajes de más de un día.'] },
    { q:'¿Por qué una pérdida de atención en un vehículo pesado puede tener consecuencias especialmente importantes?', c:0, e:'La mayor masa y la mayor distancia de frenado reducen el margen para corregir un error.',
      o:['Por su mayor masa y mayor distancia de frenado.','Porque los camiones son más lentos y nunca frenan tarde.','Porque sus conductores tienen menos experiencia.','No hay diferencia con un vehículo liviano.'] },
    { q:'¿Cuál es una conducta preventiva ANTES del viaje?', c:1, e:'Planificar el recorrido y las pausas, y descansar bien, reduce el riesgo desde el inicio.',
      o:['Salir inmediatamente después de un turno nocturno.','Planificar el recorrido, las pausas y dormir adecuadamente.','Planificar tomar bebidas energizantes durante el viaje.','No informar horarios para tener más flexibilidad.'] },
    { q:'"Tomar café reemplaza el descanso." Esta frase es:', c:1, e:'Es un mito. La cafeína puede disimular el cansancio por un tiempo, pero no reemplaza el sueño.',
      o:['Realidad.','Mito.','Realidad, si se toman varias tazas.'] },
    { q:'Si mientras conducís sentís somnolencia, lo correcto es:', c:3, e:'Detenerse en un lugar seguro, comunicar la situación y descansar. Retomar solo cuando sea seguro.',
      o:['Aumentar la velocidad para llegar antes.','Abrir la ventanilla y subir la radio.','Continuar si faltan pocos kilómetros.','Detenerse en un lugar seguro, comunicar la situación y descansar.'] }
  ]
};

