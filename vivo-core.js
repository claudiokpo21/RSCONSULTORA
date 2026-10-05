'use strict';
/* vivo-core.js — NÚCLEO DEL DESAFÍO EN VIVO (compartido por vivo.html y jugar.html)
   Transporte en tiempo real:
     · Supabase Realtime (Broadcast) si CONFIG.supabase está configurado (cliente compartido de central.js).
       No usa tablas: los mensajes pasan por el canal y no quedan guardados.
     · BroadcastChannel del navegador (modo demostración): comunica pestañas del mismo navegador.
   Protocolo (todos los mensajes llevan { t: tipo }):
     jugador → anfitrión: join { pid, name, team } · answer { pid, q, choice }
     anfitrión → todos:  state { phase, ... } · welcome { pid, name } · reject { pid, reason }
   RS Consultora · Fatiga y Conducción Segura */

const VIVO = Object.assign({ tiempoPregunta:20, puntosBase:500, puntosVelocidad:500, maxParticipantes:150 }, CONFIG.vivo || {});
const EQUIPOS = [ { id:'Livianos', icon:'car', label:'Equipo Livianos' }, { id:'Pesados', icon:'truck', label:'Equipo Pesados' } ];
const OPC = [
  { col:'#f5b301', ink:'#14161a', shape:'<path d="M12 3l10 18H2z"/>' },
  { col:'#6b95e8', ink:'#0d1424', shape:'<path d="M12 2l10 10-10 10L2 12z"/>' },
  { col:'#2bb3a6', ink:'#06201d', shape:'<circle cx="12" cy="12" r="10"/>' },
  { col:'#a98bf0', ink:'#1a1030', shape:'<rect x="3" y="3" width="18" height="18" rx="2.5"/>' }
];
function shapeSVG(i){ return `<svg class="shape" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${OPC[i].shape}</svg>`; }
function tipoLabel(t){ return { quiz:'Pregunta', vf:'Mito o realidad', encuesta:'Encuesta anónima' }[t] || 'Pregunta'; }
function itemOptions(it){ return it.tipo === 'vf' ? ['MITO','REALIDAD'] : it.o; }
function liveMode(){ return (typeof rsClient === 'function' && rsClient()) ? 'supabase' : 'local'; }
function playUrl(code){ return new URL('jugar.html?sala=' + encodeURIComponent(code), location.href).href; }
function ordinal(n){ return n + 'º'; }
function vibrate(ms){ try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} }

/** Abre el canal de la sala (ver openBus en central.js). */
function openChannel(code, onMsg, onStatus){ return openBus('rs-vivo-' + code, onMsg, onStatus); }

function modeBanner(){
  return liveMode() === 'supabase'
    ? ''
    : fb('info','Modo demostración','Sin Supabase configurado, el desafío funciona con participantes simulados o con pestañas de este mismo navegador. Para que los trabajadores jueguen desde sus celulares, completá CONFIG.supabase en assets/config.js (ver README).');
}
