'use strict';
/* informe.js — INFORME DE CAPACITACIÓN PARA LA EMPRESA CLIENTE (A4, listo para imprimir / guardar PDF)
   Requiere sesión de administrador (misma sesión que admin.html).
   Contenido: datos de la jornada, indicadores, distribución de resultados, aciertos por pregunta,
   temas a reforzar, resumen del desafío en vivo, conclusión y planilla de asistencia con firmas.
   RS Consultora · Fatiga y Conducción Segura */

const root = $('#report');
/* ---------- Cálculos ---------- */
function analizar(data){
  const regs = data.registros || [], Q = CONTENT.quiz;
  const evaluados = regs.filter(r => r.porcentaje != null);
  const aprob = evaluados.filter(r => r.estado === 'APROBADO');
  const firm = regs.filter(r => r.firma);
  const avg = a => a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null;
  const buckets = [
    { label:'Menos de 60 %', test:p => p < 60 }, { label:'60 a 79 %', test:p => p >= 60 && p < 80 },
    { label:'80 a 89 %', test:p => p >= 80 && p < 90 }, { label:'90 a 100 %', test:p => p >= 90 } ]
    .map(b => ({ ...b, n: evaluados.filter(r => b.test(r.porcentaje)).length }));
  const conResp = evaluados.filter(r => Array.isArray(r.respuestas) && r.respuestas.length === Q.length);
  const porPregunta = Q.map((q, k) => {
    const ok = conResp.filter(r => r.respuestas[k] === q.c).length;
    return { k, q, n: conResp.length, ok, pct: conResp.length ? Math.round(ok / conResp.length * 100) : null };
  });
  const reforzar = porPregunta.filter(x => x.pct != null && x.pct < 80).sort((a, b) => a.pct - b.pct).slice(0, 3);
  const tipos = TIPOS.map(t => ({ t, n: regs.filter(r => r.tipo_vehiculo === t).length }));
  const des = (data.desafios || []).slice(-1)[0];
  const regsF = regs.map(r => ({ ...r, firmado:!!r.firma }));
  return { sat: An.satisfaccion(regs), ad: An.antesDespues(data.diagnosticos || [], regs),
    mapaSector: An.mapa(regsF, 'sector'), mapaTipo: An.mapa(regsF, 'tipo_vehiculo'),
    regs, evaluados, aprob, firm, buckets, porPregunta, reforzar, conResp, tipos, desafio: des ? des.datos : null,
    pctAprob: evaluados.length ? Math.round(aprob.length / evaluados.length * 100) : null,
    promedio: avg(evaluados.map(r => r.porcentaje)),
    duracion: avg(regs.map(r => r.duracion_min).filter(x => x != null)),
    intentos: evaluados.length ? (evaluados.reduce((s, r) => s + (r.intentos || 1), 0) / evaluados.length) : null
  };
}
function conclusion(A){
  if(!A.evaluados.length) return 'Todavía no hay evaluaciones registradas en esta jornada.';
  const p = A.pctAprob, min = CONFIG.aprobacion.porcentajeMinimo;
  let t = p >= 90 ? `El grupo alcanzó un nivel de comprensión muy bueno: el ${p} % de los evaluados aprobó (criterio ${min} %).`
        : p >= 75 ? `El grupo alcanzó un nivel de comprensión satisfactorio: el ${p} % de los evaluados aprobó (criterio ${min} %).`
        : `El ${p} % de los evaluados aprobó (criterio ${min} %). Se recomienda una instancia de refuerzo para quienes no alcanzaron el criterio.`;
  if(A.reforzar.length) t += ` Los temas con menor porcentaje de acierto fueron: ${A.reforzar.map(x => `${tema(x.k).toLowerCase()} (${x.pct} %)`).join(', ')}. Se sugiere reforzarlos en charlas de 5 minutos o en la próxima capacitación.`;
  else t += ' No se detectaron temas con bajo porcentaje de acierto.';
  if(A.ad.pre != null && A.ad.post != null) t += ` En las preguntas del diagnóstico inicial, los aciertos del grupo pasaron de ${A.ad.pre} % (antes de la capacitación) a ${A.ad.post} % (evaluación final).`;
  if(A.sat.n) t += ` Los participantes calificaron la capacitación con ${A.sat.prom.toFixed(1).replace('.', ',')} sobre 5 (${A.sat.n} respuestas).`;
  const peor = A.mapaSector.filter(r => r.n >= 3 && r.prom < min)[0];
  if(peor) t += ` El sector con menor desempeño fue ${peor.grupo} (${peor.prom} % promedio): se recomienda priorizarlo en el refuerzo.`;
  const noFirm = A.regs.length - A.firm.length;
  if(noFirm > 0) t += ` ${noFirm} participante${noFirm > 1 ? 's' : ''} no registr${noFirm > 1 ? 'aron' : 'ó'} su firma de asistencia.`;
  return t;
}

