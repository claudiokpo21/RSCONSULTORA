'use strict';
/* informe-lib.js — PIEZAS COMPARTIDAS DE LOS DOCUMENTOS A4 (informe de jornada, informe por empresa,
   informe individual y certificados): gráficos SVG de una serie, encabezado de hoja y mapa de riesgo.
   RS Consultora · Fatiga y Conducción Segura */

const INK = '#1b1f24', MUTED = '#5b6470', GRID = '#dfe3e8', BAR = '#2f5fb3';   // una sola serie → un solo color

/* ---------- Gráficos (SVG, una serie, etiqueta directa en la punta) ---------- */
function barPath(x, y, w, h, r){   // barra horizontal: base recta, punta redondeada 4px
  if(w <= 0) return '';
  r = Math.min(r, w, h / 2);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
}
/** rows: [{label, value, text, hint}] · max: valor máximo del eje · ref: línea de referencia opcional {value,label} */
function hbarChart(rows, { max, width = 640, labelW = 230, rightW = 110, unit = '', ref = null, title = '', bh = 16, gap = 9 }){
  const top = ref ? 22 : 6, plotW = width - labelW - rightW;
  const H = top + rows.length * (bh + gap) + 18, x0 = labelW;
  const sx = v => (Math.max(0, v) / (max || 1)) * plotW;
  const ticks = [0, .25, .5, .75, 1].map(t => Math.round(t * max));
  return `<svg class="chart" viewBox="0 0 ${width} ${H}" role="img" aria-label="${esc(title)}">
    ${ticks.map(t => `<line x1="${x0 + sx(t)}" x2="${x0 + sx(t)}" y1="${top - 4}" y2="${H - 16}" stroke="${GRID}" stroke-width="1"/><text x="${x0 + sx(t)}" y="${H - 3}" font-size="10" fill="${MUTED}" text-anchor="middle">${t}${unit}</text>`).join('')}
    ${ref ? `<line x1="${x0 + sx(ref.value)}" x2="${x0 + sx(ref.value)}" y1="${top - 12}" y2="${H - 16}" stroke="${INK}" stroke-width="1"/><text x="${x0 + sx(ref.value) + 4}" y="${top - 6}" font-size="10" fill="${INK}">${esc(ref.label)}</text>` : ''}
    ${rows.map((r, i) => { const y = top + i * (bh + gap); return `<g>
      <title>${esc(r.hint || (r.label + ': ' + r.text))}</title>
      <text x="${x0 - 10}" y="${y + bh / 2 + 4}" font-size="11.5" fill="${INK}" text-anchor="end">${esc(r.label)}</text>
      <path d="${barPath(x0, y, sx(r.value), bh, 4)}" fill="${BAR}"/>
      <text x="${x0 + sx(r.value) + 6}" y="${y + bh / 2 + 4}" font-size="11.5" font-weight="700" fill="${INK}">${esc(r.text)}</text></g>`; }).join('')}
    <line x1="${x0}" x2="${x0}" y1="${top - 4}" y2="${H - 16}" stroke="${MUTED}" stroke-width="1"/>
  </svg>`;
}


/* ---------- Encabezado de cada hoja ---------- */
function sheetHead(j, label){
  return `<header class="r-head">
    <div class="r-brand"><span class="r-mark">${esc(CONFIG.consultora.iniciales)}</span><div><b>${esc(CONFIG.consultora.nombre)}</b><small>Higiene y Seguridad · Capacitación</small></div></div>
    <div class="r-meta">${esc(label || 'Informe ' + j.codigo)}<br>Emitido el ${fmtDate(new Date())}</div>
  </header>`;
}

