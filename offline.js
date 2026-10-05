'use strict';
/* offline.js — "USAR SIN INTERNET" (presentación y videos)
   Descarga en este navegador la presentación y los 6 videos para poder dar la capacitación sin
   conexión. Funciona con sw.js (service worker). Conviene hacerlo el día anterior, con buena señal.
   Sin internet NO funcionan: el desafío en vivo, el control remoto ni el envío de resultados.
   RS Consultora · Fatiga y Conducción Segura */

const Offline = (() => {
  const VIDEOS_CACHE = 'rs-videos-v1';   // mismo nombre que en sw.js
  const ok = 'serviceWorker' in navigator && 'caches' in window && (location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname));
  const ICON = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/></svg>';
  let estado = { listo:false, bajando:false, hechos:0, total:0, mb:0, error:'' };

  function archivos(){
    const set = new Set([location.href.split('#')[0], 'manifest.json', 'assets/favicon.svg']);
    document.querySelectorAll('script[src],link[rel=stylesheet][href],link[rel=icon][href]').forEach(el => set.add(el.getAttribute('src') || el.getAttribute('href')));
    (CONFIG.consultora && CONFIG.consultora.logo && !/^data:/.test(CONFIG.consultora.logo)) && set.add(CONFIG.consultora.logo);
    (typeof VIDEOS_PRES !== 'undefined' ? VIDEOS_PRES : []).forEach(v => set.add(v.src.replace(/\.mp4$/, '.jpg')));
    return [...set];
  }
  const videos = () => (typeof VIDEOS_PRES !== 'undefined' ? VIDEOS_PRES : []).map(v => new URL(v.src, location.href).href);
  async function videosGuardados(){
    try{ const c = await caches.open(VIDEOS_CACHE); const r = await Promise.all(videos().map(u => c.match(u))); return r.every(Boolean); }catch(e){ return false; }
  }
  async function controlado(){
    await navigator.serviceWorker.ready;
    if(navigator.serviceWorker.controller) return;
    await new Promise(res => { navigator.serviceWorker.addEventListener('controllerchange', res, { once:true }); setTimeout(res, 3000); });
  }
  async function descargar(){
    if(estado.bajando) return;
    const app = archivos(), vids = videos();
    estado = { listo:false, bajando:true, hechos:0, total:app.length + vids.length, mb:0, error:'' }; pintar();
    try{
      await controlado();
      for(const u of app){   // pasa por sw.js, que guarda la copia
        const r = await fetch(u, { cache:'reload' }); if(!r.ok) throw new Error('No se pudo descargar ' + u);
        await r.arrayBuffer(); estado.hechos++; pintar();
      }
      const c = await caches.open(VIDEOS_CACHE);
      for(const u of vids){
        const r = await fetch(u, { cache:'reload' }); if(!r.ok) throw new Error('No se pudo descargar el video ' + u.split('/').pop());
        const b = await r.blob(); estado.mb += b.size / 1048576;
        await c.put(u, new Response(b, { status:200, headers:{ 'Content-Type':'video/mp4', 'Content-Length':String(b.size) } }));
        estado.hechos++; pintar();
      }
      estado.listo = true;
    }catch(e){ estado.error = navigator.onLine === false ? 'Sin conexión: conectate a internet y volvé a intentar.' : (e.message || 'Error al descargar.'); }
    estado.bajando = false; pintar();
  }
  async function borrar(){
    try{ await caches.delete(VIDEOS_CACHE); for(const k of await caches.keys()) if(k.startsWith('rs-app-')) await caches.delete(k); }catch(e){}
    estado = { listo:false, bajando:false, hechos:0, total:0, mb:0, error:'' }; pintar();
  }

  function html(){
    const x = `<button class="icon-btn rc-close" data-of="close" aria-label="Cerrar">${ic('x')}</button>`;
    const pct = estado.total ? Math.round(estado.hechos / estado.total * 100) : 0;
    let cuerpo;
    if(estado.bajando) cuerpo = `<p class="muted sm">Descargando… no cierres esta pestaña.</p><div class="rc-bar of-bar"><i style="width:${pct}%"></i></div><p class="sm dim" style="margin-top:6px">${estado.hechos} de ${estado.total} archivos${estado.mb ? ' · ' + estado.mb.toFixed(1).replace('.', ',') + ' MB de video' : ''}</p>`;
    else if(estado.listo) cuerpo = `<div class="rc-state ok"><span class="conn ok"></span>Lista para usar sin internet</div>
      <p class="muted sm">La presentación y los ${videos().length} videos quedaron guardados en este navegador. Si se corta la conexión, recargá la página y sigue funcionando.</p>
      <div class="actions" style="margin-top:14px"><button class="btn ghost sm" data-of="go">${ic('refresh')} Volver a descargar</button><button class="btn ghost sm" data-of="del">${ic('trash')} Borrar la copia</button></div>`;
    else cuerpo = `<p class="muted sm">Guarda en esta computadora la presentación y los ${videos().length} videos (unos 16 MB) para poder dar la capacitación aunque falle el wifi del lugar. Hacelo el día anterior o al llegar, con buena señal, <b>desde el mismo navegador</b> que vas a usar.</p>
      ${estado.error ? fb('bad', 'No se completó la descarga', esc(estado.error)) : ''}
      <div class="actions" style="margin-top:14px"><button class="btn primary" data-of="go">${ICON} Descargar ahora</button></div>`;
    return `${x}<h2>${ICON} Usar sin internet</h2>${cuerpo}
      <p class="sm dim rc-note">${ic('info')} Sin conexión no funcionan el desafío en vivo, el control remoto ni el envío de resultados. La evaluación se hace en el celular de cada participante y se envía sola cuando vuelve la señal.</p>`;
  }
  function pintar(){
    const b = document.getElementById('btnOffline');
    if(b){ b.classList.toggle('on', estado.listo); b.title = estado.listo ? 'Disponible sin internet' : 'Usar sin internet'; }
    const d = document.getElementById('ofDlg'); if(d && d.open){ d.innerHTML = html(); wire(d); }
  }
  function wire(d){ d.querySelectorAll('[data-of]').forEach(el => el.onclick = () => ({ close:() => d.close(), go:descargar, del:borrar })[el.dataset.of]()); }
  function abrir(){
    let d = document.getElementById('ofDlg');
    if(!d){ d = document.createElement('dialog'); d.id = 'ofDlg'; d.className = 'rc-dlg'; document.body.appendChild(d); d.addEventListener('click', e => { if(e.target === d) d.close(); }); }
    d.innerHTML = html(); wire(d); d.showModal();
  }
  function boton(){
    const box = document.querySelector('.top-actions'); if(!box || document.getElementById('btnOffline')) return;
    const b = document.createElement('button');
    b.className = 'icon-btn rc-btn'; b.id = 'btnOffline'; b.type = 'button';
    b.title = 'Usar sin internet'; b.setAttribute('aria-label', 'Usar sin internet');
    b.innerHTML = ICON + '<i class="rc-dot" aria-hidden="true"></i>'; b.onclick = abrir;
    box.insertBefore(b, document.getElementById('btnRemote') || document.getElementById('btnFull'));
  }
  if(ok){ boton(); videosGuardados().then(v => { estado.listo = v; pintar(); }); }
  return { descargar, borrar, estado:() => ({ ...estado }), ok };
})();
