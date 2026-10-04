'use strict';
/* videos.js — VIDEOS ANIMADOS CON VOZ EN LA PRESENTACIÓN
   Agrega el botón "Ver video" en las pantallas que tienen un video y lo reproduce a pantalla
   completa (se cierra al terminar, con Esc o con la ✕). También se maneja desde el control remoto.
   Para sumar un video: copiarlo en /videos y agregar una línea en VIDEOS_PRES (pantalla = número
   que se ve en la presentación, "Pantalla N de 21").
   RS Consultora · Fatiga y Conducción Segura */

const VIDEOS_PRES = [
  { pantalla:3,  src:'videos/v1-que-es-la-fatiga.mp4',   titulo:'¿Qué es la fatiga?' },
  { pantalla:5,  src:'videos/v2-factores-de-riesgo.mp4', titulo:'¿Qué favorece la fatiga?' },
  { pantalla:16, src:'videos/v6-que-hacer.mp4',          titulo:'Si aparece la fatiga' }
  // Próximos: pantalla 8 (Señales de alerta), 10 (Livianos y pesados), 17 (Prevención)
];

const VideoPres = (() => {
  let el = null, vid = null, cur = null;
  const duraciones = {};
  const actual = () => VIDEOS_PRES.find(v => v.pantalla === State.current + 1) || null;
  const poster = v => v.src.replace(/\.mp4$/, '.jpg');
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

  function boton(){
    const v = actual(), sl = document.querySelector('#stage .slide'); if(!v || !sl || sl.querySelector('.vp-launch')) return;
    const b = document.createElement('button');
    b.className = 'vp-launch'; b.type = 'button';
    b.innerHTML = `<span class="vp-thumb" style="background-image:url('${poster(v)}')"><i>${ic('play')}</i></span>
      <span class="vp-txt"><small>Video${duraciones[v.src] ? ' · ' + mmss(duraciones[v.src]) : ''}</small><b>${esc(v.titulo)}</b></span>`;
    b.onclick = () => abrir();
    const h = sl.querySelector('.s-head'); h ? h.insertAdjacentElement('afterend', b) : sl.prepend(b);
    if(!duraciones[v.src]){ const m = document.createElement('video'); m.preload = 'metadata'; m.src = v.src;
      m.onloadedmetadata = () => { duraciones[v.src] = m.duration; const s = b.querySelector('small'); if(s) s.textContent = 'Video · ' + mmss(m.duration); }; }
  }
  function abrir(){
    const v = actual(); if(!v) return;
    cerrar(); cur = v;
    el = document.createElement('div'); el.className = 'vp-modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Video: ' + v.titulo);
    el.innerHTML = `<video src="${v.src}" poster="${poster(v)}" controls playsinline preload="auto"></video>
      <button class="vp-close" type="button" aria-label="Cerrar video">${ic('x')}</button>`;
    document.body.appendChild(el);
    vid = el.querySelector('video');
    el.querySelector('.vp-close').onclick = cerrar;
    el.addEventListener('click', e => { if(e.target === el) cerrar(); });
    vid.addEventListener('ended', () => setTimeout(cerrar, 600));
    const p = vid.play(); if(p && p.catch) p.catch(() => {});   // si el navegador bloquea el autoplay, queda el botón ▶ del video
  }
  function cerrar(){ if(vid){ try{ vid.pause(); }catch(e){} } if(el) el.remove(); el = vid = cur = null; }
  function toggle(){ if(!el) return abrir(); vid.paused ? vid.play() : vid.pause(); }
  function info(){ const v = actual(); return v ? { titulo:v.titulo, abierto:!!el, reproduciendo:!!(vid && !vid.paused && !vid.ended) } : null; }

  // Se engancha a la navegación de la presentación: cada vez que cambia la pantalla, cierra el video y pone el botón.
  const goOrig = go;
  go = function(i){ cerrar(); goOrig(i); boton(); };
  document.addEventListener('keydown', e => {
    if(e.target.closest('input,select,textarea')) return;
    if(el && e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); cerrar(); }
    else if(e.key === 'v' || e.key === 'V'){ if(actual()) toggle(); }
    else if(el && (e.key === ' ' || e.key === 'k')){ e.preventDefault(); e.stopPropagation(); toggle(); }
  }, true);
  boton();
  return { info, toggle, abrir, cerrar };
})();
