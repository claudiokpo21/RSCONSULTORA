-- =====================================================================
-- RS Consultora · Capacitación · Migración 05: REFUERZO A 30 DÍAS Y CONSENTIMIENTO
-- Se ejecuta UNA vez en Supabase → SQL Editor → New query → pegar → Run.
-- Requiere la migración 02. No borra datos.
--   · Refuerzo (rs_registrar_refuerzo): preguntas cortas, anónimas, días después de la jornada
--     (mide cuánto se retuvo). Se acepta hasta 180 días después de la fecha de la jornada,
--     aunque la jornada esté cerrada.
--   · Fecha y hora en que el participante aceptó el aviso de privacidad (Ley 25.326).
-- =====================================================================

alter table rs_capacitacion.diagnosticos
  add column if not exists tipo text not null default 'inicial' check (tipo in ('inicial', 'refuerzo'));
alter table rs_capacitacion.registros
  add column if not exists consentimiento_at timestamptz;

-- Diagnóstico anónimo: 'inicial' (jornada abierta) o 'refuerzo' (hasta 180 días después de la jornada).
-- Uso interno: lo llaman rs_registrar_diagnostico y rs_registrar_refuerzo.
create or replace function rs_capacitacion.registrar_diagnostico(p jsonb, v_tipo text) returns json
language plpgsql security definer set search_path = '' as $$
declare v_j uuid; v_estado text; v_fecha date; v_id uuid; v_r jsonb := p -> 'respuestas'; k text; val jsonb;
  v_hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
  begin v_id := (p ->> 'id')::uuid; exception when others then raise exception 'Registro inválido'; end;
  if v_id is null then raise exception 'Registro inválido'; end if;
  if v_tipo not in ('inicial', 'refuerzo') then raise exception 'Tipo inválido'; end if;
  select j.id, j.estado, j.fecha into v_j, v_estado, v_fecha from rs_capacitacion.jornadas j where j.codigo = upper(btrim(coalesce(p ->> 'jornada', '')));
  if v_j is null then raise exception 'La jornada no existe'; end if;
  if v_tipo = 'inicial' and v_estado <> 'abierta' then raise exception 'La jornada no existe o está cerrada'; end if;
  if v_tipo = 'refuerzo' and (v_hoy < v_fecha or v_hoy > v_fecha + 180) then raise exception 'El refuerzo de esta jornada no está disponible'; end if;
  if v_r is null or jsonb_typeof(v_r) <> 'object' or (select count(*) from jsonb_object_keys(v_r)) not between 1 and 20 then raise exception 'Respuestas inválidas'; end if;
  for k, val in select * from jsonb_each(v_r) loop
    if k !~ '^\d{1,2}$' or jsonb_typeof(val) <> 'number' or (val #>> '{}') !~ '^\d$' then raise exception 'Respuestas inválidas'; end if;
  end loop;
  if (select count(*) from rs_capacitacion.diagnosticos g where g.jornada_id = v_j and g.tipo = v_tipo) >= 500 then raise exception 'Límite de respuestas alcanzado'; end if;
  insert into rs_capacitacion.diagnosticos (id, jornada_id, respuestas, tipo) values (v_id, v_j, v_r, v_tipo) on conflict (id) do nothing;
  return json_build_object('ok', true);
end $$;
revoke all on function rs_capacitacion.registrar_diagnostico(jsonb, text) from public, anon, authenticated;

create or replace function public.rs_registrar_diagnostico(p jsonb) returns json
language sql security definer set search_path = '' as $$ select rs_capacitacion.registrar_diagnostico(p, 'inicial') $$;
create or replace function public.rs_registrar_refuerzo(p jsonb) returns json
language sql security definer set search_path = '' as $$ select rs_capacitacion.registrar_diagnostico(p, 'refuerzo') $$;

-- Datos de la jornada para el informe: ahora separa diagnósticos iniciales y refuerzos
create or replace function rs_capacitacion.informe_datos(p_id uuid) returns json
language sql stable set search_path = '' as $$
  select json_build_object(
    'jornada', (select row_to_json(x) from (select j.id, j.codigo, j.capacitacion, j.empresa, j.lugar, j.fecha, j.capacitador, j.estado, j.contacto_email
                 from rs_capacitacion.jornadas j where j.id = p_id) x),
    'registros', coalesce((select json_agg(x order by x.apellido, x.nombre) from (
        select r.id, r.legajo, r.nombre, r.apellido, r.empresa, r.sector, r.tipo_vehiculo, r.fecha_inicio,
               r.fecha_fin, r.duracion_min, r.preguntas, r.correctas, r.incorrectas, r.porcentaje, r.intentos,
               r.estado, r.criterio, r.respuestas, r.firma, r.firmado_at, r.verificacion, r.satisfaccion, r.comentario
        from rs_capacitacion.registros r where r.jornada_id = p_id) x), '[]'::json),
    'desafios', coalesce((select json_agg(d order by d.created_at) from rs_capacitacion.desafios d where d.jornada_id = p_id), '[]'::json),
    'diagnosticos', coalesce((select json_agg(g.respuestas) from rs_capacitacion.diagnosticos g where g.jornada_id = p_id and g.tipo = 'inicial'), '[]'::json),
    'refuerzos', coalesce((select json_agg(g.respuestas) from rs_capacitacion.diagnosticos g where g.jornada_id = p_id and g.tipo = 'refuerzo'), '[]'::json))
$$;
revoke all on function rs_capacitacion.informe_datos(uuid) from public, anon, authenticated;

create or replace function public.rs_admin_tablero() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform rs_capacitacion.exigir_admin();
  return json_build_object(
    'registros', coalesce((select json_agg(x) from (
        select r.id, r.jornada_id, j.codigo as jornada_codigo, coalesce(j.empresa, r.empresa) as empresa, r.legajo, r.nombre, r.apellido,
               r.sector, r.tipo_vehiculo, r.estado, r.porcentaje, r.intentos, r.respuestas, r.satisfaccion, r.comentario,
               r.firma is not null as firmado, r.verificacion, r.capacitador,
               coalesce(j.fecha, (coalesce(r.fecha_fin, r.created_at) at time zone 'America/Argentina/Buenos_Aires')::date) as fecha
        from rs_capacitacion.registros r left join rs_capacitacion.jornadas j on j.id = r.jornada_id) x), '[]'::json),
    'desafios', coalesce((select json_agg(json_build_object('jornada_id', d.jornada_id, 'datos', d.datos, 'created_at', d.created_at)) from rs_capacitacion.desafios d), '[]'::json),
    'diagnosticos', coalesce((select json_agg(json_build_object('jornada_id', g.jornada_id, 'respuestas', g.respuestas)) from rs_capacitacion.diagnosticos g where g.tipo = 'inicial'), '[]'::json),
    'refuerzos', coalesce((select json_agg(json_build_object('jornada_id', g.jornada_id, 'respuestas', g.respuestas, 'created_at', g.created_at)) from rs_capacitacion.diagnosticos g where g.tipo = 'refuerzo'), '[]'::json),
    'nomina', coalesce((select json_agg(json_build_object('empresa', n.empresa, 'key', n.empresa_key, 'legajo', n.legajo, 'apellido', n.apellido, 'nombre', n.nombre, 'sector', n.sector) order by n.empresa_key, n.apellido) from rs_capacitacion.nomina n), '[]'::json));
end $$;

create or replace function public.rs_admin_jornadas() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform rs_capacitacion.exigir_admin();
  return coalesce((
    select json_agg(x order by x.fecha desc, x.created_at desc) from (
      select j.*,
        (select count(*) from rs_capacitacion.registros r where r.jornada_id = j.id) as participantes,
        (select count(*) from rs_capacitacion.registros r where r.jornada_id = j.id and r.estado = 'APROBADO') as aprobados,
        (select count(*) from rs_capacitacion.registros r where r.jornada_id = j.id and r.firma is not null) as firmas,
        (select count(*) from rs_capacitacion.desafios d where d.jornada_id = j.id) as desafios,
        (select count(*) from rs_capacitacion.diagnosticos g where g.jornada_id = j.id and g.tipo = 'inicial') as diagnosticos,
        (select count(*) from rs_capacitacion.diagnosticos g where g.jornada_id = j.id and g.tipo = 'refuerzo') as refuerzos
      from rs_capacitacion.jornadas j) x), '[]'::json);
end $$;

revoke all on function public.rs_registrar_diagnostico(jsonb), public.rs_registrar_refuerzo(jsonb), public.rs_admin_tablero(), public.rs_admin_jornadas() from public, anon, authenticated;
grant execute on function public.rs_registrar_diagnostico(jsonb), public.rs_registrar_refuerzo(jsonb) to anon, authenticated;
grant execute on function public.rs_admin_tablero(), public.rs_admin_jornadas() to authenticated;

-- Registro de la evaluación: ahora también guarda cuándo se aceptó el aviso de privacidad
create or replace function public.rs_registrar_evaluacion(p jsonb) returns json
language plpgsql security definer set search_path = '' as $function$
declare
  v_id text := p ->> 'id';
  v_token text := p ->> 'token';
  v_hash text;
  v_jornada uuid;
  v_ex rs_capacitacion.registros;
  v_ver text;
  v_legajo text := upper(btrim(coalesce(p ->> 'legajo', '')));
  v_nombre text := rs_capacitacion.txt(p ->> 'nombre', 60);
  v_apellido text := rs_capacitacion.txt(p ->> 'apellido', 60);
  v_preg integer := rs_capacitacion.ent(p ->> 'preguntas', 0, 50);
  v_corr integer := rs_capacitacion.ent(p ->> 'correctas', 0, 50);
  v_int integer := rs_capacitacion.ent(p ->> 'intentos', 0, 50);
  v_crit integer := rs_capacitacion.ent(p ->> 'criterio', 1, 100);
  v_sat integer := rs_capacitacion.ent(p ->> 'satisfaccion', 1, 5);
  v_com text := rs_capacitacion.txt(p ->> 'comentario', 300);
  v_pct integer;
  v_estado text;
  v_firma text := p ->> 'firma';
  v_resp jsonb := p -> 'respuestas';
  v_cons timestamptz := rs_capacitacion.ts(p ->> 'consentimiento');
begin
  if v_id is null or v_id !~ '^REG-[A-Z0-9-]{4,40}$' then raise exception 'Registro inválido'; end if;
  if v_token is null or length(v_token) < 24 or length(v_token) > 128 then raise exception 'Token inválido'; end if;
  if v_legajo !~ '^[A-Z0-9-]{3,12}$' then raise exception 'Legajo inválido'; end if;
  if v_nombre is null or v_apellido is null then raise exception 'Nombre y apellido obligatorios'; end if;
  if v_firma is not null and (left(v_firma, 22) <> 'data:image/png;base64,' or length(v_firma) > 200000) then v_firma := null; end if;
  if v_resp is not null and (jsonb_typeof(v_resp) <> 'array' or jsonb_array_length(v_resp) > 50) then v_resp := null; end if;

  -- Estado y porcentaje se recalculan en el servidor para que sean consistentes
  if coalesce(v_int, 0) = 0 or v_preg is null or v_preg = 0 or v_corr is null or v_corr > v_preg then
    v_estado := 'SIN COMPLETAR'; v_pct := null; v_corr := null; v_preg := coalesce(v_preg, null);
  else
    v_pct := round(v_corr * 100.0 / v_preg);
    v_estado := case when v_pct >= coalesce(v_crit, 80) then 'APROBADO' else 'NO APROBADO' end;
  end if;

  v_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  if coalesce(p ->> 'jornada', '') <> '' then
    select j.id into v_jornada from rs_capacitacion.jornadas j
     where j.codigo = upper(btrim(p ->> 'jornada')) and j.estado = 'abierta';
  end if;

  select * into v_ex from rs_capacitacion.registros r where r.id = v_id for update;
  if found then
    if v_ex.token_hash <> v_hash then raise exception 'No autorizado' using errcode = '42501'; end if;
    update rs_capacitacion.registros r set
      jornada_id   = coalesce(r.jornada_id, v_jornada),
      legajo = v_legajo, nombre = v_nombre, apellido = v_apellido,
      empresa = rs_capacitacion.txt(p ->> 'empresa', 80),
      sector = rs_capacitacion.txt(p ->> 'sector', 80),
      tipo_vehiculo = rs_capacitacion.txt(p ->> 'tipo_vehiculo', 20),
      capacitacion = rs_capacitacion.txt(p ->> 'capacitacion', 140),
      capacitador = rs_capacitacion.txt(p ->> 'capacitador', 80),
      fecha_inicio = coalesce(r.fecha_inicio, rs_capacitacion.ts(p ->> 'fecha_inicio')),
      fecha_fin = coalesce(rs_capacitacion.ts(p ->> 'fecha_fin'), r.fecha_fin),
      duracion_min = coalesce(rs_capacitacion.ent(p ->> 'duracion_min', 0, 1440), r.duracion_min),
      preguntas = coalesce(v_preg, r.preguntas),
      correctas = case when v_estado = 'SIN COMPLETAR' then r.correctas else v_corr end,
      incorrectas = case when v_estado = 'SIN COMPLETAR' then r.incorrectas else v_preg - v_corr end,
      porcentaje = case when v_estado = 'SIN COMPLETAR' then r.porcentaje else v_pct end,
      intentos = greatest(coalesce(v_int, 0), coalesce(r.intentos, 0)),
      estado = case when v_estado = 'SIN COMPLETAR' then r.estado else v_estado end,
      criterio = coalesce(v_crit, r.criterio),
      respuestas = coalesce(v_resp, r.respuestas),
      firma = coalesce(r.firma, v_firma),
      firmado_at = case when r.firma is null and v_firma is not null then now() else r.firmado_at end,
      satisfaccion = coalesce(v_sat, r.satisfaccion),
      comentario = coalesce(v_com, r.comentario),
      consentimiento_at = coalesce(r.consentimiento_at, v_cons),
      updated_at = now()
    where r.id = v_id;
    v_ver := v_ex.verificacion;
  else
    loop
      v_ver := rs_capacitacion.codigo_aleatorio(8);
      exit when not exists (select 1 from rs_capacitacion.registros r where r.verificacion = v_ver);
    end loop;
    insert into rs_capacitacion.registros (id, token_hash, jornada_id, legajo, nombre, apellido, empresa, sector,
      tipo_vehiculo, capacitacion, capacitador, fecha_inicio, fecha_fin, duracion_min, preguntas, correctas,
      incorrectas, porcentaje, intentos, estado, criterio, respuestas, firma, firmado_at, verificacion, satisfaccion, comentario, consentimiento_at)
    values (v_id, v_hash, v_jornada, v_legajo, v_nombre, v_apellido,
      rs_capacitacion.txt(p ->> 'empresa', 80), rs_capacitacion.txt(p ->> 'sector', 80),
      rs_capacitacion.txt(p ->> 'tipo_vehiculo', 20), rs_capacitacion.txt(p ->> 'capacitacion', 140),
      rs_capacitacion.txt(p ->> 'capacitador', 80), rs_capacitacion.ts(p ->> 'fecha_inicio'),
      rs_capacitacion.ts(p ->> 'fecha_fin'), rs_capacitacion.ent(p ->> 'duracion_min', 0, 1440),
      v_preg, v_corr, case when v_corr is null then null else v_preg - v_corr end, v_pct, coalesce(v_int, 0),
      v_estado, v_crit, v_resp, v_firma, case when v_firma is not null then now() end, v_ver, v_sat, v_com, v_cons);
  end if;

  return json_build_object('ok', true, 'verificacion', v_ver,
    'jornada', (select j.codigo from rs_capacitacion.jornadas j
                 join rs_capacitacion.registros r on r.jornada_id = j.id where r.id = v_id));
end $function$;

revoke all on function public.rs_registrar_evaluacion(jsonb) from public;
grant execute on function public.rs_registrar_evaluacion(jsonb) to anon, authenticated;
