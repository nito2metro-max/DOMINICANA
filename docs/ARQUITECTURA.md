# Arquitectura

## Decisiones

| Necesidad | Elección | Motivo |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript estricto** | Renderizado en servidor (SEO, rapidez en móviles), acciones de servidor sin API pública adicional |
| Estilos | **Tailwind CSS 4** con tokens en `src/app/globals.css` | Sistema de diseño consistente, sin dependencias de UI pesadas |
| Base de datos | **PostgreSQL** + **Drizzle ORM** | Relacional, migraciones SQL legibles, compatible con Supabase/Neon/RDS |
| Autenticación | Propia: **scrypt** + sesiones en BD + cookie `httpOnly` | Sin proveedor externo obligatorio; sesiones revocables (suspensión, cambio de contraseña, eliminación) |
| Validación | **Zod 4** en servidor | Toda entrada se valida en el servidor aunque haya validación en el cliente |
| Pruebas | **Vitest** (unitarias + integración con BD real) y **Playwright** (E2E) | |

## Capas

```
Navegador ──► Página (Server Component) ──► src/server/* ──► PostgreSQL
          └─► Acción de servidor (src/app/actions/*)
                 │ 1. getCurrentUser()  (sesión desde cookie httpOnly)
                 │ 2. Zod.safeParse(FormData)
                 └► 3. src/server/*  ── comprueba políticas (src/lib/auth/policies.ts) ── BD
```

- **`src/lib/auth/policies.ts`**: reglas puras y probadas (quién edita qué, máquina de estados de contrataciones). Toda función de `src/server` las aplica: no se confía en la interfaz.
- Las solicitudes ajenas responden **404** (no 403) para no revelar su existencia.
- `middleware.ts` solo hace una redirección optimista si no hay cookie; la autorización real ocurre en el servidor en cada página y acción.

## Roles

| Rol | Puede |
|---|---|
| Visitante | Explorar, buscar, ver perfiles, solicitar info de servicios, reportar, contactar como marca |
| Fan | + seguir artistas, recomendaciones personalizadas, enviar solicitudes de contratación |
| Artista | + perfil propio, imágenes, lanzamientos, enlaces, contenido, responder contrataciones, postularse, verificación |
| Profesional/Proveedor | + panel básico; el admin lo vincula a un proveedor (gestión propia de servicios: fase futura) |
| Promotor/Cliente | + enviar y seguir solicitudes de contratación |
| Administrador | Todo el panel `/admin`. **No** se puede obtener por registro; solo lo asigna otro admin o el seed |

## Contrataciones (máquina de estados)

```
pending ──artista──► negotiating ──artista──► accepted
   │                     │                      │
   ├─artista─► rejected  ├─artista─► rejected   └─cualquiera de las partes/admin─► cancelled
   └─solicitante/admin─► cancelled  └─partes/admin─► cancelled
```

«Aceptada» = acuerdo de intención; **no** confirma reserva ni pagos. El correo del solicitante solo se muestra al artista desde «negociando». Cada cambio queda en el historial de mensajes. Actualización condicionada al estado leído (sin condiciones de carrera).

## Transparencia editorial

- Tabla `features` con `kind = editorial | patrocinado`. Lo patrocinado exige `sponsor_name` (validación + servidor) y se muestra con `SponsoredBadge`.
- Las oportunidades, eventos y artículos tienen `is_sponsored` + `sponsor_name` con la misma regla.
- No existe ninguna función para editar seguidores ni visitas: las estadísticas se calculan a partir de `follows` y `profile_views` (agregado diario, sin datos personales).
- La verificación la concede un admin tras revisar evidencias; cambiar el nombre artístico de un perfil verificado la retira.
- Los concursos publicados deben incluir reglas (≥ 40 caracteres).
- Todo cambio administrativo se registra en `audit_log`.

## Derechos y contenido

- No se alojan ni descargan audios: solo enlaces y reproductores oficiales (YouTube vía `youtube-nocookie`, Spotify embed). Ver `src/lib/embeds.ts`.
- Cada contenido guarda `rights_confirmed_at`. Las plataformas no reconocidas quedan `under_review` hasta aprobación.
- Denuncias (`reports`) con resolución y retirada automática del objeto (media retirado, perfil despublicado, lanzamiento eliminado, artículo archivado).

## Imágenes

`src/lib/storage.ts`: valida tamaño (≤ 5 MB) y **tipo real por firma binaria** (JPG/PNG/WebP; rechaza SVG/HTML disfrazados), nombre aleatorio, servido por `/api/files/...` con `nosniff` y CSP restrictiva.

## Privacidad

- Datos mínimos: nombre, correo, contraseña (hash). Sin teléfono obligatorio.
- `/panel/cuenta`: preferencias, cambio de contraseña (cierra todas las sesiones), **exportación JSON** y **eliminación** (anonimiza datos, despublica perfil, borra sesiones y seguimientos).
- Una única cookie técnica de sesión.

## Limitaciones conocidas

- El limitador de intentos (`src/lib/rate-limit.ts`) es en memoria: válido para una instancia. Con varias instancias, usar Redis/Upstash.
- Next.js 15.5 deja colgada la navegación cliente hacia la misma ruta con otros parámetros cuando hay un `loading.tsx` a nivel de ruta. Por eso el catálogo de artistas usa `<Suspense>` dentro de la página. El panel conserva `loading.tsx` porque su interfaz no navega a la misma ruta cambiando parámetros.
- Sin recuperación de contraseña por correo hasta configurar SMTP.
