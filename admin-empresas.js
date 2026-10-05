'use strict';
/* admin-empresas.js — EMPRESAS (pestaña de Administración)
   Por empresa: jornadas, trabajadores, aprobación, vigencias (vigentes / por vencer / vencidos),
   nómina cargada y cobertura, informe por empresa y Excel.
   RS Consultora · Fatiga y Conducción Segura */

function empresasLista(){ const T = AC.T || { registros:[], nomina:[] }; return An.empresas(T.registros, AC.jornadas, T.nomina); }
function empresasHTML(){
  if(!AC.T) return `<div class="panel">${fb('warn','No se pudieron cargar los datos','Tocá Actualizar para reintentar.')}</div>`;
  const E = empresasLista();
  if(!E.length) return `<div class="panel" style="text-align:center">${ic('building','xl')}<p class="muted" style="margin-top:8px">Todavía no hay empresas. Aparecen al crear la primera jornada.</p></div>`;
  return `<p class="muted sm" style="margin:0 0 12px">${ic('info')} Vigencia del certificado: <b>${REP.vigenciaMeses ? REP.vigenciaMeses + ' meses' : 'sin vencimiento'}</b> (se cambia en config.js; la define la consultora, no es un plazo legal). "Por vencer" = vence en los próximos ${REP.avisoVencimientoDias} días.</p>
    <div class="emp-list">${E.map((e, i) => `<article class="emp-card">
      <div class="emp-head"><div><h3>${esc(e.nombre)}</h3><p class="muted sm">${e.jornadas.length} jornada${e.jornadas.length === 1 ? '' : 's'} · última: ${e.ultima ? fmtDate(e.ultima + 'T12:00:00') : '–'}</p></div>
        <div class="actions" style="margin:0">
          <a class="btn sm green" href="documento.html?doc=empresa&e=${encodeURIComponent(e.nombre)}" target="_blank" rel="noopener">${ic('clipboard')} Informe de la empresa</a>
          <button class="btn sm ghost" data-exl="${i}">${ic('download')} Excel</button>
          <button class="btn sm ghost" data-nom="${i}">${ic('users')} ${e.nominaN ? 'Actualizar nómina' : 'Cargar nómina'}</button>
        </div></div>
      <div class="emp-stats">
        <div><small>Trabajadores</small><b>${e.trabajadores}</b></div>
        <div><small>Aprobación</small><b>${e.pctAprob != null ? e.pctAprob + '%' : '–'}</b></div>
        <div class="ok"><small>${ic('check')} Vigentes</small><b>${e.vigentes}</b></div>
        <div class="warn"><small>${ic('clock')} Por vencer</small><b>${e.porVencer}</b></div>
        <div class="bad"><small>${ic('alert')} Vencidos</small><b>${e.vencidos}</b></div>
        <div><small>Satisfacción</small><b>${e.sat.prom != null ? e.sat.prom.toFixed(1).replace('.', ',') : '–'}</b></div>
      </div>
      ${e.nominaN ? `<div class="emp-cov"><p><span>Cobertura de la nómina: <b>${e.cubiertos} de ${e.nominaN}</b> con capacitación vigente</span><b>${e.cobertura}%</b></p><div class="bar"><i style="width:${e.cobertura}%"></i></div>
        ${e.pendientes.length ? `<p class="sm emp-pend">${ic('alert')} ${e.pendientes.length} trabajador${e.pendientes.length === 1 ? '' : 'es'} pendiente${e.pendientes.length === 1 ? '' : 's'} (detalle en el informe de la empresa).</p>` : ''}</div>`
        : `<p class="muted sm" style="margin-top:10px">Cargá la nómina de la empresa para ver la cobertura y quiénes faltan capacitar.</p>`}
    </article>`).join('')}</div>`;
}
function bindEmpresas(){
  const E = empresasLista();
  $$('[data-exl]', acEl).forEach(b => b.onclick = () => excelEmpresa(E[+b.dataset.exl]));
  $$('[data-nom]', acEl).forEach(b => b.onclick = () => nominaDialog(E[+b.dataset.nom]));
}
function excelEmpresa(e){
  const T = AC.T, ids = new Set(e.jornadas.map(j => j.id));
  const { sheets, R, pers, s, ad } = hojasDetalle(e.regs, e.jornadas, e.nomina, T.desafios.filter(d => ids.has(d.jornada_id)), T.diagnosticos.filter(d => ids.has(d.jornada_id)));
  const resumen = { name:'Resumen', title:`${e.nombre} · Capacitación ${CONFIG.capacitacion.nombre}`, subtitle:`${CONFIG.consultora.nombre} · Generado el ${fmtDate(new Date())}`,
    cols:[34,18,50], head:['Indicador','Valor','Detalle'], rows:[
      ['Jornadas', e.jornadas.length, e.ultima ? 'Última: ' + fmtDate(e.ultima + 'T12:00:00') : ''],
      ['Trabajadores capacitados', pers.length, `${R.n} registros`],
      ['Aprobación', xlPct(R.pctAprob), `${R.aprobados} de ${R.evaluados} evaluados`],
      ['Certificados vigentes', e.vigentes, ''], ['Por vencer', e.porVencer, `próximos ${REP.avisoVencimientoDias} días`], ['Vencidos', e.vencidos, ''],
      ['Nómina', e.nominaN || '', e.nominaN ? `Cobertura ${e.cobertura} % · ${e.pendientes.length} pendientes` : 'No cargada'],
      ['Satisfacción promedio (1 a 5)', s.prom ?? '', s.n ? `${s.n} respuestas` : 'Sin datos'],
      ['Aciertos antes → después', ad.pre != null ? `${ad.pre} % → ${ad.post} %` : '', ad.n ? `${ad.n} diagnósticos` : 'Sin datos']] };
  XLSX.download(`capacitacion_${e.nombre.replace(/[^\wÁÉÍÓÚÑáéíóúñ]+/g, '_').slice(0, 40)}_${isoLocal(new Date())}.xlsx`, [resumen, ...sheets.filter(s => s.name !== 'Empresas')]);
}

