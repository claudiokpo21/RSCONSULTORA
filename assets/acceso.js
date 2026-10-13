'use strict';
/* acceso.js — INGRESO DEL CAPACITADOR (login.html) Y PORTAL DE CURSOS (cursos.html)
   Usa la misma cuenta que Administración (Supabase). Solo entran los administradores
   (rs_capacitacion.administradores). La sesión queda recordada en ese navegador.
   RS Consultora · Capacitaciones */

const ACC = { vista: document.body.dataset.vista };
const destinoSeguro = () => {
  const n = new URLSearchParams(location.search).get('next') || '';
  return /^\/(?!\/)[\w\-\/.?=&%]*$/.test(n) ? n : 'cursos.html';
};

async function sesionAdmin(){
  const s = await Central.session();
  if(!s) return null;
  try{ return (await Central.esAdmin()) === true ? s : false; }catch(e){ return null; }
}

/* ---------------------------------------------------------------- INGRESO */
async function vistaLogin(){
  const v = $('#view');
  v.innerHTML = `<div class="gate-card acc-card"><p class="muted">${ic('refresh')} Revisando la sesión…</p></div>`;
  const s = Central.enabled() ? await sesionAdmin() : null;
  if(s){ location.replace(destinoSeguro()); return; }
  if(s === false) await Central.signOut();
  v.innerHTML = `<form class="gate-card acc-card" id="accForm" novalidate>
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)}</p><h1>INGRESO DEL CAPACITADOR</h1>
      <p class="muted">Las presentaciones, los videos y las actividades de proyector son privados. Ingresá con tu cuenta.</p></div></div>
    <div class="field"><label for="accMail">Email</label><input id="accMail" type="email" autocomplete="username" required></div>
    <div class="field"><label for="accPass">Contraseña</label><input id="accPass" type="password" autocomplete="current-password" required></div>
    <div id="accMsg" aria-live="polite"></div>
    <div class="actions"><button class="btn primary lg" id="accGo" type="submit">${ic('lock')} INGRESAR</button>
      <button class="btn ghost" type="button" id="accOlvido">¿Olvidaste tu contraseña?</button></div>
    <p class="sm dim" style="margin-top:14px">La sesión queda abierta en este navegador. Los participantes no necesitan cuenta: entran con el QR que les muestra el capacitador.</p>
  </form>`;
  const msg = (k, t, d) => { $('#accMsg').innerHTML = fb(k, t, d); };
  $('#accForm').onsubmit = async e => {
    e.preventDefault();
    const em = $('#accMail').value.trim(), pw = $('#accPass').value;
    if(!em || !pw) return msg('warn', 'Completá el email y la contraseña.');
    const b = $('#accGo'); b.disabled = true;
    try{
      await Central.signIn(em, pw);
      if((await Central.esAdmin()) !== true){ await Central.signOut(); b.disabled = false; return msg('bad', 'Esta cuenta no tiene acceso de capacitador.', 'Pedile a RS Consultora que la habilite.'); }
      location.replace(destinoSeguro());
    }catch(err){ b.disabled = false; msg('bad', err.message || 'No se pudo ingresar.'); }
  };
  $('#accOlvido').onclick = async () => {
    const em = $('#accMail').value.trim();
    if(!em) return msg('warn', 'Escribí tu email y volvé a tocar «¿Olvidaste tu contraseña?».');
    try{ await Central.resetPassword(em); msg('ok', 'Te enviamos un email para crear una contraseña nueva.'); }catch(err){ msg('bad', err.message); }
  };
  $('#accMail').focus();
}

/* ---------------------------------------------------------------- PORTAL DE CURSOS */
async function vistaCursos(){
  const v = $('#view');
  const s = Central.enabled() ? await sesionAdmin() : null;
  if(!s){ location.replace('login.html?next=' + encodeURIComponent('/cursos')); return; }
  const nombre = CONFIG.consultora.capacitador || 'capacitador';
  v.innerHTML = `<div class="acc-head"><div><p class="eyebrow">${esc(CONFIG.consultora.nombre)} · Capacitaciones</p><h1>Hola, ${esc(nombre)}</h1>
      <p class="muted">Elegí el curso para abrir la presentación, el desafío o la guía. Las jornadas, informes y certificados están en Administración.</p></div>
      <div class="actions" style="margin:0"><a class="btn primary" href="admin.html">${ic('users')} Administración</a><button class="btn ghost" id="accSalir">${ic('logout')} Cerrar sesión</button></div></div>
    <div class="acc-mods">${MODULOS.map(m => m.estado === 'activo' ? `
      <section class="panel acc-mod">
        <div class="acc-mod-h"><span class="acc-ic">${ic(m.icon)}</span><div><h2>${esc(m.nombre)}</h2><p class="muted">${esc(m.sub)}</p></div><span class="pill-ok">Activo</span></div>
        <p class="muted sm">${esc(m.d)}</p>
        <div class="acc-links">${m.accesos.map(a => `<a class="acc-link" href="${a.href}">${ic(a.icon)}<span><b>${esc(a.t)}</b><small>${esc(a.d)}</small></span></a>`).join('')}</div>
      </section>` : `
      <section class="panel acc-mod off">
        <div class="acc-mod-h"><span class="acc-ic">${ic(m.icon)}</span><div><h2>${esc(m.nombre)}</h2><p class="muted">${esc(m.sub)}</p></div><span class="pill-off">Próximamente</span></div>
        <p class="muted sm">${esc(m.d)}</p>
      </section>`).join('')}</div>
    <p class="sm dim">Sesión: ${esc(s.user && s.user.email || '')}</p>`;
  $('#accSalir').onclick = async () => { await Central.signOut(); location.replace('index.html'); };
}

initBrand();
(ACC.vista === 'cursos' ? vistaCursos : vistaLogin)();
