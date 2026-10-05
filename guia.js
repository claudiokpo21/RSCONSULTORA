'use strict';
/* guia.js — GUÍA DEL CAPACITADOR (A4, para imprimir)
   Agenda de 90 minutos, pantalla por pantalla y checklist del día. Los tiempos se editan en AGENDA y PANTALLAS.
   RS Consultora · Fatiga y Conducción Segura */

const AGENDA = [
  { min:10, t:'Recepción y diagnóstico inicial', d:'Bienvenida. Proyectar el QR del diagnóstico (Administración → Jornadas → Links y QR) mientras la gente se acomoda: 5 preguntas, anónimo.' },
  { min:40, t:'Presentación (21 pantallas + 6 videos)', d:'Ver el detalle pantalla por pantalla en la hoja 2. Usar el control remoto desde el celular.' },
  { min:15, t:'Desafío en vivo', d:'Abrir el desafío desde la pantalla 20 (o con el link de la jornada). Esperar a que entren todos antes de comenzar. 10 preguntas, resumen del grupo y podio.' },
  { min:15, t:'Evaluación individual', d:'QR de la evaluación (pantalla 21 o podio del desafío). Firma, 10 preguntas, constancia y opinión. Recorrer el salón para ayudar.' },
  { min:10, t:'Cierre', d:'Dudas, mensaje final: «Detenerse a tiempo también es seguridad». Recordar que en 30 días llega el refuerzo.' }
];

// [pantalla, minutos, qué hacer, qué decir / remarcar]
const PANTALLAS = [
  [1, 1, 'Presentarse y presentar a RS Consultora.', 'Objetivo: que todos vuelvan a casa. No es una charla para culpar a nadie.'],
  [2, 2, 'Tocar los objetivos.', 'Al final van a saber reconocer la fatiga y cuándo detenerse.'],
  [3, 2, '▶ Video «¿Qué es la fatiga?» (0:49). Alternar descansado / fatigado.', 'La fatiga no siempre se siente: hay que reconocerla.'],
  [4, 3, 'Tocar cansancio, fatiga y somnolencia.', 'Preguntar: ¿quién manejó alguna vez con sueño? (a mano alzada).'],
  [5, 4, '▶ Video «¿Qué favorece la fatiga?» (0:54). Tocar factores.', 'Relacionar con los turnos y horarios reales de la empresa.'],
  [6, 1, 'Mostrar la cadena del sueño.', 'Dormir no es perder tiempo: es una medida de seguridad.'],
  [7, 2, 'Tocar las franjas horarias.', 'Madrugada, primeras horas, después del almuerzo y final de jornadas largas.'],
  [8, 3, '▶ Video «Señales de alerta» (1:05). Juego de señales.', 'El cuerpo avisa antes: el riesgo es ignorar los avisos.'],
  [9, 3, 'Simulador de microsueño (con sonido): probar 100 km/h y 3 s.', '83 metros sin control. Preguntar: ¿qué hay en 83 metros de su ruta?'],
  [10, 2, '▶ Video «Livianos y pesados» (0:50). Situaciones de riesgo.', 'Liviano no significa menos riesgo: el regreso a casa después del turno.'],
  [11, 2, 'Factores de los vehículos pesados.', 'Más masa, más distancia de frenado: menos margen para corregir.'],
  [12, 1, 'Comparación liviano / pesado.', 'En los dos casos la reacción tardía se suma a la distancia de frenado.'],
  [13, 3, 'Mito o realidad: que el grupo vote antes de revelar.', 'Café, ventanilla y radio no reemplazan el descanso.'],
  [14, 2, 'Caso práctico 1: votar a mano alzada y revelar.', 'No existe una distancia «segura» si hay somnolencia.'],
  [15, 2, 'Caso práctico 2.', 'El horario se reprograma; un incidente, no.'],
  [16, 2, '▶ Video «Si aparece la fatiga» (0:46). Secuencia de 6 pasos.', 'Comunicar no es un problema: permite reprogramar.'],
  [17, 2, '▶ Video «Prevenir la fatiga» (0:49). Antes y durante el viaje.', 'Pausas según la política de la empresa.'],
  [18, 1, 'Planificación de viajes: armar el plan con el grupo.', 'Salir descansado, con tiempo realista y pausas.'],
  [19, 1, 'Decisión segura: elegir entre todos.', 'Llegar un poco más tarde también es llegar bien.'],
  [20, 1, 'Cierre de la presentación → «Desafío en vivo».', 'Detenerse a tiempo también es seguridad.'],
  [21, 0, 'QR de la evaluación (después del desafío).', 'Se aprueba con el ' + CONFIG.aprobacion.porcentajeMinimo + ' % o más.']
];

