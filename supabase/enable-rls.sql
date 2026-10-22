-- Políticas de seguridad de filas (RLS) para desplegar Dominican Flow en Supabase.
--
-- La aplicación accede a PostgreSQL SOLO desde el servidor, con el usuario de la
-- cadena DATABASE_URL (propietario de las tablas, que no está sujeto a RLS).
-- Activamos RLS en todas las tablas SIN políticas para los roles `anon` y
-- `authenticated`: así la API REST/GraphQL pública de Supabase no puede leer ni
-- escribir ningún dato aunque se filtre la clave anónima.
--
-- Si en el futuro se usa el cliente de Supabase desde el navegador, añadir
-- políticas explícitas y mínimas por tabla (p. ej. lectura pública de artistas
-- publicados) en lugar de desactivar RLS.

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'sessions', 'genres', 'artists', 'artist_links', 'releases', 'media',
    'follows', 'profile_views', 'verification_requests', 'providers', 'services',
    'service_inquiries', 'booking_requests', 'booking_messages', 'opportunities',
    'opportunity_applications', 'events', 'posts', 'features', 'reports', 'leads', 'audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

-- La tabla de control de migraciones tampoco debe ser accesible públicamente
revoke all on schema drizzle from anon, authenticated;
