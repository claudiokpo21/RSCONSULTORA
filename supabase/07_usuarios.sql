-- 07_usuarios.sql — ADMINISTRACIÓN DE USUARIOS (capacitadores) DESDE LA PLATAFORMA
-- Ejecutar una sola vez en Supabase → SQL Editor. No borra datos.
-- Agrega las funciones que usa la pestaña «Usuarios» de Administración:
--   · rs_admin_usuarios()            lista de capacitadores con acceso y el estado de su cuenta
--   · rs_admin_usuario_guardar(...)  habilita un email (o cambia su nombre)
--   · rs_admin_usuario_quitar(...)   le quita el acceso (no se puede quitar a uno mismo ni al último)
-- La cuenta (email y contraseña) se crea desde la plataforma con el alta normal de Supabase;
-- el acceso a la capacitación lo da únicamente la lista rs_capacitacion.administradores.

create or replace function public.rs_admin_usuarios()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not rs_capacitacion.es_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'email', a.email, 'nombre', a.nombre, 'alta', a.created_at,
      'cuenta', u.id is not null,
      'confirmada', u.email_confirmed_at is not null,
      'ultimo_ingreso', u.last_sign_in_at,
      'yo', a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    ) order by a.created_at)
    from rs_capacitacion.administradores a
    left join auth.users u on lower(u.email) = a.email
  ), '[]'::jsonb);
end $$;

create or replace function public.rs_admin_usuario_guardar(p_email text, p_nombre text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not rs_capacitacion.es_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'El email no es válido.'; end if;
  insert into rs_capacitacion.administradores (email, nombre)
  values (v_email, nullif(trim(coalesce(p_nombre, '')), ''))
  on conflict (email) do update set nombre = coalesce(excluded.nombre, rs_capacitacion.administradores.nombre);
  return jsonb_build_object('ok', true, 'email', v_email);
end $$;

create or replace function public.rs_admin_usuario_quitar(p_email text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email, '')));
begin
  if not rs_capacitacion.es_admin() then raise exception 'No autorizado' using errcode = '42501'; end if;
  if v_email = lower(coalesce(auth.jwt() ->> 'email', '')) then raise exception 'No podés quitarte el acceso a vos mismo.'; end if;
  if (select count(*) from rs_capacitacion.administradores) <= 1 then raise exception 'Tiene que quedar al menos un usuario con acceso.'; end if;
  delete from rs_capacitacion.administradores where email = v_email;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.rs_admin_usuarios() from public, anon;
revoke all on function public.rs_admin_usuario_guardar(text, text) from public, anon;
revoke all on function public.rs_admin_usuario_quitar(text) from public, anon;
grant execute on function public.rs_admin_usuarios() to authenticated;
grant execute on function public.rs_admin_usuario_guardar(text, text) to authenticated;
grant execute on function public.rs_admin_usuario_quitar(text) to authenticated;