const CHECK = [
  ['El día anterior', ['Crear la jornada en Administración (empresa, lugar, fecha, email de contacto).', 'Abrir la presentación con el link de la jornada y tocar «Usar sin internet» para descargar los videos.', 'Probar el control remoto con el celular.', 'Imprimir esta guía y cargar el celular y la notebook.']],
  ['Al llegar (30 min antes)', ['Proyector y sonido: reproducir 10 segundos de un video.', 'Internet: wifi del lugar o datos del celular compartidos.', 'Abrir la presentación (link de la jornada), pantalla completa (tecla F) y vincular el control remoto.', 'Tener a mano el QR del diagnóstico.']],
  ['Al terminar', ['Verificar en Administración que estén todos los registros y firmas.', 'Cerrar la jornada.', 'Abrir el informe y compartirlo con el cliente (Compartir con el cliente).', 'Enviar el link del refuerzo a los ' + ((CONFIG.reportes && CONFIG.reportes.refuerzoDias) || 30) + ' días (Jornadas → Links y QR).']],
  ['Si falla internet', ['La presentación y los videos funcionan sin conexión si se descargaron antes.', 'El desafío en vivo necesita internet: si no hay, hacer las preguntas a mano alzada.', 'La evaluación se puede hacer igual: los resultados quedan guardados en cada celular y se envían solos cuando vuelve la señal.']]
];

(function(){
  const root = $('#report'), fmt = m => `${String(Math.floor(m / 60)).padStart(1, '0')}:${String(m % 60).padStart(2, '0')}`;
  let acc = 0;
  const agenda = AGENDA.map(a => { const r = `<tr><td class="g-t">${fmt(acc)} – ${fmt(acc + a.min)}</td><td><b>${esc(a.t)}</b><br><span>${esc(a.d)}</span></td><td class="g-m">${a.min} min</td></tr>`; acc += a.min; return r; }).join('');
  const total = acc; acc = 10;
  const pantallas = PANTALLAS.map(([n, m, h, d]) => { const r = `<tr><td class="g-n">${n}</td><td class="g-t">${fmt(acc)}</td><td>${esc(h)}</td><td><i>${esc(d)}</i></td></tr>`; acc += m; return r; }).join('');
  const head = sub => `<header class="r-head"><div class="r-brand"><span class="r-mark">${esc(CONFIG.consultora.iniciales)}</span><div><b>${esc(CONFIG.consultora.nombre)}</b><small>Guía del capacitador</small></div></div><div class="r-meta">${esc(sub)}</div></header>`;
  root.innerHTML = `
  <section class="sheet">
    ${head('Hoja 1 de 2')}
    <h1 class="r-title">Guía del capacitador</h1>
    <p class="r-sub">${esc(CONFIG.capacitacion.nombre)} · ${esc(capacitador())} · Duración total: ${total} minutos</p>
    <h2 class="r-h2">Agenda</h2>
    <table class="g-tab">${agenda}</table>
    <h2 class="r-h2">Checklist</h2>
    <div class="g-check">${CHECK.map(([t, items]) => `<div><h3 class="r-h3">${esc(t)}</h3><ul>${items.map(i => `<li><span class="box"></span>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
  </section>
  <section class="sheet">
    ${head('Hoja 2 de 2')}
    <h2 class="r-h2" style="margin-top:0">Pantalla por pantalla</h2>
    <p class="r-note">«Hora»: minuto previsto desde el inicio de la jornada. Si vas atrasado, acortá los casos prácticos (14 y 15) o el debate de mitos.</p>
    <table class="g-tab g-pan"><thead><tr><th>N.º</th><th>Hora</th><th>Qué hacer</th><th>Qué remarcar</th></tr></thead><tbody>${pantallas}</tbody></table>
    <p class="r-note" style="margin-top:4mm">Teclas: <b>→</b> siguiente · <b>←</b> anterior · <b>F</b> pantalla completa · <b>V</b> video · <b>Esc</b> cerrar video. Todo se maneja también desde el control remoto (ícono del celular).</p>
  </section>`;
  $('#tbPrint').onclick = () => window.print();
})();
