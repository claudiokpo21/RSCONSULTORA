/* sw.js — MODO SIN INTERNET (service worker)
   · Páginas, scripts y estilos: primero la red (siempre la última versión); si no hay conexión
     o tarda más de 4 s, la copia guardada.
   · Videos: desde la copia guardada (con soporte de "Range" para poder adelantar/retroceder).
   · No intercepta nada de otros dominios (Supabase, etc.): los datos siempre van a la red.
   Al publicar cambios grandes, subir VERSION para descartar la copia anterior de la app
   (los videos se conservan en su propia caché).
   RS Consultora · Fatiga y Conducción Segura */
const VERSION = 'rs-app-v1', VIDEOS = 'rs-videos-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for(const k of await caches.keys()) if(k.startsWith('rs-app-') && k !== VERSION) await caches.delete(k);
  await self.clients.claim();
})()));

const esVideo = u => /\/videos\/[^/]+\.mp4$/.test(u.pathname);
const limpio = r => r.redirected ? r.blob().then(b => new Response(b, { status:200, statusText:'OK', headers:r.headers })) : r;

async function desdeCache(req){
  const c = await caches.open(VERSION), u = new URL(req.url);
  let r = await c.match(req, { ignoreSearch: req.mode === 'navigate' });
  if(!r && req.mode === 'navigate'){   // /capacitacion ↔ /capacitacion.html (Vercel usa URLs limpias)
    const alt = u.pathname.endsWith('.html') ? u.pathname.slice(0, -5) : u.pathname.replace(/\/$/, '/index') + '.html';
    r = await c.match(new URL(alt, u.origin).href, { ignoreSearch:true });
  }
  return r ? limpio(r) : null;
}
async function redPrimero(e){
  const req = e.request;
  const red = fetch(req).then(async r => {
    if(r.ok && r.type === 'basic'){ const c = await caches.open(VERSION); await c.put(req.mode === 'navigate' ? req.url.split('?')[0] : req, await limpio(r.clone())); }
    return r;
  });
  e.waitUntil(red.catch(() => {}));
  const espera = new Promise(res => setTimeout(res, 4000, 'lento'));
  try{
    const r = await Promise.race([red, espera]);
    if(r !== 'lento') return r;
    return (await desdeCache(req)) || await red;      // red lenta: copia guardada si existe
  }catch(err){
    const r = await desdeCache(req); if(r) return r;
    throw err;
  }
}
async function video(req){
  const c = await caches.open(VIDEOS), r = await c.match(req.url);
  if(!r) return fetch(req);
  const rango = req.headers.get('range');
  if(!rango) return r;
  const b = await r.blob(), m = /bytes=(\d*)-(\d*)/.exec(rango) || [];
  const ini = m[1] ? +m[1] : 0, fin = m[2] ? Math.min(+m[2], b.size - 1) : b.size - 1;
  if(ini >= b.size) return new Response(null, { status:416, headers:{ 'Content-Range':`bytes */${b.size}` } });
  return new Response(b.slice(ini, fin + 1), { status:206, statusText:'Partial Content', headers:{
    'Content-Type':'video/mp4', 'Content-Range':`bytes ${ini}-${fin}/${b.size}`, 'Content-Length':String(fin - ini + 1), 'Accept-Ranges':'bytes' } });
}
self.addEventListener('fetch', e => {
  const req = e.request; if(req.method !== 'GET') return;
  const u = new URL(req.url); if(u.origin !== self.location.origin) return;
  if(esVideo(u)) return e.respondWith(video(req));
  e.respondWith(redPrimero(e));
});