/* ---------- Render ---------- */
function render(data){
  const j = data.jornada, A = analizar(data), min = CONFIG.aprobacion.porcentajeMinimo, D = A.desafio;
  document.title = `Informe ${j.codigo} · ${j.empresa} · RS Consultora`;
  const kpi = (label, value, sub) => `<div class="r-kpi"><span>${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const encuestas = D && Array.isArray(D.preguntas) ? D.preguntas.filter(p => p.tipo === 'encuesta' && Array.isArray(p.dist)) : [];

  root.innerHTML = `
  <section class="sheet">
    ${sheetHead(j)}
    <h1 class="r-title">Informe de capacitación</h1>
    <p class="r-sub">${esc(j.capacitacion)}</p>
    <table class="r-data">
      <tr><th>Empresa</th><td>${esc(j.empresa)}</td><th>Fecha</th><td>${fmtDate(j.fecha + 'T12:00:00')}</td></tr>
      <tr><th>Lugar / sector</th><td>${esc(j.lugar || '–')}</td><th>Código de jornada</th><td>${esc(j.codigo)}</td></tr>
      <tr><th>Capacitador</th><td>${esc(j.capacitador)}</td><th>Consultora</th><td>${esc(CONFIG.consultora.nombre)}</td></tr>
      <tr><th>Modalidad</th><td colspan="3">Presencial, con desafío interactivo en vivo y evaluación individual digital (${CONTENT.quiz.length} preguntas, aprobación con ${min} % o más).</td></tr>
    </table>

    <h2 class="r-h2">Resumen</h2>
    <div class="r-kpis">
      ${kpi('Asistentes con firma', A.firm.length, `de ${A.regs.length} registrados`)}
      ${kpi('Evaluados', A.evaluados.length, A.intentos ? `${A.intentos.toFixed(1).replace('.', ',')} intentos promedio` : '')}
      ${kpi('Aprobación', A.pctAprob != null ? A.pctAprob + ' %' : '–', `${A.aprob.length} aprobado${A.aprob.length === 1 ? '' : 's'}`)}
      ${kpi('Puntaje promedio', A.promedio != null ? A.promedio + ' %' : '–', A.duracion != null ? `≈ ${A.duracion} min por evaluación` : '')}
    </div>

    <h2 class="r-h2">Distribución de resultados</h2>
    <p class="r-note">Cantidad de participantes según el porcentaje obtenido en su último intento.</p>
    ${A.evaluados.length ? hbarChart(A.buckets.map(b => ({ label:b.label, value:b.n, text:`${b.n} participante${b.n === 1 ? '' : 's'}` })), { max: Math.max(1, ...A.buckets.map(b => b.n)), title:'Distribución de resultados' }) : '<p class="r-empty">Sin evaluaciones registradas.</p>'}

    <div class="r-two">
      <div><h3 class="r-h3">Participantes por tipo de vehículo</h3>
        <table class="r-mini">${A.tipos.map(t => `<tr><td>${esc(t.t)}</td><td>${t.n}</td></tr>`).join('')}<tr><td>No indicado</td><td>${A.regs.length - A.tipos.reduce((s, t) => s + t.n, 0)}</td></tr></table></div>
      <div><h3 class="r-h3">Estado de las evaluaciones</h3>
        <table class="r-mini"><tr><td>Aprobados</td><td>${A.aprob.length}</td></tr><tr><td>No aprobados</td><td>${A.evaluados.length - A.aprob.length}</td></tr><tr><td>Sin completar</td><td>${A.regs.length - A.evaluados.length}</td></tr></table></div>
    </div>
  </section>

  <section class="sheet">
    ${sheetHead(j)}
    <h2 class="r-h2">Aciertos por pregunta</h2>
    <p class="r-note">Porcentaje de evaluados que respondió correctamente cada pregunta (último intento${A.conResp.length ? `, ${A.conResp.length} evaluaciones` : ''}). La línea marca el criterio de aprobación.</p>
    ${A.conResp.length ? hbarChart(A.porPregunta.map(x => ({ label:`P${x.k + 1}. ${tema(x.k)}`, value:x.pct, text:x.pct + ' %', hint:`${x.q.q} — ${x.ok} de ${x.n} correctas` })), { max:100, unit:'%', ref:{ value:min, label:`Criterio ${min} %` }, labelW:250, rightW:60, title:'Aciertos por pregunta', bh:18, gap:12 }) : '<p class="r-empty">Sin respuestas registradas.</p>'}

    <h2 class="r-h2">Temas a reforzar</h2>
    ${A.reforzar.length ? `<ol class="r-list">${A.reforzar.map(x => `<li><b>${esc(tema(x.k))}</b> — ${x.pct} % de acierto.<br><span>Pregunta: ${esc(x.q.q)}</span><br><span>Mensaje clave: ${esc(x.q.e)}</span></li>`).join('')}</ol>` : `<p>Todas las preguntas superaron el ${min} % de acierto.</p>`}

  </section>

  <section class="sheet">
    ${sheetHead(j)}
    <h2 class="r-h2">Mapa de riesgo por sector</h2>
    <p class="r-note">Porcentaje de acierto de cada sector en cada tema de la evaluación. Rojo: debajo del criterio de aprobación (${min} %); azul: igual o por encima.</p>
    ${mapaTabla(A.mapaSector, 'Sector')}
    <h2 class="r-h2">Mapa de riesgo por tipo de vehículo</h2>
    ${mapaTabla(A.mapaTipo, 'Tipo de vehículo')}
  </section>

  ${A.ad.n || A.sat.n ? `<section class="sheet">
    ${sheetHead(j)}
    <h2 class="r-h2">Antes y después de la capacitación</h2>
    ${A.ad.n ? `<p class="r-note">Diagnóstico anónimo al inicio (${A.ad.n} respuesta${A.ad.n === 1 ? '' : 's'}) comparado con la evaluación final, en las mismas preguntas. Aciertos del grupo: <b>${A.ad.pre ?? '–'} %</b> antes → <b>${A.ad.post ?? '–'} %</b> después.</p>${antesDespuesChart(A.ad)}` : '<p class="r-empty">No se realizó el diagnóstico inicial en esta jornada.</p>'}
    <h2 class="r-h2">Satisfacción de los participantes</h2>
    ${satisfaccionHTML(A.sat)}
  </section>` : ''}

  <section class="sheet">
    ${sheetHead(j)}
    <h2 class="r-h2">Desafío en vivo</h2>
    ${D ? `<p>Participaron <b>${D.participantes}</b> personas. Promedio de aciertos del grupo: <b>${D.aciertosGrupo} %</b>${D.ganador ? ` · Equipo ganador: <b>${esc(D.ganador)}</b>` : ''}.</p>
      ${encuestas.map(p => { const tot = p.dist.reduce((s, x) => s + x, 0) || 1; return `<h3 class="r-h3">${esc(p.q)}</h3>
        ${hbarChart(p.opciones.map((o, i) => ({ label:o, value:Math.round(p.dist[i] / tot * 100), text:`${Math.round(p.dist[i] / tot * 100)} % (${p.dist[i]})` })), { max:100, unit:'%', labelW:240, rightW:90, title:p.q })}`; }).join('')}
      <p class="r-note">Encuestas anónimas: solo se registran los totales.</p>`
      : '<p class="r-empty">No se registró un desafío en vivo para esta jornada.</p>'}

    <h2 class="r-h2">Conclusión</h2>
    <p class="r-conc">${esc(conclusion(A))}</p>
    <p class="r-note">Los resultados reflejan la comprensión de los contenidos de la capacitación. No constituyen una evaluación médica ni de aptitud laboral.</p>

    <div class="r-sign"><div><span class="line"></span>${esc(j.capacitador)}<br>${esc(CONFIG.consultora.rol)} · ${esc(CONFIG.consultora.nombre)}</div></div>
  </section>

  <section class="sheet">
    ${sheetHead(j)}
    <h2 class="r-h2">Planilla de asistencia</h2>
    <p class="r-note">${esc(j.empresa)} · ${fmtDate(j.fecha + 'T12:00:00')} · ${esc(j.capacitacion)} · Capacitador: ${esc(j.capacitador)}</p>
    <table class="r-att">
      <thead><tr><th>N.º</th><th>Legajo</th><th>Apellido y nombre</th><th>Sector</th><th>Vehículo</th><th>Resultado</th><th>Estado</th><th>Firma</th></tr></thead>
      <tbody>${A.regs.length ? A.regs.map((r, i) => `<tr>
        <td>${i + 1}</td><td>${esc(r.legajo)}</td><td>${esc(r.apellido)}, ${esc(r.nombre)}</td><td>${esc(r.sector || '–')}</td><td>${esc(r.tipo_vehiculo || '–')}</td>
        <td>${r.porcentaje != null ? r.porcentaje + ' %' : '–'}</td><td>${esc(r.estado)}</td>
        <td class="sigcell">${r.firma ? `<img src="${r.firma}" alt="Firma de ${esc(r.apellido)}">` : '<span class="nofirma">Sin firma</span>'}</td></tr>`).join('')
        : '<tr><td colspan="8" class="r-empty">Sin participantes registrados.</td></tr>'}</tbody>
    </table>
    <p class="r-note" style="margin-top:6mm">Firmas registradas digitalmente por cada participante al iniciar su evaluación. Cada constancia emitida puede verificarse en ${esc(new URL('verificar.html', location.href).href.replace(/^https?:\/\//, ''))}.</p>
  </section>`;
  $('#tbCsv').onclick = () => csv(data);
}
function csv(data){
  const j = data.jornada, cell = v => { let s = String(v ?? ''); if(/^[=+\-@]/.test(s)) s = "'" + s; return /[";\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
  const head = ['N.º','Legajo','Apellido','Nombre','Sector','Tipo de vehículo','Porcentaje','Estado','Intentos','Asistencia firmada','Código de verificación'];
  const rows = (data.registros || []).map((r, i) => [i + 1, r.legajo, r.apellido, r.nombre, r.sector, r.tipo_vehiculo, r.porcentaje, r.estado, r.intentos, r.firma ? 'Sí' : 'No', r.verificacion]);
  const out = '﻿' + [head, ...rows].map(r => r.map(cell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([out], { type:'text/csv;charset=utf-8' })), a = document.createElement('a');
  a.href = url; a.download = `informe_${j.codigo}_${isoLocal(new Date())}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function message(title, body){
  root.innerHTML = `<section class="sheet r-msg"><h1 class="r-title">${esc(title)}</h1><p>${body}</p>${new URLSearchParams(location.search).get('t') ? '' : '<p><a href="admin.html">Ir a Administración</a></p>'}</section>`;
}

(async function init(){
  $('#tbPrint').onclick = () => window.print();
  const qs = new URLSearchParams(location.search), tok = qs.get('t');
  if(tok){
    const back = $('.toolbar a[href="admin.html"]'); if(back) back.remove();
    if(!/^[0-9a-f]{48}$/.test(tok) || !Central.enabled()) return message('Enlace no válido', 'Pedile a la consultora un enlace actualizado.');
    try{
      const data = await Central.rpc('rs_informe_publico', { p_token:tok });
      if(!data || !data.jornada) return message('Enlace no disponible', 'El enlace fue desactivado o no existe. Pedile a la consultora uno nuevo.');
      render(data);
    }catch(e){ message('No se pudo cargar el informe', esc(Central.isNetworkError(e) ? 'Sin conexión a internet.' : 'El enlace no está disponible.')); }
    return;
  }
  const id = qs.get('id');
  if(!id || !/^[0-9a-f-]{36}$/i.test(id)) return message('Informe no encontrado', 'Abrí el informe desde la pestaña Jornadas de Administración.');
  if(!Central.enabled()) return message('Registro central no configurado', 'El informe necesita el registro central (Supabase).');
  try{
    const s = await Central.session();
    if(!s) return message('Iniciá sesión', 'Para ver el informe, iniciá sesión en Administración en este mismo navegador y volvé a abrirlo.');
    const data = await Central.rpc('rs_admin_informe', { p_id:id });
    if(!data || !data.jornada) return message('Informe no encontrado', 'La jornada no existe o fue eliminada.');
    render(data);
  }catch(e){
    message('No se pudo cargar el informe', esc(e.code === '42501' ? 'Tu usuario no tiene permisos de administrador.' : Central.isNetworkError(e) ? 'Sin conexión a internet.' : e.message));
  }
})();
