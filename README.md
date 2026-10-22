# Dominican Flow — «Más que música, una oportunidad»

Plataforma web para **descubrir** nuevos talentos musicales de República Dominicana, **impulsar** sus carreras con servicios profesionales y **conectarlos** con oportunidades reales (contrataciones, convocatorias, showcases y patrocinios).

> Versión 0.1 (beta). Los artistas, eventos, precios y artículos marcados como **«Demo»** son ficticios.

El nombre y el eslogan se cambian en un solo sitio: [`src/config/site.ts`](src/config/site.ts) (o con `NEXT_PUBLIC_SITE_NAME`).

---

## Puesta en marcha

Requisitos: **Node.js 20+** y **PostgreSQL 14+** (local, Docker o Supabase).

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env        # edita DATABASE_URL y DATABASE_URL_TEST

# 3. Base de datos: crear esquema + datos de demostración
npm run db:migrate
npm run db:seed             # o: npm run db:reset (borra todo, migra y siembra)

# 4. Desarrollo
npm run dev                 # http://localhost:3000

# 5. Producción local
npm run build && npm start
```

Ejemplo para crear la base de datos local en PostgreSQL:

```bash
sudo -u postgres psql -c "CREATE ROLE dflow LOGIN PASSWORD 'dflow' CREATEDB;"
sudo -u postgres createdb -O dflow dominicanflow
sudo -u postgres createdb -O dflow dominicanflow_test
```

### Cuentas de demostración (creadas por `npm run db:seed`)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@demo.local` | `DemoAdmin2026!` (o `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) |
| Artista (Luna Batey) | `artista@demo.local` | `DemoArtista2026!` |
| Promotor | `promotor@demo.local` | `DemoPromotor2026!` |
| Fan | `fan@demo.local` | `DemoFan2026!` |
| Proveedor | `proveedor@demo.local` | `DemoProveedor2026!` |

El seed está **bloqueado en producción** salvo que se defina `ALLOW_DEMO_SEED=1`. Nunca uses estas contraseñas en un entorno público.

## Pruebas

```bash
npm run typecheck   # TypeScript estricto
npm test            # 30 pruebas: unitarias + integración contra DATABASE_URL_TEST (se recrea en cada ejecución)
npm run test:e2e    # recorrido E2E en Chromium real (móvil 390px y escritorio); requiere la app en marcha
                    # ⚠ modifica la base de datos: después ejecuta npm run db:reset
```

Las pruebas de integración cubren: hash de contraseñas, sesiones, duplicados, suspensión, propiedad de perfiles, ciclo de contratación con permisos por parte, ocultación del correo hasta la negociación, límites anti-spam, reglas de patrocinio, servicios sin proveedor, retirada por derechos de autor, postulaciones y eliminación de cuenta.

## Qué incluye

| Área | Estado |
|---|---|
| Inicio (hero, géneros, destacados, talento de la semana, emergentes, lanzamientos, recomendaciones, servicios, oportunidades, eventos, CTA artistas, sección negocios) | ✅ Funcional con datos de BD |
| Catálogo de artistas con búsqueda y filtros (género, provincia, popularidad, recientes, nuevos, contratables) + paginación | ✅ |
| Perfil de artista (bio, lanzamientos, videos oficiales incrustados, enlaces, estadísticas de plataforma, seguir, contratar, reportar) | ✅ |
| Registro / inicio de sesión / cierre, 4 roles autoservicio + admin | ✅ |
| Panel del artista: perfil, fotos y portada, lanzamientos, enlaces, contenido con confirmación de derechos, contrataciones, estadísticas, oportunidades, servicios, cuenta y privacidad | ✅ |
| Contrataciones: solicitud → negociación → aceptada/rechazada/cancelada con mensajes e historial | ✅ (sin pagos ni reservas automáticas) |
| Servicios profesionales con proveedor, entregables y precio demo + solicitud de información | ✅ |
| Oportunidades (convocatorias, concursos con reglas, showcases, colaboraciones, contrataciones, campañas patrocinadas) + postulación | ✅ |
| Editorial (talento de la semana, entrevistas, anuncios) y eventos | ✅ |
| Administración: métricas, artistas, verificaciones, contenido en revisión, denuncias con retirada, destacados (editorial vs patrocinado), editorial, oportunidades y postulaciones, eventos, servicios, proveedores, contrataciones, contactos, usuarios y permisos, auditoría | ✅ |
| Legal: términos, privacidad, derechos de autor y proceso de retirada | ⚠️ Borradores pendientes de revisión jurídica |
| Pagos, suscripciones, comisiones | ⏸️ No implementados a propósito — ver [`docs/PAGOS.md`](docs/PAGOS.md) |
| Correo transaccional (notificaciones, recuperación de contraseña) | ⏸️ Pendiente — requiere proveedor SMTP |
| Almacenamiento de imágenes en la nube | ⏸️ Driver local listo; S3/Supabase Storage pendiente — ver [`docs/DEPLOY.md`](docs/DEPLOY.md) |

Más detalle técnico en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Estructura

```
src/
  app/                 Rutas (App Router). Páginas públicas, /panel, /admin, /api
    actions/           Acciones de servidor (validan con Zod y delegan en src/server)
  server/              Lógica de dominio + autorización (cada función recibe al actor)
  lib/                 auth (scrypt, sesiones, políticas), validación, almacenamiento, utilidades
  db/                  Esquema Drizzle (PostgreSQL)
  components/          Sistema de diseño (ui/), tarjetas, layout, formularios, panel y admin
  config/site.ts       Nombre, eslogan, provincias, etiquetas
drizzle/               Migraciones SQL versionadas
supabase/              Políticas RLS para despliegues en Supabase
scripts/               migrate, seed, reset, e2e-smoke, capturas
tests/                 Vitest (unitarias + integración)
docs/                  Arquitectura, despliegue, pagos
```
