'use strict';
/* analitica.js — CÁLCULOS COMPARTIDOS DE REPORTES
   Lo usan el tablero de Administración, el informe de jornada, el informe por empresa,
   el informe individual y los certificados. Solo calcula: no dibuja ni guarda nada.
   RS Consultora · Fatiga y Conducción Segura */

const REP = Object.assign({ vigenciaMeses:12, avisoVencimientoDias:60, diagnostico:[1, 2, 4, 8, 9], refuerzo:[2, 8, 9], refuerzoDias:30 }, CONFIG.reportes || {});

// Tema de cada pregunta de la evaluación (mismo orden que CONTENT.quiz)
const TEMAS = ['Definición de fatiga','Señales de alerta','Microsueño','Factores de riesgo','Sueño y conducción','Vehículos livianos','Vehículos pesados','Prevención antes del viaje','Mito: café y descanso','Qué hacer ante la fatiga'];
function tema(k){ return TEMAS[k] || `Pregunta ${k + 1}`; }

const An = {
  avg(a){ a = a.filter(x => x != null && !isNaN(x)); return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; },
  pct(n, d){ return d ? Math.round(n / d * 100) : null; },
  key(s){ return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); },
  day(d){ return String(d || '').slice(0, 10); },
  evaluados(regs){ return regs.filter(r => r.porcentaje != null); },
  conResp(regs){ const n = CONTENT.quiz.length; return regs.filter(r => r.porcentaje != null && Array.isArray(r.respuestas) && r.respuestas.length === n); },

  /** Indicadores básicos de un conjunto de registros. */
  resumen(regs){
    const ev = this.evaluados(regs), ap = ev.filter(r => r.estado === 'APROBADO');
    return { n:regs.length, evaluados:ev.length, aprobados:ap.length, noAprobados:ev.length - ap.length,
      sinCompletar:regs.length - ev.length, pctAprob:this.pct(ap.length, ev.length),
      promedio: ev.length ? Math.round(this.avg(ev.map(r => r.porcentaje))) : null,
      firmados: regs.filter(r => r.firmado || r.firma).length };
  },

  /** % de acierto por pregunta (último intento). */
  porPregunta(regs){
    const cr = this.conResp(regs);
    return CONTENT.quiz.map((q, k) => { const ok = cr.filter(r => respOk(r.respuestas[k], k)).length; return { k, q, n:cr.length, ok, pct:this.pct(ok, cr.length) }; });
  },

  /** Mapa de riesgo: % de acierto por tema para cada grupo (sector o tipo de vehículo). */
  mapa(regs, dim, minN){
    minN = minN || 1;
    const cr = this.conResp(regs), groups = new Map();
    cr.forEach(r => { const g = String(r[dim] || '').trim() || 'No indicado'; if(!groups.has(g)) groups.set(g, []); groups.get(g).push(r); });
    const rows = [...groups.entries()].filter(([, rs]) => rs.length >= minN).map(([g, rs]) => ({
      grupo:g, n:rs.length, cells: CONTENT.quiz.map((q, k) => this.pct(rs.filter(r => respOk(r.respuestas[k], k)).length, rs.length)),
      prom: Math.round(this.avg(rs.map(r => r.porcentaje))) }));
    rows.sort((a, b) => a.prom - b.prom || b.n - a.n);
    return rows;
  },

  /** Satisfacción (1 a 5) y comentarios (anónimos). */
  satisfaccion(regs){
    const s = regs.filter(r => r.satisfaccion >= 1 && r.satisfaccion <= 5), dist = [1,2,3,4,5].map(v => s.filter(r => r.satisfaccion === v).length);
    const com = regs.map(r => String(r.comentario || '').trim()).filter(Boolean);
    return { n:s.length, prom: s.length ? Math.round(this.avg(s.map(r => r.satisfaccion)) * 10) / 10 : null,
      dist, pctPos: this.pct(dist[3] + dist[4], s.length), comentarios:com };
  },

  /** Antes / después: diagnóstico anónimo vs. evaluación final, en las mismas preguntas. */
  antesDespues(diags, regs){
    const ks = REP.diagnostico.filter(k => CONTENT.quiz[k]), cr = this.conResp(regs);
    const D = (diags || []).map(d => d && d.respuestas ? d.respuestas : d).filter(d => d && typeof d === 'object');
    const items = ks.map(k => {
      const q = CONTENT.quiz[k], pre = D.filter(d => d[k] != null), post = cr;
      return { k, q, preN:pre.length, postN:post.length,
        pre: this.pct(pre.filter(d => +d[k] === q.c).length, pre.length),
        post: this.pct(post.filter(r => respOk(r.respuestas[k], k)).length, post.length) };
    });
    const ok = items.filter(x => x.pre != null && x.post != null);
    return { n:D.length, items, pre: ok.length ? Math.round(this.avg(ok.map(x => x.pre))) : null, post: ok.length ? Math.round(this.avg(ok.map(x => x.post))) : null };
  },

  /** Retención: evaluación final vs. refuerzo anónimo (días después), por tema. El refuerzo usa la versión 1
      del banco de preguntas; se guarda { tema: opción elegida }. Misma forma que antesDespues (pre = evaluación, post = refuerzo). */
  retencion(refs, regs){
    const ks = (REP.refuerzo || []).filter(k => CONTENT.quiz[k]), cr = this.conResp(regs);
    const D = (refs || []).map(d => d && d.respuestas ? d.respuestas : d).filter(d => d && typeof d === 'object');
    const items = ks.map(k => {
      const q = typeof preguntaDe === 'function' ? preguntaDe(k, 1) : CONTENT.quiz[k], ref = D.filter(d => d[k] != null);
      return { k, q, preN:cr.length, postN:ref.length,
        pre: this.pct(cr.filter(r => respOk(r.respuestas[k], k)).length, cr.length),
        post: this.pct(ref.filter(d => +d[k] === q.c).length, ref.length) };
    });
    const ok = items.filter(x => x.pre != null && x.post != null);
    return { n:D.length, items, pre: ok.length ? Math.round(this.avg(ok.map(x => x.pre))) : null, post: ok.length ? Math.round(this.avg(ok.map(x => x.post))) : null };
  },

  /** Percepción de riesgo: suma las encuestas anónimas del desafío en vivo, por pregunta. */
  percepcion(desafios){
    const map = new Map();
    (desafios || []).forEach(d => { const P = d && (d.datos || d).preguntas; (P || []).forEach(p => {
      if(p.tipo !== 'encuesta' || !Array.isArray(p.dist)) return;
      if(!map.has(p.q)) map.set(p.q, { q:p.q, opciones:p.opciones, dist:p.opciones.map(() => 0), salas:0 });
      const m = map.get(p.q); m.salas++; p.dist.forEach((v, i) => { if(i < m.dist.length) m.dist[i] += +v || 0; });
    }); });
    return [...map.values()].map(m => { const tot = m.dist.reduce((s, x) => s + x, 0); return { ...m, tot, pcts:m.dist.map(v => this.pct(v, tot) || 0) }; });
  },

  /** Actividad por mes (últimos n meses). */
  porMes(regs, n){
    n = n || 12; const now = new Date(), out = [];
    for(let i = n - 1; i >= 0; i--){
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1), key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const rs = regs.filter(r => this.day(r.fecha).slice(0, 7) === key), ev = this.evaluados(rs);
      out.push({ key, label: d.toLocaleDateString('es-AR', { month:'short' }).replace('.', '') + (d.getMonth() === 0 || i === n - 1 ? ' ' + String(d.getFullYear()).slice(2) : ''),
        n:rs.length, aprob:ev.filter(r => r.estado === 'APROBADO').length, jornadas:new Set(rs.map(r => r.jornada_id).filter(Boolean)).size });
    }
    return out;
  },

  /* ---------- Vigencia y vencimientos ---------- */
  vence(fecha){
    if(!REP.vigenciaMeses || !fecha) return null;
    const d = new Date(this.day(fecha) + 'T12:00:00'); d.setMonth(d.getMonth() + REP.vigenciaMeses); return d;
  },
  estadoVigencia(fecha){
    const v = this.vence(fecha); if(!v) return { estado:'vigente', vence:null, dias:null };
    const dias = Math.ceil((v - new Date()) / 864e5);
    return { estado: dias < 0 ? 'vencido' : dias <= REP.avisoVencimientoDias ? 'por vencer' : 'vigente', vence:v, dias };
  },
  /** Última aprobación de cada trabajador (por empresa + legajo). */
  personas(regs){
    const m = new Map();
    regs.forEach(r => {
      const k = this.key(r.empresa) + '|' + String(r.legajo || '').toUpperCase();
      if(!m.has(k)) m.set(k, { key:k, empresa:r.empresa, legajo:String(r.legajo || '').toUpperCase(), nombre:r.nombre, apellido:r.apellido, sector:r.sector, tipo:r.tipo_vehiculo, regs:[] });
      const p = m.get(k); p.regs.push(r); if(r.sector) p.sector = r.sector; if(r.tipo_vehiculo) p.tipo = r.tipo_vehiculo;
    });
    m.forEach(p => {
      p.regs.sort((a, b) => this.day(a.fecha) < this.day(b.fecha) ? -1 : 1);
      p.ultimaAprob = [...p.regs].reverse().find(r => r.estado === 'APROBADO') || null;
      p.ultimo = p.regs[p.regs.length - 1];
      p.vig = p.ultimaAprob ? this.estadoVigencia(p.ultimaAprob.fecha) : { estado:'sin aprobar', vence:null, dias:null };
    });
    return [...m.values()];
  },

  /** Resumen por empresa: actividad, resultados, cobertura de nómina y vencimientos. */
  empresas(regs, jornadas, nomina){
    const keys = new Map();
    const add = (name) => { const k = this.key(name); if(!k) return null; if(!keys.has(k)) keys.set(k, { key:k, nombre:String(name).trim(), regs:[], jornadas:[], nomina:[] }); return keys.get(k); };
    (jornadas || []).forEach(j => { const e = add(j.empresa); e && e.jornadas.push(j); });
    regs.forEach(r => { const e = add(r.empresa); e && e.regs.push(r); });
    (nomina || []).forEach(n => { const e = add(n.empresa); e && e.nomina.push(n); });
    return [...keys.values()].map(e => {
      const pers = this.personas(e.regs), byLeg = new Map(pers.map(p => [p.legajo, p]));
      const conAprob = pers.filter(p => p.ultimaAprob);
      const vig = conAprob.filter(p => p.vig.estado !== 'vencido');
      const cub = e.nomina.length ? e.nomina.filter(n => { const p = byLeg.get(String(n.legajo).toUpperCase()); return p && p.ultimaAprob && p.vig.estado !== 'vencido'; }).length : null;
      const fechas = e.jornadas.map(j => this.day(j.fecha)).concat(e.regs.map(r => this.day(r.fecha))).filter(Boolean).sort();
      return { ...e, ...this.resumen(e.regs), personas:pers, trabajadores:pers.length,
        vigentes: vig.filter(p => p.vig.estado === 'vigente').length, porVencer: vig.filter(p => p.vig.estado === 'por vencer').length,
        vencidos: conAprob.filter(p => p.vig.estado === 'vencido').length,
        nominaN:e.nomina.length, cubiertos:cub, cobertura: e.nomina.length ? this.pct(cub, e.nomina.length) : null,
        pendientes: e.nomina.filter(n => { const p = byLeg.get(String(n.legajo).toUpperCase()); return !(p && p.ultimaAprob && p.vig.estado !== 'vencido'); }),
        ultima: fechas[fechas.length - 1] || null, sat:this.satisfaccion(e.regs) };
    }).sort((a, b) => (b.ultima || '').localeCompare(a.ultima || ''));
  },

  /** Recomendación del informe individual según el resultado. */
  recomendacion(r, fallados){
    if(r.estado === 'APROBADO' && !fallados.length) return 'Comprendió todos los contenidos evaluados. Se sugiere mantener las conductas preventivas y repasar el material antes de la próxima capacitación.';
    if(r.estado === 'APROBADO') return `Aprobó la capacitación. Se sugiere repasar ${fallados.length === 1 ? 'el tema indicado' : 'los temas indicados'} arriba, por ejemplo en una charla breve de 5 minutos.`;
    if(r.estado === 'NO APROBADO') return `No alcanzó el criterio de aprobación (${CONFIG.aprobacion.porcentajeMinimo} %). Se recomienda una instancia de refuerzo con el capacitador${fallados.length ? ' sobre los temas indicados arriba' : ''} y volver a rendir la evaluación.`;
    return 'No completó la evaluación. Se recomienda completarla para obtener el certificado de aprobación.';
  }
};

/* ---------- Colores del mapa de riesgo (divergente azul ↔ rojo, centrado en el criterio) ---------- */
function riskColor(p){
  const min = CONFIG.aprobacion.porcentajeMinimo;
  if(p == null) return { bg:'transparent', ink:'inherit' };
  if(p < min - 30) return { bg:'#c8413b', ink:'#ffffff' };
  if(p < min - 15) return { bg:'#e7837c', ink:'#1b1f24' };
  if(p < min)      return { bg:'#f6c6c3', ink:'#1b1f24' };
  if(p < 95)       return { bg:'#b7d3f6', ink:'#1b1f24' };
  return { bg:'#5598e7', ink:'#0d1424' };
}
function riskLegendItems(){
  const min = CONFIG.aprobacion.porcentajeMinimo;
  return [[min - 31, `menos de ${min - 30} %`], [min - 16, `${min - 30} a ${min - 16} %`], [min - 1, `${min - 15} a ${min - 1} %`], [min, `${min} a 94 %`], [100, '95 % o más']]
    .map(([v, t]) => ({ ...riskColor(v), t }));
}