/* ---------- Mapa de riesgo (tabla con color divergente centrado en el criterio) ---------- */
const SHORT_T = ['Definición','Señales','Microsueño','Factores','Sueño','Livianos','Pesados','Prevención','Café','Qué hacer'];
function mapaTabla(rows, dimLabel){
  if(!rows.length) return '<p class="r-empty">Sin evaluaciones con respuestas.</p>';
  return `<table class="r-heat"><thead><tr><th>${esc(dimLabel)}</th><th>n</th>${SHORT_T.map((t, k) => `<th title="${esc(tema(k))}">${esc(t)}</th>`).join('')}<th>Prom.</th></tr></thead>
    <tbody>${rows.map(r => `<tr class="${r.n < 3 ? 'few' : ''}"><th>${esc(r.grupo)}</th><td class="n">${r.n}</td>${r.cells.map(p => { const c = riskColor(p); return `<td style="background:${c.bg};color:${c.ink}">${p}</td>`; }).join('')}<td class="pr">${r.prom} %</td></tr>`).join('')}</tbody></table>
    <div class="r-legend">${riskLegendItems().map(i => `<span><i style="background:${i.bg}"></i>${esc(i.t)}</span>`).join('')}<span>· % de acierto por tema · * rayado: menos de 3 evaluados</span></div>`;
}
/* Dos series (antes / después) con etiqueta directa en cada barra */
const C_ANTES = '#2a78d6', C_DESPUES = '#eda100';
function antesDespuesChart(ad, o){
  o = Object.assign({ a:'Antes (diagnóstico anónimo)', b:'Después (evaluación final)', ca:C_ANTES, cb:C_DESPUES }, o || {});
  const W = 640, labelW = 190, rightW = 46, plotW = W - labelW - rightW, bh = 10, gap = 2, grp = bh * 2 + gap + 7;
  const H = 8 + ad.items.length * grp + 16, sx = v => (Math.max(0, v || 0) / 100) * plotW;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Antes y después">
    ${[0, 25, 50, 75, 100].map(t => `<line x1="${labelW + sx(t)}" x2="${labelW + sx(t)}" y1="4" y2="${H - 16}" stroke="${GRID}"/><text x="${labelW + sx(t)}" y="${H - 3}" font-size="10" fill="${MUTED}" text-anchor="middle">${t}%</text>`).join('')}
    ${ad.items.map((x, i) => { const y = 8 + i * grp; return `<g><title>${esc(x.q.q)}</title>
      <text x="${labelW - 10}" y="${y + bh + 4}" font-size="11" fill="${INK}" text-anchor="end">${esc(tema(x.k))}</text>
      <path d="${barPath(labelW, y, sx(x.pre), bh, 4)}" fill="${o.ca}"/><text x="${labelW + sx(x.pre) + 5}" y="${y + bh - 2}" font-size="10" fill="${INK}">${x.pre ?? '–'}%</text>
      <path d="${barPath(labelW, y + bh + gap, sx(x.post), bh, 4)}" fill="${o.cb}"/><text x="${labelW + sx(x.post) + 5}" y="${y + bh * 2 + gap - 2}" font-size="10" font-weight="700" fill="${INK}">${x.post ?? '–'}%</text></g>`; }).join('')}
    <line x1="${labelW}" x2="${labelW}" y1="4" y2="${H - 16}" stroke="${MUTED}"/></svg>
    <div class="r-legend"><span><i style="background:${o.ca}"></i>${esc(o.a)}</span><span><i style="background:${o.cb}"></i>${esc(o.b)}</span></div>`;
}
function estrellas(n){ return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
function satisfaccionHTML(s){
  if(!s.n) return '<p class="r-empty">Sin calificaciones registradas.</p>';
  return `<div class="r-two"><div><p class="r-big">${s.prom.toFixed(1).replace('.', ',')} <small>de 5</small></p><p class="r-note">${s.n} respuesta${s.n === 1 ? '' : 's'} · ${s.pctPos} % calificó con 4 o 5.</p></div>
    <div>${hbarChart([5,4,3,2,1].map(v => ({ label:estrellas(v), value:s.dist[v - 1], text:String(s.dist[v - 1]) })), { max:Math.max(1, ...s.dist), width:420, labelW:90, rightW:40, title:'Calificaciones', bh:12, gap:7 })}</div></div>
    ${s.comentarios.length ? `<h3 class="r-h3">Comentarios (anónimos)</h3><ul class="r-quotes">${s.comentarios.slice(-4).map(c => `<li>“${esc(c)}”</li>`).join('')}</ul>` : ''}`;
}
function percepcionHTML(P){
  if(!P.length) return '<p class="r-empty">Sin encuestas del desafío en vivo registradas.</p>';
  return P.map(p => `<h3 class="r-h3">${esc(p.q)}</h3>${hbarChart(p.opciones.map((o, i) => ({ label:o, value:p.pcts[i], text:`${p.pcts[i]} % (${p.dist[i]})` })), { max:100, unit:'%', labelW:240, rightW:90, title:p.q, bh:11, gap:5 })}`).join('')
    + '<p class="r-note">Encuestas anónimas del desafío en vivo: solo se registran los totales.</p>';
}
function toolbarMsg(title, body){ return `<section class="sheet r-msg"><h1 class="r-title">${esc(title)}</h1><p>${body}</p><p><a href="admin.html">Ir a Administración</a></p></section>`; }
