'use strict';
/* datos.js — CARGA DE DATOS PARA REPORTES (Administración)
   Usa rs_admin_tablero si la base ya tiene la actualización 02_reportes.sql.
   Si todavía no, arma los mismos datos con las funciones existentes (modo compatible):
   todo funciona salvo satisfacción, diagnóstico, nómina y enlace para compartir.
   RS Consultora · Fatiga y Conducción Segura */

const Datos = {
  v2: null,   // true = base actualizada · false = modo compatible · null = sin verificar
  faltaFuncion(e){ return !!e && (e.code === 'PGRST202' || e.code === '42883' || /Could not find the function|schema cache|does not exist/i.test(e.message || '')); },
  avisoV2(){ return 'Disponible cuando se aplique la actualización de la base de datos (archivo supabase/02_reportes.sql, ver README).'; },

  /** Registros + desafíos + diagnósticos + nómina de todas las jornadas. */
  KEY:'rs-db-v1-hasta',
  recordarV1(){ try{ localStorage.setItem(this.KEY, String(Date.now() + 10 * 60000)); }catch(e){} },
  esV1Reciente(){ try{ return +localStorage.getItem(this.KEY) > Date.now(); }catch(e){ return false; } },
  async tablero(jornadas){
    if(!this.esV1Reciente()){
      try{
        const t = await Central.rpc('rs_admin_tablero');
        this.v2 = true; try{ localStorage.removeItem(this.KEY); }catch(_){}
        return { registros:t.registros || [], desafios:t.desafios || [], diagnosticos:t.diagnosticos || [], nomina:t.nomina || [] };
      }catch(e){ if(!this.faltaFuncion(e)) throw e; this.recordarV1(); }
    }
    this.v2 = false;
    jornadas = jornadas || await Central.rpc('rs_admin_jornadas') || [];
    const [infos, todos] = await Promise.all([
      Promise.all(jornadas.map(j => Central.rpc('rs_admin_informe', { p_id:j.id }))),
      Central.rpc('rs_admin_registros', { p_jornada:null })
    ]);
    const registros = [], desafios = [], diagnosticos = [];
    infos.forEach((d, i) => {
      const j = jornadas[i]; if(!d) return;
      (d.registros || []).forEach(r => { const x = { ...r, jornada_id:j.id, jornada_codigo:j.codigo, empresa:j.empresa || r.empresa, fecha:j.fecha, firmado:!!r.firma }; delete x.firma; registros.push(x); });
      (d.desafios || []).forEach(x => desafios.push({ jornada_id:j.id, datos:x.datos, created_at:x.created_at }));
      (d.diagnosticos || []).forEach(x => diagnosticos.push({ jornada_id:j.id, respuestas:x }));
    });
    (todos || []).filter(r => !r.jornada_id).forEach(r => registros.push({ ...r, fecha:String(r.fecha_fin || r.created_at || '').slice(0, 10) }));
    return { registros, desafios, diagnosticos, nomina:[] };
  }
};
