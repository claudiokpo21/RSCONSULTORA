-- =====================================================================
-- RS Consultora · Capacitación · Migración 02: REPORTES
-- Se ejecuta UNA vez en Supabase → SQL Editor → New query → pegar → Run.
-- Solo agrega cosas dentro del schema privado rs_capacitacion y funciones
-- public.rs_*. No toca las tablas del inventario ni borra datos.
--   · Satisfacción (1 a 5) y comentario en cada evaluación
--   · Diagnóstico inicial anónimo (antes / después)
--   · Nómina por empresa (cobertura y pendientes)
--   · Email de contacto y enlace secreto para compartir el informe con el cliente
--   · Datos para el tablero general y los informes por empresa
-- =====================================================================

alter table rs_capacitacion.registros
  add column if not exists satisfaccion smallint check (satisfaccion between 1 and 5),
  add column if not exists comentario text;
alter table rs_capacitacion.jornadas
  add column if not exists contacto_email text,
  add column if not exists informe_token text unique;

create table if not exists rs_capacitacion.diagnosticos (
  id uuid primary key,
  jornada_id uuid not null references rs_capacitacion.jornadas(id) on delete cascade,
  respuestas jsonb not null,
  created_at timestamptz not null default now());
create index if not exists diagnosticos_jornada_idx on rs_capacitacion.diagnosticos(jornada_id);

create table if not exists rs_capacitacion.nomina (
  empresa_key text not null,
  empresa text not null,
  legajo text not null,
  apellido text, nombre text, sector text,
  created_at timestamptz not null default now(),
  primary key (empresa_key, legajo));

alter table rs_capacitacion.diagnosticos enable row level security;
alter table rs_capacitacion.nomina enable row level security;
revoke all on rs_capacitacion.diagnosticos, rs_capacitacion.nomina from anon, authenticated, public;

create or replace function rs_capacitacion.empresa_key(v text) returns text
language sql immutable set search_path = '' as $$
  select lower(btrim(regexp_replace(coalesce(v, ''), '\s+', ' ', 'g')))
$$;

-- Datos completos de una jornada (uso interno: informe del administrador y enlace público)
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
    'diagnosticos', coalesce((select json_agg(g.respuestas) from rs_capacitacion.diagnosticos g where g.jornada_id = p_id), '[]'::json))
$$;

create or replace function public.rs_admin_informe(p_id uuid) returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  perform rs_capacitacion.exigir_admin();
  return rs_capacitacion.informe_datos(p_id);
end $$;

-- Enlace público (secreto) del informe, para compartir con la empresa cliente
create or replace function public.rs_admin_compartir_informe(p_id uuid, p_activar boolean) returns json
language plpgsql security definer set search_path = '' as $$
declare v_tok text;
begin
  perform rs_capacitacion.exigir_admin();
  v_tok := case when p_activar then encode(extensions.gen_random_bytes(24), 'hex') end;
  update rs_capacitacion.jornadas set informe_token = v_tok where id = p_id;
  if not found then raise exception 'Jornada inexistente'; end if;
  return json_build_object('token', v_tok);
end $$;

create or replace function public.rs_informe_publico(p_token text) returns json
language plpgsql stable security definer set search_path = '' as $$
declare v_id uuid;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{48}$' then return null; end if;
  select j.id into v_id from rs_capacitacion.jornadas j where j.informe_token = p_token;
  if v_id is null then return null; end if;
  return rs_capacitacion.informe_datos(v_id);
end $$;

create or replace function public.rs_admin_contacto_jornada(p_id uuid, p_email text) returns json
language plpgsql security definer set search_path = '' as $$
declare v text := lower(btrim(coalesce(p_email, '')));
begin
  perform rs_capacitacion.exigir_admin();
  if v <> '' and v !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Email inválido'; end if;
  update rs_capacitacion.jornadas set contacto_email = nullif(left(v, 120), '') where id = p_id;
  return json_build_object('ok', true);
end $$;

