-- =====================================================================
-- RS Consultora · Capacitación · Migración 06: DNI
-- Se ejecuta UNA vez en Supabase → SQL Editor → New query → pegar → Run.
-- Requiere las migraciones 02, 04 y 05. No borra datos.
--   · El participante se identifica con su DNI (obligatorio); el legajo pasa a ser opcional.
--   · La verificación pública muestra el DNI parcialmente oculto (**.***.123).
--   · La nómina de cada empresa puede cargarse con DNI, con legajo o con los dos.
--   · Los registros anteriores (solo con legajo) siguen funcionando igual.
-- =====================================================================

alter table rs_capacitacion.registros add column if not exists dni text;
alter table rs_capacitacion.registros alter column legajo drop not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'rs_capacitacion.registros'::regclass and conname = 'registros_dni_formato') then
    alter table rs_capacitacion.registros add constraint registros_dni_formato check (dni is null or dni ~ '^\d{7,8}$');
  end if;
end $$;
create index if not exists registros_dni_idx on rs_capacitacion.registros(dni);
-- Evaluaciones enviadas con el sitio nuevo antes de esta migración: el DNI llegó como legajo "DNI<número>".
update rs_capacitacion.registros set dni = substr(legajo, 4), legajo = null
 where dni is null and legajo ~ '^DNI\d{7,8}$';

-- Nómina: DNI y/o legajo. La clave pasa a ser "D<dni>" o "L<legajo>".
alter table rs_capacitacion.nomina add column if not exists dni text;
alter table rs_capacitacion.nomina add column if not exists clave text generated always as (coalesce('D' || dni, 'L' || legajo)) stored;
do $$ begin
  if exists (select 1 from pg_constraint where conrelid = 'rs_capacitacion.nomina'::regclass and conname = 'nomina_pkey'
             and pg_get_constraintdef(oid) not like '%clave%') then
    alter table rs_capacitacion.nomina drop constraint nomina_pkey;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'rs_capacitacion.nomina'::regclass and conname = 'nomina_pkey') then
    alter table rs_capacitacion.nomina add constraint nomina_pkey primary key (empresa_key, clave);
  end if;
  alter table rs_capacitacion.nomina alter column legajo drop not null;
  if not exists (select 1 from pg_constraint where conrelid = 'rs_capacitacion.nomina'::regclass and conname = 'nomina_identificada') then
    alter table rs_capacitacion.nomina add constraint nomina_identificada check (dni is not null or legajo is not null);
  end if;
end $$;

create or replace function public.rs_admin_nomina_cargar(p_empresa text, p_filas jsonb, p_reemplazar boolean) returns json
language plpgsql security definer set search_path = '' as $$
declare v_key text := rs_capacitacion.empresa_key(p_empresa); v_emp text := rs_capacitacion.txt(p_empresa, 80); f jsonb; n int := 0; v_leg text; v_dni text;
begin
  perform rs_capacitacion.exigir_admin();
  if v_emp is null then raise exception 'La empresa es obligatoria'; end if;
  if p_filas is null or jsonb_typeof(p_filas) <> 'array' or jsonb_array_length(p_filas) > 5000 then raise exception 'Nómina inválida'; end if;
  if p_reemplazar then delete from rs_capacitacion.nomina where empresa_key = v_key; end if;
  for f in select * from jsonb_array_elements(p_filas) loop
    v_leg := nullif(upper(btrim(coalesce(f ->> 'legajo', ''))), '');
    v_dni := nullif(regexp_replace(coalesce(f ->> 'dni', ''), '\D', '', 'g'), '');
    if v_leg is not null and v_leg !~ '^[A-Z0-9-]{1,12}$' then v_leg := null; end if;
    if v_dni is not null and v_dni !~ '^\d{7,8}$' then v_dni := null; end if;
    continue when v_leg is null and v_dni is null;
    insert into rs_capacitacion.nomina (empresa_key, empresa, legajo, dni, apellido, nombre, sector)
    values (v_key, v_emp, v_leg, v_dni, rs_capacitacion.txt(f ->> 'apellido', 60), rs_capacitacion.txt(f ->> 'nombre', 60), rs_capacitacion.txt(f ->> 'sector', 80))
    on conflict (empresa_key, clave) do update set empresa = excluded.empresa, legajo = coalesce(excluded.legajo, rs_capacitacion.nomina.legajo),
      apellido = excluded.apellido, nombre = excluded.nombre, sector = excluded.sector;
    n := n + 1;
  end loop;
  return json_build_object('ok', true, 'filas', n, 'total', (select count(*) from rs_capacitacion.nomina where empresa_key = v_key));
