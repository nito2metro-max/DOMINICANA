# Despliegue

## 1. Base de datos

Cualquier PostgreSQL 14+ sirve. Opciones recomendadas:

### Supabase (Postgres gestionado)
1. Crea un proyecto en Supabase → *Project Settings → Database → Connection string* (modo **Session** o **Transaction pooler**; la app usa `prepare: false`, compatible con el pooler).
2. Define `DATABASE_URL` con esa cadena (**solo en el servidor**; nunca con prefijo `NEXT_PUBLIC_`).
3. Aplica migraciones desde tu máquina o CI: `DATABASE_URL=... npm run db:migrate`.
4. Aplica las políticas RLS: ejecuta [`supabase/enable-rls.sql`](../supabase/enable-rls.sql) en el editor SQL.
   - La app accede a la BD **solo desde el servidor** con el rol de la cadena de conexión. RLS activado sin políticas para `anon`/`authenticated` hace que la API REST pública de Supabase (PostgREST) **no pueda leer ni escribir nada**, aunque alguien obtenga la clave `anon`.
   - No uses la `service_role key` en el navegador. Esta app no la necesita.
5. No ejecutes `db:seed` en producción (está bloqueado salvo `ALLOW_DEMO_SEED=1`). Crea el primer admin así:
   ```sql
   -- tras registrarte normalmente en /registro:
   UPDATE users SET role = 'admin' WHERE email = 'tu-correo@dominio.com';
   ```

### Otras: Neon, Railway, RDS, servidor propio — igual: `DATABASE_URL` + `npm run db:migrate`.

## 2. Aplicación

### Vercel
1. Importa el repositorio. Framework: Next.js (autodetectado).
2. Variables: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL` (https://tudominio), `NEXT_PUBLIC_SITE_NAME`, `STORAGE_DRIVER`.
3. **Almacenamiento**: el sistema de archivos de Vercel es efímero → el driver `local` no sirve. Implementa el driver S3/Supabase (abajo) antes de permitir subidas.

### Servidor propio / Docker / Railway / Render
```bash
npm ci && npm run build && npm run db:migrate && npm start   # puerto 3000
```
Con `STORAGE_DRIVER=local` monta `STORAGE_LOCAL_DIR` en un volumen persistente y haz copias de seguridad.

Ponlo detrás de HTTPS (la cookie de sesión se marca `Secure` en producción).

## 3. Almacenamiento de imágenes en la nube (pendiente)

`src/lib/storage.ts` expone `saveImage`, `readStoredFile`, `deleteStoredFile`. Para Supabase Storage o S3:
1. Crea un bucket **privado** (`dflow-media`) — o público solo para lectura.
2. Implementa las tres funciones con el SDK (`@supabase/supabase-js` con la service key **en el servidor** o `@aws-sdk/client-s3`), manteniendo la validación por firma binaria y el límite de 5 MB.
3. Devuelve URLs públicas del bucket o firma URLs temporales; añade el dominio a `next.config.ts` si usas `next/image`.
4. Variables: `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (solo servidor).

## 4. Correo (pendiente)

Para notificaciones de solicitudes y recuperación de contraseña: añade un proveedor (Resend, Postmark, SES) con `SMTP_*`/`RESEND_API_KEY` en el servidor y llama al envío desde `src/server/bookings.ts` (creación y cambio de estado) y desde un flujo de restablecimiento con token de un solo uso.

## 5. Lista de verificación antes del lanzamiento

- [ ] Revisión jurídica de `/legal/*` (Ley 172-13 de datos personales, Ley 65-00 de derecho de autor).
- [ ] Sustituir `contactEmail` en `src/config/site.ts`.
- [ ] Driver de almacenamiento en la nube y copias de seguridad de BD.
- [ ] Limitador de intentos distribuido si hay más de una instancia.
- [ ] Correo transaccional y recuperación de contraseña.
- [ ] Eliminar o despublicar los datos de demostración (`is_demo = true`).
- [ ] Monitorización de `/api/health` y logs.