-- Diagnóstico inicial anónimo (antes de la capacitación). Sin datos personales.
create or replace function public.rs_registrar_diagnostico(p jsonb) returns json
language plpgsql security definer set search_path = '' as $$
declare v_j uuid; v_id uuid; v_r jsonb := p -> 'respuestas'; k text; val jsonb;
begin
  begin v_id := (p ->> 'id')::uuid; exception when others then raise exception 'Registro inválido'; end;
  if v_id is null then raise exception 'Registro inválido'; end if;
  select j.id into v_j from rs_capacitacion.jornadas j where j.codigo = upper(btrim(coalesce(p ->> 'jornada', ''))) and j.estado = 'abierta';
  if v_j is null then raise exception 'La jornada no existe o está cerrada'; end if;
  if v_r is null or jsonb_typeof(v_r) <> 'object' or (select count(*) from jsonb_object_keys(v_r)) not between 1 and 20 then raise exception 'Respuestas inválidas'; end if;
  for k, val in select * from jsonb_each(v_r) loop
    if k !~ '^\d{1,2}$' or jsonb_typeof(val) <> 'number' or (val #>> '{}') !~ '^\d$' then raise exception 'Respuestas inválidas'; end if;
  end loop;
  if (select count(*) from rs_capacitacion.diagnosticos g where g.jornada_id = v_j) >= 500 then raise exception 'Límite de diagnósticos alcanzado'; end if;
  insert into rs_capacitacion.diagnosticos (id, jornada_id, respuestas) values (v_id, v_j, v_r) on conflict (id) do nothing;
  return json_build_object('ok', true);
end $$;

-- Nómina de la empresa (para cobertura y pendientes)
create or replace function public.rs_admin_nomina_cargar(p_empresa text, p_filas jsonb, p_reemplazar boolean) returns json
language plpgsql security definer set search_path = '' as $$
declare v_key text := rs_capacitacion.empresa_key(p_empresa); v_emp text := rs_capacitacion.txt(p_empresa, 80); f jsonb; n int := 0; v_leg text;
begin
  perform rs_capacitacion.exigir_admin();
  if v_emp is null then raise exception 'La empresa es obligatoria'; end if;
  if p_filas is null or jsonb_typeof(p_filas) <> 'array' or jsonb_array_length(p_filas) > 5000 then raise exception 'Nómina inválida'; end if;
  if p_reemplazar then delete from rs_capacitacion.nomina where empresa_key = v_key; end if;
  for f in select * from jsonb_array_elements(p_filas) loop
    v_leg := upper(btrim(coalesce(f ->> 'legajo', '')));
    continue when v_leg !~ '^[A-Z0-9-]{1,12}$';
    insert into rs_capacitacion.nomina (empresa_key, empresa, legajo, apellido, nombre, sector)
    values (v_key, v_emp, v_leg, rs_capacitacion.txt(f ->> 'apellido', 60), rs_capacitacion.txt(f ->> 'nombre', 60), rs_capacitacion.txt(f ->> 'sector', 80))
    on conflict (empresa_key, legajo) do update set empresa = excluded.empresa, apellido = excluded.apellido, nombre = excluded.nombre, sector = excluded.sector;
    n := n + 1;
  end loop;
  return json_build_object('ok', true, 'filas', n, 'total', (select count(*) from rs_capacitacion.nomina where empresa_key = v_key));
end $$;

create or replace function public.rs_admin_nomina_borrar(p_empresa text) returns json
language plpgsql security definer set search_path = '' as $$
begin
  perform rs_capacitacion.exigir_admin();
  delete from rs_capacitacion.nomina where empresa_key = rs_capacitacion.empresa_key(p_empresa);
  return json_build_object('ok', true);
end $$;

-- Todos los datos agregables para el tablero general y los informes por empresa
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
    'diagnosticos', coalesce((select json_agg(json_build_object('jornada_id', g.jornada_id, 'respuestas', g.respuestas)) from rs_capacitacion.diagnosticos g), '[]'::json),
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
        (select count(*) from rs_capacitacion.diagnosticos g where g.jornada_id = j.id) as diagnosticos
      from rs_capacitacion.jornadas j) x), '[]'::json);