end $$;

-- Verificación pública: DNI parcialmente oculto (o el legajo, en registros anteriores)
create or replace function public.rs_verificar(p_codigo text) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'nombre', r.nombre, 'apellido', r.apellido,
    'dni', case when r.dni is null then null else '**.***.' || right(r.dni, 3) end,
    'legajo', case when r.dni is not null or r.legajo is null then null
                   when length(r.legajo) <= 3 then r.legajo
                   else left(r.legajo, 1) || repeat('•', length(r.legajo) - 3) || right(r.legajo, 2) end,
    'empresa', coalesce(j.empresa, r.empresa), 'capacitacion', r.capacitacion, 'capacitador', r.capacitador,
    'fecha', coalesce(r.fecha_fin, r.updated_at), 'porcentaje', r.porcentaje, 'estado', r.estado,
    'firmado', r.firma is not null, 'verificacion', r.verificacion)
  from rs_capacitacion.registros r
  left join rs_capacitacion.jornadas j on j.id = r.jornada_id
  where r.verificacion = upper(btrim(coalesce(p_codigo, '')))
$$;

create or replace function public.rs_admin_registros(p_jornada uuid default null) returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform rs_capacitacion.exigir_admin();
  return coalesce((
    select json_agg(x order by x.created_at desc) from (
      select r.id, r.jornada_id, j.codigo as jornada_codigo, r.legajo, r.dni, r.nombre, r.apellido, r.empresa, r.sector,
             r.tipo_vehiculo, r.capacitacion, r.capacitador, r.fecha_inicio, r.fecha_fin, r.duracion_min,
             r.preguntas, r.correctas, r.incorrectas, r.porcentaje, r.intentos, r.estado, r.criterio,
             r.firma is not null as firmado, r.verificacion, r.created_at, r.updated_at
      from rs_capacitacion.registros r left join rs_capacitacion.jornadas j on j.id = r.jornada_id
      where p_jornada is null or r.jornada_id = p_jornada) x), '[]'::json);
end $$;

create or replace function public.rs_admin_registro(p_id text) returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform rs_capacitacion.exigir_admin();
  return (select row_to_json(x) from (
    select r.id, r.jornada_id, r.legajo, r.dni, r.nombre, r.apellido, r.empresa, r.sector, r.tipo_vehiculo, r.capacitacion,
           r.capacitador, r.fecha_inicio, r.fecha_fin, r.duracion_min, r.preguntas, r.correctas, r.incorrectas,
           r.porcentaje, r.intentos, r.estado, r.criterio, r.respuestas, r.firma, r.firmado_at, r.verificacion,
           r.satisfaccion, r.comentario, r.created_at
    from rs_capacitacion.registros r where r.id = p_id) x);
end $$;

-- Informe de la jornada, tablero y registro de la evaluación: ahora con DNI
create or replace function rs_capacitacion.informe_datos(p_id uuid) returns json
language sql stable set search_path = '' as $$
  select json_build_object(
    'jornada', (select row_to_json(x) from (select j.id, j.codigo, j.capacitacion, j.empresa, j.lugar, j.fecha, j.capacitador, j.estado, j.contacto_email
                 from rs_capacitacion.jornadas j where j.id = p_id) x),
    'registros', coalesce((select json_agg(x order by x.apellido, x.nombre) from (
        select r.id, r.legajo, r.dni, r.nombre, r.apellido, r.empresa, r.sector, r.tipo_vehiculo, r.fecha_inicio,
               r.fecha_fin, r.duracion_min, r.preguntas, r.correctas, r.incorrectas, r.porcentaje, r.intentos,
               r.estado, r.criterio, r.respuestas, r.firma, r.firmado_at, r.verificacion, r.satisfaccion, r.comentario
        from rs_capacitacion.registros r where r.jornada_id = p_id) x), '[]'::json),
    'desafios', coalesce((select json_agg(d order by d.created_at) from rs_capacitacion.desafios d where d.jornada_id = p_id), '[]'::json),
    'diagnosticos', coalesce((select json_agg(g.respuestas) from rs_capacitacion.diagnosticos g where g.jornada_id = p_id and g.tipo = 'inicial'), '[]'::json),
    'refuerzos', coalesce((select json_agg(g.respuestas) from rs_capacitacion.diagnosticos g where g.jornada_id = p_id and g.tipo = 'refuerzo'), '[]'::json))
$$;

