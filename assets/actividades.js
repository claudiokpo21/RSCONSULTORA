'use strict';
/* actividades.js — MENÚ DE ACTIVIDADES INTERACTIVAS (para el celular de cada participante o el proyector)
   Ninguna actividad pide datos ni guarda resultados.
   RS Consultora · Fatiga y Conducción Segura */

const ACTIVIDADES = [
  { href:'riesgos.html',   icon:'target',   t:'Encontrá los riesgos',  d:'Una cabina a las 3 de la mañana con 10 cosas que favorecen la fatiga. ¿Las encontrás todas?', min:'3 min' },
  { href:'conductor.html', icon:'user',     t:'El conductor cansado',  d:'Tocá cada parte del cuerpo y descubrí las señales con las que avisa la fatiga.', min:'2 min' },
  { href:'reloj.html',     icon:'clock',    t:'El reloj del cuerpo',   d:'Cómo sube y baja la alerta en las 24 horas, por qué da sueño después de comer y a qué hora conviene viajar.', min:'3 min' },
  { href:'deuda.html',     icon:'bed',      t:'La deuda de sueño',     d:'Marcá cuántas horas dormiste cada noche y mirá cómo se acumula la falta de sueño en la semana.', min:'2 min' },
  { href:'turno.html',     icon:'moon',     t:'Turno noche y vuelta a casa', d:'Después del turno nocturno, ¿con cuántas horas despierto manejás de regreso?', min:'2 min' },
  { href:'reaccion.html',  icon:'zap',      t:'Test de reacción',      d:'Medí tu reacción atento y con una simulación de cansancio. ¿Cuántos metros recorrés antes de frenar?', min:'2 min' },
  { href:'manejar.html',   icon:'steering', t:'Manejá vos',            d:'400 km de noche. Mantenete en el carril mientras aparece la fatiga y decidí cuándo parar.', min:'2 min' },
  { href:'ruta.html',      icon:'road',     t:'La ruta se apaga',      d:'Mové la barra de fatiga y mirá cómo cambia el viaje: parpadeos, desvíos y microsueño.', min:'2 min' }
];

initBrand();
$('#view').innerHTML = `<div class="act-head"><div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Fatiga y Conducción Segura</p><h1>ACTIVIDADES</h1>
    <p class="muted">Juegos, dibujos y gráficos interactivos para entender la fatiga. No piden datos y no se guarda nada.</p></div></div>
  <div class="ac-grid">${ACTIVIDADES.map(a => `<a class="ac-card" href="${a.href}"><span class="ac-ic">${ic(a.icon)}</span><h2>${esc(a.t)}</h2><p>${esc(a.d)}</p><small>${a.min} · ${ic('play')} Abrir</small></a>`).join('')}</div>
  <div class="panel ac-qr"><div class="qr-box" role="img" aria-label="Código QR de esta página">${typeof qrSVG === 'function' ? qrSVG(location.href.split('#')[0].split('?')[0]) : ''}</div>
    <div><p class="eyebrow">Para compartir</p><p>Escaneá el código para abrir las actividades en otro celular, o mandá el link por WhatsApp.</p>
    <div class="actions" style="margin-top:10px"><a class="btn ghost sm" href="https://wa.me/?text=${encodeURIComponent('Actividades sobre fatiga y conducción segura: ' + location.href.split('#')[0].split('?')[0])}" target="_blank" rel="noopener">${ic('message')} WhatsApp</a></div></div></div>`;
