'use strict';
/* common.js — datos, almacenamiento, utilidades y componentes compartidos
   RS Consultora · Fatiga y Conducción Segura */

// Íconos (sprite SVG compartido por todas las páginas)
document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="i-truck" viewBox="0 0 24 24"><rect x="1" y="5" width="14" height="11" rx="1"/><path d="M15 9h4l3 3v4h-7z"/><circle cx="5.5" cy="18" r="2"/><circle cx="18.5" cy="18" r="2"/></symbol>
<symbol id="i-car" viewBox="0 0 24 24"><path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v4a1 1 0 0 1-1 1h-1M3 13v4a1 1 0 0 0 1 1h1M3 13h18M9 18h6"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></symbol>
<symbol id="i-moon" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></symbol>
<symbol id="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-eyeoff" viewBox="0 0 24 24"><path d="M2 10c3 4 7 5 10 5s7-1 10-5"/><path d="M5 13.5l-2 2M9 15l-1 2.5M15 15l1 2.5M19 13.5l2 2"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></symbol>
<symbol id="i-stop" viewBox="0 0 24 24"><path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z"/><path d="M8 12h8"/></symbol>
<symbol id="i-message" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></symbol>
<symbol id="i-bed" viewBox="0 0 24 24"><path d="M2 18V6M2 14h20v4M22 14v-2a3 3 0 0 0-3-3h-8v5"/><circle cx="6.5" cy="11" r="2"/></symbol>
<symbol id="i-route" viewBox="0 0 24 24"><path d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></symbol>
<symbol id="i-activity" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></symbol>
<symbol id="i-droplet" viewBox="0 0 24 24"><path d="M12 2.7l5.7 5.6a8 8 0 1 1-11.4 0z"/></symbol>
<symbol id="i-thermo" viewBox="0 0 24 24"><path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/></symbol>
<symbol id="i-pill" viewBox="0 0 24 24"><path d="M10.5 20.5a4.9 4.9 0 0 1-7-7l10-10a4.9 4.9 0 0 1 7 7z"/><path d="M8.5 8.5l7 7"/></symbol>
<symbol id="i-glass" viewBox="0 0 24 24"><path d="M7 2h10l-1 9a4 4 0 0 1-8 0zM12 15v6M8 22h8"/></symbol>
<symbol id="i-food" viewBox="0 0 24 24"><path d="M3 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2M6 2v20M18 15V2a4 4 0 0 0-4 4v7h4zM18 15v7"/></symbol>
<symbol id="i-repeat" viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>
<symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></symbol>
<symbol id="i-road" viewBox="0 0 24 24"><path d="M4 22L9 2M20 22L15 2M12 4v3M12 11v3M12 18v3"/></symbol>
<symbol id="i-steering" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2.5"/><path d="M12 14.5V22M9.5 12H2M14.5 12H22"/></symbol>
<symbol id="i-yawn" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7.5 9.5h3M13.5 9.5h3"/><ellipse cx="12" cy="15.5" rx="2" ry="2.6"/></symbol>
<symbol id="i-move" viewBox="0 0 24 24"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></symbol>
<symbol id="i-lane" viewBox="0 0 24 24"><path d="M5 2v20M19 2v20"/><path d="M10 21c0-5 4-7 4-12s-2-6-2-7"/></symbol>
<symbol id="i-brake" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/><path d="M3.5 6a11 11 0 0 0 0 12M20.5 6a11 11 0 0 1 0 12"/></symbol>
<symbol id="i-sign" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="10" rx="1"/><path d="M12 13v9M8 22h8M8 8h8"/></symbol>
<symbol id="i-hourglass" viewBox="0 0 24 24"><path d="M6 2h12M6 22h12M7 2v4a5 5 0 0 0 10 0V2M7 22v-4a5 5 0 0 1 10 0v4"/></symbol>
<symbol id="i-brain" viewBox="0 0 24 24"><path d="M9.5 3A3.5 3.5 0 0 0 6 6.5 3.5 3.5 0 0 0 3 10a3.5 3.5 0 0 0 1.5 2.9A3.5 3.5 0 0 0 6 18.5 3 3 0 0 0 9 21h.5a2.5 2.5 0 0 0 2.5-2.5v-13A2.5 2.5 0 0 0 9.5 3z"/><path d="M14.5 3A3.5 3.5 0 0 1 18 6.5 3.5 3.5 0 0 1 21 10a3.5 3.5 0 0 1-1.5 2.9 3.5 3.5 0 0 1-1.5 5.6A3 3 0 0 1 15 21h-.5a2.5 2.5 0 0 1-2.5-2.5"/></symbol>
<symbol id="i-weight" viewBox="0 0 24 24"><circle cx="12" cy="5" r="3"/><path d="M6.5 8h11l2.5 13H4z"/></symbol>
<symbol id="i-box" viewBox="0 0 24 24"><path d="M21 16V8l-9-5-9 5v8l9 5z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></symbol>
<symbol id="i-building" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></symbol>
<symbol id="i-home" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></symbol>
<symbol id="i-pause" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="M6 3l14 9-14 9z"/></symbol>
<symbol id="i-ruler" viewBox="0 0 24 24"><path d="M2 12h20M2 8v8M22 8v8M7 10v4M12 9v6M17 10v4"/></symbol>
<symbol id="i-clipboard" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="19" rx="2"/><path d="M9 2h6v3H9zM9 11h6M9 15h6"/></symbol>
<symbol id="i-refresh" viewBox="0 0 24 24"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></symbol>
<symbol id="i-arrowl" viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></symbol>
<symbol id="i-chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></symbol>
<symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>
<symbol id="i-print" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></symbol>
<symbol id="i-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></symbol>
<symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></symbol>
<symbol id="i-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>
<symbol id="i-flag" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/></symbol>
<symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></symbol>
<symbol id="i-music" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></symbol>
<symbol id="i-award" viewBox="0 0 24 24"><circle cx="12" cy="8" r="7"/><path d="M8.2 13.9L7 23l5-3 5 3-1.2-9.1"/></symbol>
</defs></svg>`);

/* =====================================================================
   c) MODELO DE DATOS  (participante / capacitación / evaluación)
   ===================================================================== */
function newState(){
  return {
    recordId: null, token: null, firma: null, verificacion: null, jornada: null,
    participant: { legajo:'', nombre:'', apellido:'', empresa:'', sector:'', tipoVehiculo:'' },
    training: { nombre: CONFIG.capacitacion.nombre, fechaInicio:null, fechaFin:null, duracion:null /* minutos */ },
    evaluation: { preguntas: CONTENT.quiz.length, correctas:0, incorrectas:0, porcentaje:0, intentos:0, estado:'SIN COMPLETAR' },
    quiz: { idx:0, answers:[], done:false },
    current: 0,
    finalizada: false,
    ui: {}   // estado de interacciones por pantalla
  };
}
let State = newState();

/** Registro completo listo para almacenar o enviar a un sistema centralizado. */
function buildRecord(){
  const p = State.participant, t = State.training, e = State.evaluation;
  return {
    id: State.recordId,
    participant: { legajo:p.legajo, nombre:p.nombre, apellido:p.apellido, empresa:p.empresa, sector:p.sector, tipoVehiculo:p.tipoVehiculo },
    training: { nombre:t.nombre, capacitador:capacitador(), consultora:CONFIG.consultora.nombre, codigo:CONFIG.capacitacion.codigo, version:CONFIG.capacitacion.version, fechaInicio:t.fechaInicio, fechaFin:t.fechaFin, duracion:t.duracion },
    evaluation: { preguntas:e.preguntas, correctas:e.correctas, incorrectas:e.incorrectas, porcentaje:e.porcentaje, intentos:e.intentos, estado:e.estado, criterioAprobacion:CONFIG.aprobacion.porcentajeMinimo },
    meta: { finalizada: State.finalizada, almacenamiento:'local', actualizado: new Date().toISOString() }
  };
}

/* =====================================================================
   d) ALMACENAMIENTO (local). Preparado para agregar almacenamiento central.
   Los datos quedan SOLO en este navegador/dispositivo.
   ===================================================================== */
const Store = {
  mem: [],
  available: (function(){ try{ const k='__t'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true; }catch(e){ return false; } })(),
  all(){
    if(!this.available) return this.mem.slice();
    try{ return JSON.parse(localStorage.getItem(CONFIG.almacenamiento.clave) || '[]'); }catch(e){ return []; }
  },
  saveAll(list){
    if(!this.available){ this.mem = list; return; }
    try{ localStorage.setItem(CONFIG.almacenamiento.clave, JSON.stringify(list)); }catch(e){ this.mem = list; }
  },
  upsert(rec){
    const list = this.all(); const i = list.findIndex(r => r.id === rec.id);
    if(i >= 0) list[i] = rec; else list.push(rec);
    this.saveAll(list);
  },
  clear(){ this.saveAll([]); }
};
const SessionReg = {
  mem: [],
  list(){ try{ return JSON.parse(sessionStorage.getItem(CONFIG.almacenamiento.claveSesion) || '[]'); }catch(e){ return this.mem; } },
  add(legajo){ const l = this.list(); l.push(legajo.toUpperCase()); try{ sessionStorage.setItem(CONFIG.almacenamiento.claveSesion, JSON.stringify(l)); }catch(e){ this.mem = l; } },
  has(legajo){ return this.list().includes(legajo.toUpperCase()); }
};
function persist(){ if(State.recordId) Store.upsert(buildRecord()); }

/* =====================================================================
   UTILIDADES
   ===================================================================== */
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function ic(n, c=''){ return `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"></use></svg>`; }
function pad(n){ return String(n).padStart(2,'0'); }
function fmtDate(d){ d = new Date(d); return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`; }
function fmtTime(d){ d = new Date(d); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function isoLocal(d){ d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function minutesBetween(a,b){ return Math.max(1, Math.round((new Date(b) - new Date(a)) / 60000)); }
function uid(){ return 'REG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,6).toUpperCase(); }
function head(mod, title, lead){ return `<header class="s-head"><p class="eyebrow">${mod}</p><h1 class="s-title">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</header>`; }
function fb(kind, title, body){ const icon = {ok:'check', bad:'x', warn:'alert', info:'info'}[kind]; return `<div class="fb fb-${kind}" role="status">${ic(icon)}<div><strong>${title}</strong>${body ? `<p>${body}</p>` : ''}</div></div>`; }
function isApproved(pct){ return pct >= CONFIG.aprobacion.porcentajeMinimo; }
function capacitador(){ return CONFIG.organizacion.capacitador || CONFIG.consultora.capacitador; }
function fullName(){ return `${State.participant.nombre} ${State.participant.apellido}`; }
function toggleBtn(b){ const v = b.getAttribute('aria-pressed') === 'true'; b.setAttribute('aria-pressed', String(!v)); return !v; }

/* Ilustración de portada (SVG propio) */
const ART_ROAD = `
<svg class="art" viewBox="0 0 480 360" role="img" aria-label="Ilustración: ruta al atardecer con una camioneta, un camión y un cartel de área de descanso">
 <defs>
  <linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1320"/><stop offset=".75" stop-color="#26303d"/><stop offset="1" stop-color="#4a3b22"/></linearGradient>
  <linearGradient id="gRoad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c333b"/><stop offset="1" stop-color="#14181c"/></linearGradient>
 </defs>
 <rect width="480" height="360" rx="18" fill="url(#gSky)"/>
 <g fill="#dfe6ee" opacity=".7"><circle cx="40" cy="40" r="1.2"/><circle cx="110" cy="70" r="1"/><circle cx="170" cy="30" r="1.3"/><circle cx="250" cy="55" r="1"/><circle cx="310" cy="25" r="1.2"/><circle cx="60" cy="110" r="1"/><circle cx="450" cy="120" r="1"/></g>
 <circle cx="392" cy="72" r="24" fill="#f3e2ae"/><circle cx="404" cy="64" r="22" fill="#111a27"/>
 <path d="M0 214 L60 168 L118 196 L190 142 L262 190 L330 150 L410 196 L480 170 V232 H0z" fill="#1a232e"/>
 <g stroke="#2a3542" stroke-width="4" fill="none" stroke-linecap="round"><path d="M44 222 L60 176 L76 222"/><path d="M36 184 L96 172"/><path d="M96 172 L96 196"/></g>
 <rect x="0" y="222" width="480" height="138" fill="#12171c"/>
 <path d="M204 222 L276 222 L430 360 L50 360z" fill="url(#gRoad)"/>
 <path d="M204 222 L50 360 M276 222 L430 360" stroke="#f5b301" stroke-width="3" opacity=".75"/>
 <path class="dash-anim" d="M240 224 L240 360" stroke="#e8eaed" stroke-width="4" stroke-dasharray="14 18"/>
 <g transform="translate(212 230)"><rect x="3" y="-7" width="18" height="9" rx="2" fill="#f5b301"/><rect x="5" y="-5" width="14" height="5" fill="#1a2330"/><rect width="24" height="13" rx="2.5" fill="#f5b301"/><rect x="1.5" y="8" width="4" height="2.5" fill="#e5484d"/><rect x="18.5" y="8" width="4" height="2.5" fill="#e5484d"/></g>
 <g transform="translate(252 244)"><rect width="78" height="74" rx="4" fill="#d9dde2"/><path d="M39 6 V66" stroke="#aab2bb" stroke-width="2"/><rect x="0" y="66" width="78" height="9" fill="#7d858e"/><rect x="5" y="56" width="11" height="7" rx="1" fill="#e5484d"/><rect x="62" y="56" width="11" height="7" rx="1" fill="#e5484d"/><rect x="6" y="75" width="17" height="11" rx="2" fill="#0b0d10"/><rect x="55" y="75" width="17" height="11" rx="2" fill="#0b0d10"/><rect x="26" y="20" width="26" height="12" rx="2" fill="#f5b301"/></g>
 <g transform="translate(372 168)"><rect x="17" y="40" width="4" height="54" fill="#6f7a86"/><rect width="84" height="46" rx="4" fill="#1f6f4a" stroke="#e8eaed" stroke-width="2"/><text x="42" y="19" text-anchor="middle" font-family="Arial" font-size="9.5" font-weight="700" fill="#fff">ÁREA DE</text><text x="42" y="33" text-anchor="middle" font-family="Arial" font-size="9.5" font-weight="700" fill="#fff">DESCANSO</text></g>
</svg>`;


/* =====================================================================
   ENVÍO DE RESULTADOS (planilla central)
   Si CONFIG.integracion.endpoint tiene la URL de Google Apps Script, cada registro
   se envía allí. Si está vacío, el prototipo trabaja solo con almacenamiento local.
   ===================================================================== */
const Sync = {
  enabled(){ return !!(CONFIG.integracion.endpoint || typeof CONFIG.integracion.enviarResultado === 'function'); },
  async send(rec){
    if(!this.enabled()) return 'local';
    try{
      if(typeof CONFIG.integracion.enviarResultado === 'function'){ await CONFIG.integracion.enviarResultado(rec); return 'sent'; }
      // text/plain evita la verificación previa (CORS) que Google Apps Script no responde.
      await fetch(CONFIG.integracion.endpoint, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body: JSON.stringify(rec) });
      return 'sent';
    }catch(err){ console.warn('Envío no realizado:', err); return 'error'; }
  }
};

/* =====================================================================
   MARCA, ENLACES Y QR
   ===================================================================== */
function initBrand(){
  const m = document.getElementById('brandMark'); if(m) m.innerHTML = brandMarkHTML();
  const n = document.getElementById('brandName'); if(n) n.textContent = CONFIG.consultora.nombre.toUpperCase();
}
function evalUrl(){
  // Conserva el código de jornada (?j=) para que los resultados queden asociados a esa jornada.
  const u = new URL(CONFIG.publicacion.urlEvaluacion || 'evaluacion.html', location.href);
  const j = new URLSearchParams(location.search).get('j');
  if(j) u.searchParams.set('j', j.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8));
  return u.href;
}
function qrSVG(text){
  if(typeof qrcode !== 'function') return '<p style="color:#111;padding:24px;line-height:1.4">QR no disponible</p>';
  const q = qrcode(0, 'M'); q.addData(text); q.make();
  return q.createSvgTag({ cellSize:6, margin:2, scalable:true, alt:'Código QR de la evaluación' });
}
function toggleFullscreen(){
  try{ document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }catch(e){}
}

/* ---------- Sonido de alarma (simulador de microsueño) ----------
   Se crea con el toque del usuario (los navegadores bloquean el audio sin interacción).
   Devuelve una función que, al llamarla, hace sonar 3 pitidos dobles tipo despertador
   y vibra en los celulares que lo permiten. Sin archivos de audio: se genera en el navegador. */
function despertador(){
  let ctx = null;
  try{ const AC = window.AudioContext || window.webkitAudioContext; if(AC){ ctx = new AC(); if(ctx.state === 'suspended') ctx.resume(); } }catch(e){ ctx = null; }
  return function(){
    try{ navigator.vibrate && navigator.vibrate([180, 90, 180, 90, 180]); }catch(e){}
    if(!ctx) return;
    try{
      const t0 = ctx.currentTime + 0.02, vol = ctx.createGain();
      vol.gain.value = 0.22; vol.connect(ctx.destination);
      for(let i = 0; i < 3; i++){
        [0, 0.13].forEach((d, k) => {
          const o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + i * 0.42 + d;
          o.type = 'square'; o.frequency.value = k ? 1320 : 990;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.01);
          g.gain.setValueAtTime(1, t + 0.09); g.gain.linearRampToValueAtTime(0, t + 0.11);
          o.connect(g); g.connect(vol); o.start(t); o.stop(t + 0.12);
        });
      }
      setTimeout(() => { try{ ctx.close(); }catch(e){} }, 2000);
    }catch(e){}
  };
}

const TIPOS = ['Vehículo liviano','Vehículo pesado','Ambos'];
function brandMarkHTML(){ const logo = CONFIG.organizacion.logo; return logo ? `<img class="brand-logo" src="${esc(logo)}" alt="${esc(CONFIG.consultora.nombre)}">` : `<span class="brand-mark rs" aria-label="${esc(CONFIG.consultora.nombre)}">${esc(CONFIG.consultora.iniciales)}</span>`; }

/* ---- Componentes reutilizables ---- */
function instructorCard(label){ const c = CONFIG.consultora; return `<div class="instructor"><span class="avatar" aria-hidden="true">${esc(c.iniciales)}</span><div><small>${esc(label)}</small><strong>${esc(capacitador())}</strong><span class="org">${esc(c.rol)} · ${esc(c.nombre)}</span></div></div>`; }
function pledgeHTML(){ const c = CONFIG.consultora; return `<div class="pledge"><span class="avatar" aria-hidden="true">${esc(c.iniciales)}</span><div><p>“${esc(c.mensaje)}”</p><footer>${esc(capacitador())} · ${esc(c.nombre)}</footer></div></div>`; }
function revealCard(s){ return `<button class="card reveal" aria-expanded="false">${ic(s.icon,'lg')}<strong>${s.t}</strong><span class="rv-more">${ic('chev')} Tocá para ver más</span><span class="rv-back">${s.d}</span></button>`; }
function bindReveal(r){ $$('.reveal', r).forEach(b => b.onclick = () => b.setAttribute('aria-expanded', String(b.getAttribute('aria-expanded') !== 'true'))); }

/* =====================================================================
   CONSTANCIA (impresión A4)
   ===================================================================== */
/** Arma la constancia en el área de impresión (sin imprimir). */
function renderCertificate(){
  const p = State.participant, e = State.evaluation, t = State.training, o = CONFIG.organizacion;
  const fecha = fmtDate(t.fechaFin || new Date());
  $('#printArea').innerHTML = `<div class="cert">
    <div class="cert-top"><div class="brandrow">${o.logo ? `<img src="${esc(o.logo)}" alt="">` : `<span class="rsmark">${esc(CONFIG.consultora.iniciales)}</span>`}<div><div class="org">${esc(CONFIG.consultora.nombre)}</div><div style="font-size:9pt;color:#555">Higiene y Seguridad</div></div></div>
      <div class="code">Código: ${esc(CONFIG.capacitacion.codigo)} · v${esc(CONFIG.capacitacion.version)}<br>${State.verificacion ? 'Verificación: <b>' + esc(State.verificacion) + '</b>' : 'Registro: ' + esc(State.recordId || '')}</div></div>
    <h1>CONSTANCIA DE CAPACITACIÓN</h1>
    <p class="sub">Capacitación de Higiene y Seguridad</p>
    <p class="body">Se deja constancia de que <b>${esc(fullName())}</b>, legajo <b>${esc(p.legajo)}</b>,<br>completó y aprobó la capacitación<br><b>“${esc(CONFIG.capacitacion.nombre)}”</b>,<br>dictada por ${esc(capacitador())} – ${esc(CONFIG.consultora.nombre)}.</p>
    <table>
      <tr><td>Nombre y apellido</td><td>${esc(fullName())}</td></tr>
      <tr><td>Legajo</td><td>${esc(p.legajo)}</td></tr>
      ${p.empresa ? `<tr><td>Empresa</td><td>${esc(p.empresa)}</td></tr>` : ''}
      ${p.sector ? `<tr><td>Sector / Área</td><td>${esc(p.sector)}</td></tr>` : ''}
      ${p.tipoVehiculo ? `<tr><td>Tipo de vehículo</td><td>${esc(p.tipoVehiculo)}</td></tr>` : ''}
      ${CONFIG.reportes && CONFIG.reportes.mostrarNotaEnCertificado ? `<tr><td>Resultado</td><td>${e.porcentaje} % (${e.correctas} de ${e.preguntas} respuestas correctas)</td></tr>` : ''}
      <tr><td>Estado</td><td class="ok">APROBADO</td></tr>
      <tr><td>Fecha</td><td>${fecha}</td></tr>
      <tr><td>Capacitador</td><td>${esc(capacitador())} · ${esc(CONFIG.consultora.nombre)}</td></tr>
    </table>
    <div class="signs"><div><span class="sigbox">${State.firma ? `<img src="${State.firma}" alt="Firma del participante">` : ''}</span><span class="sigline">Firma del participante</span></div><div><span class="sigbox"></span><span class="sigline">${esc(capacitador())}<br>${esc(CONFIG.consultora.rol)} · ${esc(CONFIG.consultora.nombre)}</span></div></div>
    ${State.verificacion && typeof verifyUrl === 'function' ? `<div class="verify"><div class="vqr">${qrSVG(verifyUrl(State.verificacion))}</div><div><b>Constancia verificable</b><br>Escaneá el código QR o ingresá en <b>${esc(new URL('verificar.html', location.href).href.replace(/^https?:\/\//, ''))}</b> el código <b>${esc(State.verificacion)}</b> para comprobar su autenticidad.</div></div>` : ''}
    <div class="foot">Constancia generada el ${fmtDate(new Date())} a las ${fmtTime(new Date())}. Criterio de aprobación: ${CONFIG.aprobacion.porcentajeMinimo} %. El resultado refleja la comprensión de los contenidos de la capacitación y no constituye una evaluación médica ni de aptitud laboral.</div>
  </div>`;
  document.body.classList.add('print-cert');
}
function printCertificate(){
  renderCertificate();
  const done = () => { document.body.classList.remove('print-cert'); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(() => window.print(), 50);
}

/* =====================================================================
   DIÁLOGOS
   ===================================================================== */
const dlg = $('#dlg');
function confirmDialog(title, text, okLabel, cancelLabel, danger){
  return new Promise(res => {
    dlg.innerHTML = `<h2>${ic('alert')} ${title}</h2><p class="muted">${text}</p><div class="actions"><button class="btn ghost" id="dCancel">${cancelLabel || 'Cancelar'}</button><button class="btn ${danger ? 'danger' : 'primary'}" id="dOk">${okLabel || 'Aceptar'}</button></div>`;
    const close = v => { dlg.close(); res(v); };
    $('#dOk', dlg).onclick = () => close(true); $('#dCancel', dlg).onclick = () => close(false);
    dlg.oncancel = e => { e.preventDefault(); close(false); };
    dlg.showModal(); $('#dCancel', dlg).focus();
  });
}