create or replace function public.rs_admin_tablero() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform rs_capacitacion.exigir_admin();
  return json_build_object(
    'registros', coalesce((select json_agg(x) from (
        select r.id, r.jornada_id, j.codigo as jornada_codigo, coalesce(j.empresa, r.empresa) as empresa, r.legajo, r.dni, r.nombre, r.apellido,
               r.sector, r.tipo_vehiculo, r.estado, r.porcentaje, r.intentos, r.respuestas, r.satisfaccion, r.comentario,
               r.firma is not null as firmado, r.verificacion, r.capacitador,
               coalesce(j.fecha, (coalesce(r.fecha_fin, r.created_at) at time zone 'America/Argentina/Buenos_Aires')::date) as fecha
        from rs_capacitacion.registros r left join rs_capacitacion.jornadas j on j.id = r.jornada_id) x), '[]'::json),
    'desafios', coalesce((select json_agg(json_build_object('jornada_id', d.jornada_id, 'datos', d.datos, 'created_at', d.created_at)) from rs_capacitacion.desafios d), '[]'::json),
    'diagnosticos', coalesce((select json_agg(json_build_object('jornada_id', g.jornada_id, 'respuestas', g.respuestas)) from rs_capacitacion.diagnosticos g where g.tipo = 'inicial'), '[]'::json),
    'refuerzos', coalesce((select json_agg(json_build_object('jornada_id', g.jornada_id, 'respuestas', g.respuestas, 'created_at', g.created_at)) from rs_capacitacion.diagnosticos g where g.tipo = 'refuerzo'), '[]'::json),
    'nomina', coalesce((select json_agg(json_build_object('empresa', n.empresa, 'key', n.empresa_key, 'legajo', n.legajo, 'dni', n.dni, 'apellido', n.apellido, 'nombre', n.nombre, 'sector', n.sector) order by n.empresa_key, n.apellido) from rs_capacitacion.nomina n), '[]'::json));
end $$;

create or replace function public.rs_registrar_evaluacion(p jsonb) returns json
language plpgsql security definer set search_path = '' as $function$
declare
  v_id text := p ->> 'id';
  v_token text := p ->> 'token';
  v_hash text;
  v_jornada uuid;
  v_ex rs_capacitacion.registros;
  v_ver text;
  v_legajo text := nullif(upper(btrim(coalesce(p ->> 'legajo', ''))), '');
  v_dni text := nullif(regexp_replace(coalesce(p ->> 'dni', ''), '\D', '', 'g'), '');
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
  if v_legajo ~ '^DNI\d{7,8}$' then v_dni := coalesce(v_dni, substr(v_legajo, 4)); v_legajo := null; end if;   -- compatibilidad
  if v_legajo is not null and v_legajo !~ '^[A-Z0-9-]{3,12}$' then raise exception 'Legajo inválido'; end if;
  if v_dni is not null and v_dni !~ '^\d{7,8}$' then raise exception 'DNI inválido'; end if;
  if v_dni is null and v_legajo is null then raise exception 'El DNI es obligatorio'; end if;
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
      legajo = coalesce(v_legajo, case when v_dni is not null then null else r.legajo end), dni = coalesce(v_dni, r.dni), nombre = v_nombre, apellido = v_apellido,
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
    insert into rs_capacitacion.registros (id, token_hash, jornada_id, legajo, dni, nombre, apellido, empresa, sector,
      tipo_vehiculo, capacitacion, capacitador, fecha_inicio, fecha_fin, duracion_min, preguntas, correctas,
      incorrectas, porcentaje, intentos, estado, criterio, respuestas, firma, firmado_at, verificacion, satisfaccion, comentario, consentimiento_at)
    values (v_id, v_hash, v_jornada, v_legajo, v_dni, v_nombre, v_apellido,
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

revoke all on function rs_capacitacion.informe_datos(uuid) from public, anon, authenticated;
revoke all on function public.rs_admin_nomina_cargar(text, jsonb, boolean), public.rs_admin_registros(uuid), public.rs_admin_registro(text), public.rs_admin_tablero() from public, anon, authenticated;
grant execute on function public.rs_admin_nomina_cargar(text, jsonb, boolean), public.rs_admin_registros(uuid), public.rs_admin_registro(text), public.rs_admin_tablero() to authenticated;
revoke all on function public.rs_verificar(text), public.rs_registrar_evaluacion(jsonb) from public;
grant execute on function public.rs_verificar(text), public.rs_registrar_evaluacion(jsonb) to anon, authenticated;
