-- =====================================================================
-- RS Consultora · Capacitación · Migración 04: REGISTRO INDIVIDUAL
-- Se ejecuta UNA vez en Supabase → SQL Editor → New query → pegar → Run.
-- Devuelve un registro completo (con la imagen de la firma) para el certificado
-- y el informe individual, aunque la evaluación se haya hecho sin código de jornada.
-- Solo administradores. No modifica datos.
-- =====================================================================
create or replace function public.rs_admin_registro(p_id text) returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform rs_capacitacion.exigir_admin();
  return (select row_to_json(x) from (
    select r.id, r.jornada_id, r.legajo, r.nombre, r.apellido, r.empresa, r.sector, r.tipo_vehiculo, r.capacitacion,
           r.capacitador, r.fecha_inicio, r.fecha_fin, r.duracion_min, r.preguntas, r.correctas, r.incorrectas,
           r.porcentaje, r.intentos, r.estado, r.criterio, r.respuestas, r.firma, r.firmado_at, r.verificacion,
           r.satisfaccion, r.comentario, r.created_at
    from rs_capacitacion.registros r where r.id = p_id) x);
end $$;
revoke all on function public.rs_admin_registro(text) from public, anon, authenticated;
grant execute on function public.rs_admin_registro(text) to authenticated;