end $$;

create or replace function public.rs_admin_crear_jornada(p jsonb) returns json
language plpgsql security definer set search_path = '' as $$
declare v_cod text; v_row rs_capacitacion.jornadas; v_mail text := lower(btrim(coalesce(p ->> 'contacto_email', '')));
begin
  perform rs_capacitacion.exigir_admin();
  if rs_capacitacion.txt(p ->> 'empresa', 80) is null then raise exception 'La empresa es obligatoria'; end if;
  if v_mail <> '' and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Email de contacto inválido'; end if;
  loop
    v_cod := rs_capacitacion.codigo_aleatorio(5);
    exit when not exists (select 1 from rs_capacitacion.jornadas j where j.codigo = v_cod);
  end loop;
  insert into rs_capacitacion.jornadas (codigo, capacitacion, empresa, lugar, fecha, capacitador, creado_por, contacto_email)
  values (v_cod,
    coalesce(rs_capacitacion.txt(p ->> 'capacitacion', 140), 'Fatiga y Conducción Segura – Vehículos Livianos y Pesados'),
    rs_capacitacion.txt(p ->> 'empresa', 80), rs_capacitacion.txt(p ->> 'lugar', 120),
    coalesce((p ->> 'fecha')::date, (now() at time zone 'America/Argentina/Buenos_Aires')::date),
    coalesce(rs_capacitacion.txt(p ->> 'capacitador', 80), 'Capacitador'),
    lower(auth.jwt() ->> 'email'), nullif(left(v_mail, 120), ''))
  returning * into v_row;
  return row_to_json(v_row);
end $$;

revoke all on function public.rs_admin_compartir_informe(uuid, boolean), public.rs_informe_publico(text), public.rs_admin_contacto_jornada(uuid, text),
  public.rs_registrar_diagnostico(jsonb), public.rs_admin_nomina_cargar(text, jsonb, boolean), public.rs_admin_nomina_borrar(text), public.rs_admin_tablero() from public, anon, authenticated;
grant execute on function public.rs_informe_publico(text), public.rs_registrar_diagnostico(jsonb) to anon, authenticated;
grant execute on function public.rs_admin_compartir_informe(uuid, boolean), public.rs_admin_contacto_jornada(uuid, text),
  public.rs_admin_nomina_cargar(text, jsonb, boolean), public.rs_admin_nomina_borrar(text), public.rs_admin_tablero() to authenticated;
revoke all on function rs_capacitacion.informe_datos(uuid), rs_capacitacion.empresa_key(text) from public, anon, authenticated;

-- Registro de la evaluación: ahora también guarda satisfacción (1 a 5) y comentario opcional
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
      incorrectas, porcentaje, intentos, estado, criterio, respuestas, firma, firmado_at, verificacion, satisfaccion, comentario)
    values (v_id, v_hash, v_jornada, v_legajo, v_nombre, v_apellido,
      rs_capacitacion.txt(p ->> 'empresa', 80), rs_capacitacion.txt(p ->> 'sector', 80),
      rs_capacitacion.txt(p ->> 'tipo_vehiculo', 20), rs_capacitacion.txt(p ->> 'capacitacion', 140),
      rs_capacitacion.txt(p ->> 'capacitador', 80), rs_capacitacion.ts(p ->> 'fecha_inicio'),
      rs_capacitacion.ts(p ->> 'fecha_fin'), rs_capacitacion.ent(p ->> 'duracion_min', 0, 1440),
      v_preg, v_corr, case when v_corr is null then null else v_preg - v_corr end, v_pct, coalesce(v_int, 0),
      v_estado, v_crit, v_resp, v_firma, case when v_firma is not null then now() end, v_ver, v_sat, v_com);
  end if;

  return json_build_object('ok', true, 'verificacion', v_ver,
    'jornada', (select j.codigo from rs_capacitacion.jornadas j
                 join rs_capacitacion.registros r on r.jornada_id = j.id where r.id = v_id));
end $function$;
