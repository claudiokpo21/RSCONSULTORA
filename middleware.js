/* middleware.js — ACCESO PRIVADO AL CONTENIDO (Vercel Routing Middleware)
   Antes de entregar las páginas y archivos del capacitador (presentación, videos, guía, desafío en vivo
   y actividades de proyector), verifica que quien los pide inició sesión como administrador.
   · La sesión es la misma de Administración (Supabase). login.js / central.js guardan el token en la cookie rs_at.
   · Se valida con la función rs_es_admin de Supabase; el resultado se recuerda unos minutos.
   · Sin sesión válida: las páginas llevan a /login?next=…; los demás archivos responden 401.
   Lo que usan los participantes (evaluación, diagnóstico, refuerzo, jugar, verificar, actividades del
   celular) sigue público, porque se abre con el QR sin cuenta.
   Para proteger otra ruta (por ejemplo, un módulo nuevo): agregarla en config.matcher.
   RS Consultora · Capacitaciones */

const SUPABASE_URL = 'https://hhwfhearafhmougtfssu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_UlhKyAUIXPFxrKkEb0lJxw_66kgPg9o';   // clave PÚBLICA (la misma de config.js)

// La lista tiene que estar escrita a mano: Vercel la lee sin ejecutar el archivo.
export const config = {
  matcher: [
    '/capacitacion', '/capacitacion.html',
    '/guia', '/guia.html',
    '/vivo', '/vivo.html',
    '/cursos', '/cursos.html',
    '/conductor', '/conductor.html',
    '/reloj', '/reloj.html',
    '/ruta', '/ruta.html',
    '/turno', '/turno.html',
    '/videos/:path*',
    '/assets/capacitacion.js', '/assets/guia.js', '/assets/videos.js', '/assets/actividades-pres.js', '/assets/vivo-host.js',
    '/assets/conductor.js', '/assets/reloj.js', '/assets/ruta.js', '/assets/turno.js'
  ]
};

const cache = new Map();   // token → vence (ms). Solo tokens verificados como administrador.
function vencimientoJWT(t){
  try{ const p = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); return (p.exp || 0) * 1000; }catch(e){ return 0; }
}
async function esAdmin(token){
  const ahora = Date.now(), c = cache.get(token);
  if(c && c > ahora) return true;
  const exp = vencimientoJWT(token);
  if(!exp || exp <= ahora) return false;
  try{
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/rs_es_admin', {
      method:'POST', body:'{}',
      headers:{ apikey:SUPABASE_KEY, Authorization:'Bearer ' + token, 'Content-Type':'application/json' }
    });
    if(!r.ok) return false;
    const ok = (await r.json()) === true;
    if(ok){
      if(cache.size > 500) cache.clear();
      cache.set(token, Math.min(exp, ahora + 5 * 60 * 1000));
    }
    return ok;
  }catch(e){ return false; }
}
function cookie(req, nombre){
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + nombre + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}
// Equivale a next() de @vercel/functions: deja seguir el pedido sin cambios.
const seguir = () => new Response(null, { headers:{ 'x-middleware-next':'1' } });

export default async function middleware(request){
  const url = new URL(request.url);
  const token = cookie(request, 'rs_at');
  if(token && await esAdmin(token)) return seguir();
  const esPagina = !/\.[a-z0-9]+$/i.test(url.pathname) || url.pathname.endsWith('.html');
  if(esPagina){
    const destino = new URL('/login', url);
    destino.searchParams.set('next', url.pathname.replace(/\.html$/, '') + url.search);
    return new Response(null, { status:302, headers:{ Location:destino.toString(), 'Cache-Control':'no-store' } });
  }
  return new Response('Contenido privado: iniciá sesión en ' + url.origin + '/login', { status:401, headers:{ 'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'no-store' } });
}