/* ---------- Nómina ---------- */
function parseNomina(txt){
  const lines = String(txt || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if(!lines.length) return [];
  const sep = /\t/.test(lines[0]) ? '\t' : /;/.test(lines[0]) ? ';' : ',';
  const rows = lines.map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));
  // Con encabezado (dni, legajo, apellido, nombre, sector, en cualquier orden) o sin él:
  // 5 columnas = dni;legajo;apellido;nombre;sector · 4 columnas = legajo;apellido;nombre;sector (formato anterior).
  const COLS = ['dni','legajo','apellido','nombre','sector'];
  let orden = rows[0].length >= 5 ? COLS : ['legajo','apellido','nombre','sector'];
  if(rows[0].some(c => /^(dni|documento|legajo|apellido|nombre|sector)$/i.test(c))){
    orden = rows.shift().map(c => { c = c.toLowerCase(); return c === 'documento' ? 'dni' : c; });
  }
  return rows.map(c => { const o = {}; orden.forEach((k, i) => { if(COLS.includes(k)) o[k] = c[i] || ''; }); return o; })
    .map(o => ({ dni:normDni(o.dni), legajo:String(o.legajo || '').toUpperCase(), apellido:o.apellido || '', nombre:o.nombre || '', sector:o.sector || '' }))
    .map(r => ({ ...r, dni: dniValido(r.dni) ? r.dni : '', legajo: /^[A-Z0-9-]{1,12}$/.test(r.legajo) ? r.legajo : '' }))
    .filter(r => r.dni || r.legajo);
}
function nominaDialog(e, msg){
  const d = $('#dlg'); d.classList.add('wide');
  d.innerHTML = `<h2>${ic('users')} Nómina · ${esc(e.nombre)}</h2>
    <p class="muted sm">Pegá el listado desde Excel (columnas: <b>dni, legajo, apellido, nombre, sector</b>; alcanza con el DNI o el legajo) o elegí un archivo CSV. Se usa solo para calcular la cobertura y los pendientes; no se muestra a los participantes.</p>
    ${Datos.v2 === false ? fb('info','Requiere actualización de la base', Datos.avisoV2()) : ''}
    <textarea class="nom-area" id="nomTxt" placeholder="dni;legajo;apellido;nombre;sector&#10;30123456;1001;Pérez;Juan;Transporte&#10;28987654;;Gómez;Ana;Logística"></textarea>
    <div class="actions" style="justify-content:space-between;align-items:center;margin-top:10px">
      <label class="btn ghost sm" style="cursor:pointer">${ic('download')} Elegir CSV<input type="file" id="nomFile" accept=".csv,.txt,text/csv" hidden></label>
      <label class="sm" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="nomRep" ${e.nominaN ? '' : 'checked'}> Reemplazar la nómina actual${e.nominaN ? ` (${e.nominaN})` : ''}</label>
    </div>
    <p class="sm" id="nomPrev" style="margin-top:8px;color:var(--muted)">0 filas válidas</p>
    <div id="nomMsg">${msg || ''}</div>
    <div class="actions">${e.nominaN ? `<button class="btn ghost" id="nomDel">${ic('trash')} Borrar nómina</button>` : ''}<button class="btn ghost" id="nomCancel">Cancelar</button><button class="btn primary" id="nomOk" disabled>${ic('check')} Guardar nómina</button></div>`;
  const txt = $('#nomTxt', d), prev = () => { const n = parseNomina(txt.value).length; $('#nomPrev', d).textContent = `${n} fila${n === 1 ? '' : 's'} válida${n === 1 ? '' : 's'}`; $('#nomOk', d).disabled = !n; };
  txt.oninput = prev;
  $('#nomFile', d).onchange = ev => { const f = ev.target.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => { txt.value = String(r.result).replace(/^﻿/, ''); prev(); }; r.readAsText(f, 'utf-8'); };
  const close = () => { d.close(); d.classList.remove('wide'); };
  $('#nomCancel', d).onclick = close;
  d.oncancel = ev => { ev.preventDefault(); close(); };
  const fail = err => { $('#nomMsg', d).innerHTML = fb('bad','No se pudo guardar', esc(Datos.faltaFuncion(err) ? Datos.avisoV2() : err.message)); };
  $('#nomOk', d).onclick = async () => {
    const filas = parseNomina(txt.value); $('#nomOk', d).disabled = true;
    try{ const r = await Central.rpc('rs_admin_nomina_cargar', { p_empresa:e.nombre, p_filas:filas, p_reemplazar:$('#nomRep', d).checked }); close(); await acReload(); toastAdmin(`Nómina guardada: ${r.total} trabajadores`); }
    catch(err){ $('#nomOk', d).disabled = false; fail(err); }
  };
  if($('#nomDel', d)) $('#nomDel', d).onclick = async () => {
    try{ await Central.rpc('rs_admin_nomina_borrar', { p_empresa:e.nombre }); close(); await acReload(); }catch(err){ fail(err); }
  };
  if(!d.open) d.showModal();
  txt.focus();
}
function toastAdmin(t){ const top = $('.admin-top'); if(top) top.insertAdjacentHTML('afterend', fb('ok', esc(t), '')); }
