'use strict';
/* verificar.js — VERIFICACIÓN PÚBLICA DE CONSTANCIAS
   Cualquiera con el código impreso en la constancia puede comprobar que es auténtica.
   Solo se muestran los datos necesarios; el legajo aparece parcialmente oculto.
   RS Consultora · Fatiga y Conducción Segura */

const view = $('#view');
function show(html){ view.innerHTML = `<div class="slide">${html}</div>`; }

function renderForm(code, err){
  show(`<div class="gate-card">
    <div class="gate-head">${brandMarkHTML()}<div><p class="eyebrow">${esc(CONFIG.consultora.nombre)}</p><h1>Verificar constancia</h1><p class="muted">Ingresá el código de verificación impreso en la constancia.</p></div></div>
    <form id="vf" novalidate>
      <div class="field ${err ? 'err' : ''}"><label for="f-code">CÓDIGO DE VERIFICACIÓN</label>
        <input id="f-code" class="code-input" maxlength="8" autocomplete="off" value="${esc(code || '')}" placeholder="XXXXXXXX">
        ${err ? `<p class="msg">${err}</p>` : ''}</div>
      <div class="actions"><button class="btn primary lg" type="submit" style="width:100%">${ic('shield')} VERIFICAR</button></div>
    </form>
  </div>`);
  $('#vf').onsubmit = e => { e.preventDefault(); check($('#f-code').value); };
  $('#f-code').focus({ preventScroll:true });
}

async function check(raw){
  const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if(code.length !== 8){ renderForm(code, 'El código tiene 8 caracteres (letras y números).'); return; }
  if(!Central.enabled()){ renderForm(code, 'La verificación en línea no está configurada.'); return; }
  show(`<div class="gate-card welcome"><div class="spinner" aria-hidden="true"></div><p class="muted">Verificando…</p></div>`);
  let r;
  try{ r = await Central.verificar(code); }
  catch(e){ renderForm(code, Central.isNetworkError(e) ? 'Sin conexión. Intentá nuevamente.' : 'No se pudo verificar. Intentá más tarde.'); return; }
  history.replaceState(null, '', 'verificar.html?c=' + code);
  if(!r){
    show(`<div class="gate-card verify-card bad">${ic('x','xl')}<h1>Código no encontrado</h1>
      <p class="muted">No existe una constancia con el código <b>${esc(code)}</b>. Revisá que esté bien escrito.</p>
      <div class="actions" style="justify-content:center"><button class="btn ghost" id="again">${ic('refresh')} Verificar otro código</button></div></div>`);
  }else{
    const ok = r.estado === 'APROBADO';
    show(`<div class="gate-card verify-card ${ok ? 'ok' : 'bad'}">
      ${ic(ok ? 'shield' : 'alert','xl')}
      <h1>${ok ? 'Constancia válida' : 'Registro sin aprobación'}</h1>
      <p class="muted">${ok ? `Esta constancia fue emitida por ${esc(CONFIG.consultora.nombre)} y es auténtica.` : 'El código existe, pero el registro no figura como aprobado.'}</p>
      <table class="confirm-table">
        <tr><th>Participante</th><td>${esc(r.nombre)} ${esc(r.apellido)}</td></tr>
        <tr><th>Legajo</th><td>${esc(r.legajo)}</td></tr>
        ${r.empresa ? `<tr><th>Empresa</th><td>${esc(r.empresa)}</td></tr>` : ''}
        <tr><th>Capacitación</th><td>${esc(r.capacitacion || CONFIG.capacitacion.nombre)}</td></tr>
        <tr><th>Capacitador</th><td>${esc(r.capacitador || capacitador())}</td></tr>
        <tr><th>Fecha</th><td>${r.fecha ? fmtDate(r.fecha) : '–'}</td></tr>
        <tr><th>Resultado</th><td>${r.porcentaje != null ? r.porcentaje + ' %' : '–'} · <span class="status-badge ${ok ? 'ok' : r.estado === 'NO APROBADO' ? 'bad' : 'pend'}">${esc(r.estado)}</span></td></tr>
        <tr><th>Asistencia firmada</th><td>${r.firmado ? 'Sí' : 'No'}</td></tr>
        <tr><th>Código</th><td><b>${esc(r.verificacion)}</b></td></tr>
      </table>
      <div class="actions" style="justify-content:center"><button class="btn ghost" id="again">${ic('refresh')} Verificar otro código</button></div>
    </div>`);
  }
  $('#again').onclick = () => { history.replaceState(null, '', 'verificar.html'); renderForm(''); };
}

(function init(){
  initBrand();
  const c = new URLSearchParams(location.search).get('c');
  c ? check(c) : renderForm('');
})();
