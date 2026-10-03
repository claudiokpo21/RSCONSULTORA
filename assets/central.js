'use strict';
/* central.js — REGISTRO CENTRAL (Supabase)
   · Participantes: registran su evaluación con un token secreto propio del dispositivo
     (nadie más puede modificar ese registro ni leer los de otros).
   · Sin señal: los envíos quedan en cola en el dispositivo y se reintentan solos al volver la conexión.
   · Administración: login de Supabase Auth + lista de administradores (rs_capacitacion.administradores).
   RS Consultora · Fatiga y Conducción Segura */

// Se guarda antes de crear el cliente: Supabase limpia el enlace de recuperación de la URL al procesarlo.
const RS_URL_HASH = location.hash || '';
function rsClient(){
  const S = CONFIG.supabase || {};
  if(!S.url || !S.clavePublica || !window.supabase || !window.supabase.createClient) return null;
  return window.__rsSb || (window.__rsSb = window.supabase.createClient(S.url, S.clavePublica, {
    auth:{ persistSession:true, autoRefreshToken:true, storageKey:'rs-capacitacion-auth' },
    realtime:{ params:{ eventsPerSecond:20 } }
  }));
}
function randomToken(){
  const a = new Uint8Array(24);
  (window.crypto || window.msCrypto).getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}
/** Canal en tiempo real genérico (Supabase Realtime Broadcast; si no hay Supabase, BroadcastChannel del navegador).
    Los mensajes pasan por el canal y no quedan guardados. onMsg(msg) · onStatus('ok'|'connecting'|'error'). */
function openBus(name, onMsg, onStatus){
  const status = s => { try{ onStatus && onStatus(s); }catch(e){} };
  const client = rsClient();
  if(client){
    const ch = client.channel(name, { config:{ broadcast:{ self:false, ack:false } } });
    let ready = false; const queue = [];
    ch.on('broadcast', { event:'msg' }, ({ payload }) => { if(payload && payload.t) onMsg(payload); });
    status('connecting');
    ch.subscribe(s => {
      if(s === 'SUBSCRIBED'){ ready = true; status('ok'); queue.splice(0).forEach(m => ch.send({ type:'broadcast', event:'msg', payload:m })); }
      else if(s === 'CHANNEL_ERROR' || s === 'TIMED_OUT'){ ready = false; status('error'); }
      else if(s === 'CLOSED'){ ready = false; }
    });
    return {
      mode:'supabase',
      send(m){ if(ready) ch.send({ type:'broadcast', event:'msg', payload:m }); else if(queue.length < 50) queue.push(m); },
      close(){ try{ client.removeChannel(ch); }catch(e){} }
    };
  }
  let bc = null;
  try{ bc = new BroadcastChannel(name); bc.onmessage = e => { if(e.data && e.data.t) onMsg(e.data); }; status('ok'); }
  catch(e){ status('error'); }
  return { mode:'local', send(m){ try{ bc && bc.postMessage(m); }catch(e){} }, close(){ try{ bc && bc.close(); }catch(e){} } };
}
function jornadaParam(){ return (new URLSearchParams(location.search).get('j') || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8); }
function verifyUrl(code){ return new URL('verificar.html?c=' + encodeURIComponent(code), location.href).href; }

const Central = {
  OUTBOX: 'rs-central-pendientes',
  enabled(){ return !!rsClient(); },
  async rpc(fn, args){
    const c = rsClient(); if(!c) throw new Error('Registro central no configurado');
    const { data, error } = await c.rpc(fn, args || {});
    if(error){ const e = new Error(error.message || 'Error del servidor'); e.code = error.code; throw e; }
    return data;
  },
  isNetworkError(e){ return !navigator.onLine || /fetch|network|Failed|Load failed|timeout/i.test(String(e && e.message)); },

  /* ---- Cola de envíos pendientes (sin conexión) ---- */
  pending(){ try{ return JSON.parse(localStorage.getItem(this.OUTBOX) || '{}'); }catch(e){ return {}; } },
  savePending(p){ try{ localStorage.setItem(this.OUTBOX, JSON.stringify(p)); }catch(e){} },
  queue(payload){ const p = this.pending(); p[payload.id] = payload; this.savePending(p); },
  unqueue(id){ const p = this.pending(); delete p[id]; this.savePending(p); },

  /** Envía (o encola) el registro. Devuelve { ok, queued, verificacion, jornada, error }. */
  async registrar(payload){
    if(!this.enabled()) return { ok:false, local:true };
    this.queue(payload);
    try{
      const r = await this.rpc('rs_registrar_evaluacion', { p: payload });
      this.unqueue(payload.id);
      return { ok:true, verificacion: r && r.verificacion, jornada: r && r.jornada };
    }catch(e){
      if(this.isNetworkError(e)) return { ok:false, queued:true };
      this.unqueue(payload.id);
      return { ok:false, error: e.message };
    }
  },
  async flush(){
    if(!this.enabled() || !navigator.onLine) return 0;
    let sent = 0;
    for(const payload of Object.values(this.pending())){
      try{ await this.rpc('rs_registrar_evaluacion', { p: payload }); this.unqueue(payload.id); sent++; }
      catch(e){ if(this.isNetworkError(e)) break; this.unqueue(payload.id); }
    }
    return sent;
  },

  jornadaPublica(codigo){ return this.rpc('rs_jornada_publica', { p_codigo: codigo }); },
  verificar(codigo){ return this.rpc('rs_verificar', { p_codigo: codigo }); },

  /* ---- Administración ---- */
  async session(){ const c = rsClient(); if(!c) return null; const { data } = await c.auth.getSession(); return data && data.session; },
  async signIn(email, password){
    const { data, error } = await rsClient().auth.signInWithPassword({ email, password });
    if(error) throw new Error(/invalid/i.test(error.message) ? 'Email o contraseña incorrectos.' : error.message);
    return data.session;
  },
  async signOut(){ try{ await rsClient().auth.signOut(); }catch(e){} },
  /** Envía el mail de blanqueo. El enlace vuelve a admin.html (debe estar en Redirect URLs de Supabase). */
  async resetPassword(email){
    const { error } = await rsClient().auth.resetPasswordForEmail(email, { redirectTo: new URL('admin.html', location.href).href });
    if(error) throw new Error(/rate|seconds/i.test(error.message) ? 'Se enviaron demasiados mails seguidos. Esperá unos minutos y volvé a intentar.' : error.message);
  },
  async updatePassword(password){
    const { error } = await rsClient().auth.updateUser({ password });
    if(error) throw new Error(/different|same/i.test(error.message) ? 'La nueva contraseña tiene que ser distinta de la anterior.' : /weak|short|characters|pwned/i.test(error.message) ? 'La contraseña es débil o figura en filtraciones conocidas. Elegí otra más larga.' : error.message);
  },
  recoveryInfo(){
    const h = new URLSearchParams(RS_URL_HASH.replace(/^#/, ''));
    return { recovery: h.get('type') === 'recovery', error: h.get('error_description') || h.get('error') || '' };
  },
  esAdmin(){ return this.rpc('rs_es_admin'); }
};

// Reintento automático de envíos pendientes
window.addEventListener('online', () => Central.flush());
if(Central.enabled()) setTimeout(() => Central.flush(), 1500);
