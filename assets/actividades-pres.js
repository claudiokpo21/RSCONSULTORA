'use strict';
/* actividades-pres.js — ACTIVIDADES INTERACTIVAS DENTRO DE LA PRESENTACIÓN
   Agrega en algunas pantallas un botón que abre la actividad a pantalla completa (sin salir de la
   presentación) y, para las que se juegan en el celular, su código QR. Se cierra con la ✕ o con Esc.
   Para sumar o mover una actividad: editar ACT_PRES (pantalla = número que se ve, «Pantalla N de 22»).
   RS Consultora · Fatiga y Conducción Segura */

const ACT_PRES = [
  { pantalla:5,  src:'riesgos.html',   icon:'target',   titulo:'Encontrá los riesgos',  sub:'Dibujo interactivo', qr:true },
  { pantalla:7,  src:'deuda.html',     icon:'bed',      titulo:'La deuda de sueño',     sub:'Gráfico interactivo', qr:true },
  { pantalla:8,  src:'reloj.html',     icon:'clock',    titulo:'El reloj del cuerpo',   sub:'Gráfico interactivo', qr:false },
  { pantalla:9,  src:'conductor.html', icon:'user',     titulo:'El conductor cansado',  sub:'Dibujo interactivo',      qr:false },
  { pantalla:12, src:'turno.html',     icon:'moon',     titulo:'Turno noche y vuelta a casa', sub:'Gráfico interactivo', qr:false },
  { pantalla:17, src:'ruta.html',      icon:'road',     titulo:'La ruta se apaga',      sub:'Animación',            qr:false },
  { pantalla:19, src:'manejar.html',   icon:'steering', titulo:'Manejá vos',     sub:'Juego en el celular',            qr:true }
];
// Archivos que necesita cada actividad para funcionar sin internet (los usa offline.js).
const ACT_ARCHIVOS = ['actividades.html', 'assets/actividades.js', 'assets/dibujos.css', 'assets/manejar.css', 'assets/sueno.css', 'reaccion.html', 'assets/reaccion.js', 'assets/reaccion.css',
  ...ACT_PRES.flatMap(a => [a.src, 'assets/' + a.src.replace('.html', '.js')])];

const ActPres = (() => {
  let el = null;
  const actual = () => ACT_PRES.find(a => a.pantalla === State.current + 1) || null;
  const url = a => new URL(a.src, location.href).href;
  function boton(){
    const a = actual(), sl = document.querySelector('#stage .slide'); if(!a || !sl || sl.querySelector('.ap-launch')) return;
    const b = document.createElement('div'); b.className = 'ap-launch';
    b.innerHTML = `<button type="button" class="ap-btn"><span class="ap-ic">${ic(a.icon)}</span><span class="ap-txt"><small>Actividad · ${esc(a.sub)}</small><b>${esc(a.titulo)}</b></span><span class="ap-go">${ic('play')} Abrir</span></button>
      ${a.qr ? `<div class="ap-qr" title="Escanear para abrirla en el celular" role="img" aria-label="Código QR de la actividad">${qrSVG(url(a))}</div>` : ''}`;
    $('.ap-btn', b).onclick = abrir;
    const vid = sl.querySelector('.vp-launch'), h = sl.querySelector('.s-head');
    if(vid){ const fila = document.createElement('div'); fila.className = 'launch-row'; vid.replaceWith(fila); fila.append(vid, b); }   // video y actividad en la misma fila
    else h ? h.insertAdjacentElement('afterend', b) : sl.prepend(b);
  }
  function abrir(){
    const a = actual(); if(!a) return;
    cerrar();
    el = document.createElement('div'); el.className = 'ap-modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Actividad: ' + a.titulo);
    el.innerHTML = `<iframe src="${a.src}?sala" title="${esc(a.titulo)}" allow="vibrate"></iframe>
      ${a.qr ? `<div class="ap-mqr"><div>${qrSVG(url(a))}</div><span>Jugalo en tu celular</span></div>` : ''}
      <button class="vp-close" type="button" aria-label="Cerrar actividad">${ic('x')}</button>`;
    document.body.appendChild(el);
    el.querySelector('.vp-close').onclick = cerrar;
    setTimeout(() => { try{ el && el.querySelector('iframe').focus(); }catch(e){} }, 300);
  }
  function cerrar(){ if(el) el.remove(); el = null; try{ $('#stage').focus(); }catch(e){} }
  const goOrig = go;
  go = function(i){ cerrar(); goOrig(i); boton(); };
  document.addEventListener('keydown', e => {
    if(el && e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); cerrar(); }
    else if(!el && (e.key === 'a' || e.key === 'A') && actual() && !e.target.closest('input,select,textarea')) abrir();
  }, true);
  addEventListener('message', e => { if(e.origin === location.origin && e.data === 'rs-cerrar-actividad') cerrar(); });
  boton();
  return { abrir, cerrar, abierta:() => !!el };
})();
