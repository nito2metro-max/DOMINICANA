/**
 * Datos de DEMOSTRACIÓN. Todos los artistas, proveedores, eventos y publicaciones
 * son ficticios y se marcan con is_demo = true para mostrarse con la etiqueta «Demo».
 * No contienen estadísticas, seguidores ni reproducciones inventadas.
 *
 * Uso: npm run db:seed   (solo sobre una base de datos vacía)
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as s from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

const url = process.argv[2] ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL no configurada");
if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED !== "1") {
  throw new Error("Seed de demostración bloqueado en producción (define ALLOW_DEMO_SEED=1 si de verdad lo necesitas)");
}
const client = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(client, { schema: s });

const existing = await db.select({ n: sql<number>`count(*)::int` }).from(s.users);
if ((existing[0]?.n ?? 0) > 0 && !process.argv.includes("--force")) {
  console.log("La base de datos ya tiene usuarios; no se aplica el seed. Usa npm run db:reset para empezar de cero.");
  await client.end();
  process.exit(0);
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const dateIn = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);
const dateAgo = (d: number) => daysAgo(d).toISOString().slice(0, 10);

/* -------------------------------- Géneros -------------------------------- */
const genreRows = await db
  .insert(s.genres)
  .values([
    { slug: "dembow", name: "Dembow", color: "pink", sortOrder: 1, description: "El pulso urbano de los barrios dominicanos." },
    { slug: "merengue-tipico", name: "Merengue típico", color: "orange", sortOrder: 2, description: "Acordeón, güira y tambora: la raíz del Cibao." },
    { slug: "bachata", name: "Bachata", color: "blue", sortOrder: 3, description: "Guitarra, requinto y sentimiento." },
    { slug: "merengue", name: "Merengue", color: "green", sortOrder: 4, description: "Orquestas, metales y pista de baile." },
    { slug: "urbano", name: "Música urbana", color: "violet", sortOrder: 5, description: "Trap, reguetón y nuevas fusiones." },
    { slug: "raices-fusion", name: "Raíces y fusión", color: "teal", sortOrder: 6, description: "Palo, gagá, son y sonidos afrodominicanos." },
    { slug: "pop-alternativo", name: "Pop y alternativo", color: "blue", sortOrder: 7, description: "Pop, rock, jazz y propuestas independientes." },
  ])
  .returning();
const g = Object.fromEntries(genreRows.map((r) => [r.slug, r.id])) as Record<string, string>;

/* -------------------------------- Usuarios ------------------------------- */
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@demo.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "DemoAdmin2026!";
const [admin] = await db
  .insert(s.users)
  .values({ email: adminEmail, name: "Equipo Editorial", role: "admin", passwordHash: await hashPassword(adminPassword), isDemo: true })
  .returning();
const [artistUser] = await db
  .insert(s.users)
  .values({ email: "artista@demo.local", name: "Luna Batey (demo)", role: "artist", passwordHash: await hashPassword("DemoArtista2026!"), isDemo: true })
  .returning();
const [promoter] = await db
  .insert(s.users)
  .values({ email: "promotor@demo.local", name: "Carlos Promotor (demo)", role: "promoter", passwordHash: await hashPassword("DemoPromotor2026!"), isDemo: true })
  .returning();
await db
  .insert(s.users)
  .values({ email: "fan@demo.local", name: "Ana Fan (demo)", role: "fan", passwordHash: await hashPassword("DemoFan2026!"), isDemo: true });
const [providerUser] = await db
  .insert(s.users)
  .values({ email: "proveedor@demo.local", name: "Estudio Ejemplo (demo)", role: "provider", passwordHash: await hashPassword("DemoProveedor2026!"), isDemo: true })
  .returning();

/* -------------------------------- Artistas ------------------------------- */
type A = { slug: string; name: string; genre: string; province: string; city: string; short: string; bio: string; age: number; booking?: boolean; userId?: string };
const artistsData: A[] = [
  {
    slug: "luna-batey",
    name: "Luna Batey",
    genre: "bachata",
    province: "Santiago",
    city: "Santiago de los Caballeros",
    short: "Bachata de guitarra limpia y letras que cuentan historias de pueblo.",
    bio: "Luna Batey es una artista ficticia creada para la demostración de la plataforma. Su propuesta mezcla la bachata tradicional de requinto con arreglos acústicos contemporáneos.\n\nEn esta demo, su perfil está vinculado a la cuenta de ejemplo artista@demo.local para mostrar el panel privado del artista.",
    age: 120,
    userId: artistUser!.id,
  },
  {
    slug: "nando-tambora",
    name: "Nando Tamborá",
    genre: "merengue-tipico",
    province: "La Vega",
    city: "La Vega",
    short: "Acordeonista de merengue típico con sabor a fiesta patronal.",
    bio: "Perfil ficticio de demostración. Nando representa a la nueva generación del típico: respeto por el perico ripiao y ganas de llevarlo a nuevos públicos.",
    age: 200,
  },
  {
    slug: "mia-cayena",
    name: "Mía Cayena",
    genre: "urbano",
    province: "Santo Domingo",
    city: "Santo Domingo Este",
    short: "Voz melódica sobre beats de trap y R&B caribeño.",
    bio: "Perfil ficticio de demostración. Mía combina melodías R&B con la cadencia del Caribe y letras sobre crecer en la ciudad.",
    age: 12,
  },
  {
    slug: "zafiro-del-ensanche",
    name: "Zafiro del Ensanche",
    genre: "dembow",
    province: "Distrito Nacional",
    city: "Santo Domingo",
    short: "Dembow de barrio, energía de tarima y coros para cantar en grupo.",
    bio: "Perfil ficticio de demostración. Zafiro es un ejemplo de artista de dembow emergente que busca su primer showcase.",
    age: 30,
  },
  {
    slug: "orquesta-brisa-caribe",
    name: "Orquesta Brisa Caribe",
    genre: "merengue",
    province: "Puerto Plata",
    city: "Puerto Plata",
    short: "Orquesta de merengue con metales para bodas, hoteles y fiestas.",
    bio: "Agrupación ficticia de demostración. Ilustra el perfil de una orquesta disponible para eventos privados y corporativos.",
    age: 260,
  },
  {
    slug: "ambar-lizardo",
    name: "Ámbar Lizardo",
    genre: "pop-alternativo",
    province: "Distrito Nacional",
    city: "Santo Domingo",
    short: "Pop alternativo con piano, sintetizadores y raíces caribeñas.",
    bio: "Perfil ficticio de demostración. Ámbar explora el pop independiente con guiños al bolero y a la canción dominicana.",
    age: 8,
  },
  {
    slug: "trio-pico-duarte",
    name: "Trío Pico Duarte",
    genre: "merengue-tipico",
    province: "Santiago",
    city: "San José de las Matas",
    short: "Perico ripiao de la sierra: acordeón, güira y tambora.",
    bio: "Agrupación ficticia de demostración inspirada en los tríos tradicionales del Cibao.",
    age: 90,
  },
  {
    slug: "rocio-samana",
    name: "Rocío Samaná",
    genre: "bachata",
    province: "Samaná",
    city: "Santa Bárbara de Samaná",
    short: "Bachata romántica con voz cálida y arreglos de cuerdas.",
    bio: "Perfil ficticio de demostración. Rocío representa a artistas de provincia que buscan conectar con la capital y la diáspora.",
    age: 20,
  },
  {
    slug: "junior-malecon",
    name: "Junior Malecón",
    genre: "urbano",
    province: "San Pedro de Macorís",
    city: "San Pedro de Macorís",
    short: "Trap caribeño con historias del este del país.",
    bio: "Perfil ficticio de demostración.",
    age: 60,
    booking: false,
  },
  {
    slug: "colectivo-atabal-nuevo",
    name: "Colectivo Atabal Nuevo",
    genre: "raices-fusion",
    province: "San Cristóbal",
    city: "San Cristóbal",
    short: "Palos, gagá y electrónica: tradición afrodominicana en clave actual.",
    bio: "Colectivo ficticio de demostración que ilustra la sección de raíces y fusión.",
    age: 150,
  },
  {
    slug: "sofi-ozama",
    name: "Sofi Ozama",
    genre: "pop-alternativo",
    province: "Santo Domingo",
    city: "Santo Domingo Oeste",
    short: "Cantautora de pop acústico con letras bilingües.",
    bio: "Perfil ficticio de demostración.",
    age: 5,
  },
  {
    slug: "dj-cabarete",
    name: "DJ Cabarete",
    genre: "dembow",
    province: "Puerto Plata",
    city: "Sosúa",
    short: "Sets de dembow y electrónica para playa, clubes y festivales.",
    bio: "Perfil ficticio de demostración. Ejemplo de DJ disponible para discotecas y eventos turísticos.",
    age: 40,
  },
];

const artistRows = await db
  .insert(s.artists)
  .values(
    artistsData.map((a) => ({
      slug: a.slug,
      stageName: a.name,
      genreId: g[a.genre],
      province: a.province,
      city: a.city,
      shortBio: a.short,
      bio: a.bio,
      bookingEnabled: a.booking ?? true,
      isPublished: true,
      isDemo: true,
      userId: a.userId ?? null,
      createdAt: daysAgo(a.age),
      updatedAt: daysAgo(Math.min(a.age, 3)),
    })),
  )
  .returning();
const art = Object.fromEntries(artistRows.map((r) => [r.slug, r])) as Record<string, (typeof artistRows)[number]>;

/* ------------------------------ Lanzamientos ----------------------------- */
const rel = (slug: string, title: string, type: "single" | "ep" | "album", ago: number, description = "") => ({
  artistId: art[slug]!.id,
  title,
  type,
  releaseDate: dateAgo(ago),
  description: description || "Lanzamiento ficticio de demostración (sin audio asociado).",
  isDemo: true,
});
await db.insert(s.releases).values([
  rel("luna-batey", "Callejón de Luna", "single", 6),
  rel("luna-batey", "Requinto y Café", "ep", 80),
  rel("mia-cayena", "Flamboyán", "single", 3),
  rel("zafiro-del-ensanche", "Tarima Llena", "single", 10),
  rel("nando-tambora", "Fiesta en el Cibao", "album", 45),
  rel("ambar-lizardo", "Malecón Azul", "single", 2),
  rel("rocio-samana", "Ballenas en Enero", "single", 14),
  rel("colectivo-atabal-nuevo", "Atabales Eléctricos", "ep", 25),
  rel("dj-cabarete", "Kite Beach Riddim", "single", 18),
  rel("orquesta-brisa-caribe", "Brisa de Noche", "single", 33),
  rel("sofi-ozama", "Dos Orillas", "single", 1),
  rel("trio-pico-duarte", "Sierra Adentro", "album", 120),
]);

/* --------------------- Proveedores y servicios (demo) --------------------- */
const [demoProvider] = await db
  .insert(s.providers)
  .values({
    name: "Estudio Ejemplo (proveedor de demostración)",
    description: "Proveedor ficticio usado para ilustrar cómo se muestran los servicios con proveedor asignado.",
    contactEmail: "proveedor@demo.local",
    userId: providerUser!.id,
    isDemo: true,
  })
  .returning();

const svc = (o: Partial<typeof s.services.$inferInsert> & { slug: string; title: string; category: string; summary: string; description: string; deliverables: string[] }) => ({
  priceIsDemo: true,
  isDemo: true,
  currency: "DOP",
  status: "coming_soon" as const,
  ...o,
});
await db.insert(s.services).values([
  svc({
    slug: "diseno-de-portadas",
    title: "Diseño de portadas",
    category: "Diseño",
    icon: "palette",
    summary: "Portadas para sencillos, EP y álbumes listas para plataformas digitales.",
    description: "Diseño de arte de portada a partir de una sesión de briefing sobre tu música, tu estética y tu público. Se entregan archivos en los formatos requeridos por las distribuidoras.",
    deliverables: ["Briefing creativo (videollamada)", "2 propuestas iniciales", "2 rondas de cambios", "Archivo 3000×3000 px y versiones para redes"],
    priceFrom: 4500,
    providerId: demoProvider!.id,
    status: "active",
    sortOrder: 1,
  }),
  svc({
    slug: "material-promocional",
    title: "Material promocional",
    category: "Diseño",
    icon: "image",
    summary: "Piezas para redes sociales, flyers y banners de lanzamiento.",
    description: "Kit visual coherente para anunciar tu lanzamiento o presentación en redes sociales y medios impresos.",
    deliverables: ["6 piezas para redes (post y story)", "1 flyer de evento", "Plantillas editables"],
    priceFrom: 6000,
    providerId: demoProvider!.id,
    status: "active",
    sortOrder: 2,
  }),
  svc({
    slug: "estrategia-de-lanzamiento",
    title: "Estrategia de lanzamiento",
    category: "Estrategia",
    icon: "rocket",
    summary: "Plan paso a paso para lanzar tu próxima canción con objetivos medibles.",
    description: "Sesiones de trabajo para definir calendario, contenidos, presupuesto y acciones antes, durante y después del lanzamiento.",
    deliverables: ["Diagnóstico del perfil", "Calendario de 6 semanas", "Plan de contenidos", "Checklist de distribución"],
    priceFrom: 12000,
    sortOrder: 3,
  }),
  svc({
    slug: "promocion-en-redes",
    title: "Promoción en redes sociales",
    category: "Promoción",
    icon: "megaphone",
    summary: "Campañas pagadas y orgánicas segmentadas para tu público.",
    description: "Gestión de campañas en redes sociales con presupuesto publicitario acordado y reportes transparentes. No se compran seguidores ni reproducciones.",
    deliverables: ["Estrategia de segmentación", "Creatividades adaptadas", "Reporte de resultados"],
    priceFrom: null,
    sortOrder: 4,
  }),
  svc({
    slug: "produccion-musical",
    title: "Producción musical",
    category: "Producción",
    icon: "sliders",
    summary: "Producción, mezcla y masterización con estudios aliados.",
    description: "Conexión con productores y estudios aliados para producir tu canción. El servicio lo presta directamente el estudio; la plataforma facilita el contacto.",
    deliverables: ["Preproducción", "Grabación y producción", "Mezcla y máster"],
    priceFrom: null,
    sortOrder: 5,
  }),
  svc({
    slug: "distribucion-digital",
    title: "Distribución digital",
    category: "Distribución",
    icon: "globe",
    summary: "Publica tu música en plataformas mediante distribuidores autorizados.",
    description: "Orientación para elegir y configurar una distribuidora digital autorizada, metadatos, ISRC y registro de derechos. La distribución la realiza el distribuidor, no esta plataforma.",
    deliverables: ["Asesoría sobre distribuidoras", "Revisión de metadatos", "Guía de registro de derechos"],
    priceFrom: 3500,
    sortOrder: 6,
  }),
  svc({
    slug: "fotografia-y-video",
    title: "Fotografía y videografía",
    category: "Audiovisual",
    icon: "camera",
    summary: "Sesiones de fotos, videoclips y contenido para redes.",
    description: "Producción audiovisual con fotógrafos y realizadores aliados en distintas provincias.",
    deliverables: ["Sesión de fotos editada", "Visualizer o videoclip (según paquete)", "Clips verticales"],
    priceFrom: 15000,
    sortOrder: 7,
  }),
  svc({
    slug: "asesoria-de-marca",
    title: "Asesoría de marca artística",
    category: "Estrategia",
    icon: "sparkles",
    summary: "Define tu identidad, tu historia y cómo comunicarla.",
    description: "Trabajo de identidad artística: propuesta de valor, narrativa, estética y presencia digital.",
    deliverables: ["Taller de identidad", "Guía de marca artística", "Bio profesional y press kit"],
    priceFrom: 9000,
    sortOrder: 8,
  }),
]);

/* ------------------------------ Oportunidades ---------------------------- */
await db.insert(s.opportunities).values([
  {
    slug: "showcase-nuevos-talentos-santiago",
    type: "showcase",
    title: "Showcase Nuevos Talentos — Santiago",
    organizer: "Organizador de ejemplo (demo)",
    summary: "Seis artistas emergentes del Cibao se presentarán ante promotores y medios.",
    description: "Convocatoria ficticia de demostración. Buscamos artistas de bachata, típico y urbano con material original para un showcase de 20 minutos por artista.",
    rules: "1. Material original o con licencias en regla.\n2. Perfil publicado en la plataforma.\n3. Selección por un jurado de tres personas con criterios publicados: originalidad (40%), interpretación (40%), presencia escénica (20%).\n4. La selección no depende de seguidores ni de pagos.",
    location: "Santiago",
    deadline: dateIn(21),
    status: "published",
    isDemo: true,
  },
  {
    slug: "concurso-cancion-de-barrio",
    type: "concurso",
    title: "Concurso «Canción de Barrio»",
    organizer: "Equipo Editorial (demo)",
    summary: "Escribe y presenta una canción original sobre tu comunidad.",
    description: "Concurso ficticio de demostración para ilustrar el formato de concursos con reglas transparentes.",
    rules: "Participación gratuita. Una canción original por artista. Jurado independiente; los criterios y la composición del jurado se publican antes del cierre. El premio (ficticio en esta demo) es una sesión de producción. No se exige compra ni suscripción para participar. Los resultados se publican con los puntajes de cada criterio.",
    deadline: dateIn(35),
    status: "published",
    isDemo: true,
  },
  {
    slug: "colaboracion-productores-dembow",
    type: "colaboracion",
    title: "Productores buscan voces de dembow",
    organizer: "Colectivo de productores (demo)",
    summary: "Sesión de composición colaborativa con productores del Gran Santo Domingo.",
    description: "Oportunidad ficticia de demostración para mostrar colaboraciones entre artistas y productores.",
    location: "Santo Domingo",
    deadline: dateIn(14),
    genreId: g["dembow"],
    status: "published",
    isDemo: true,
  },
  {
    slug: "residencia-restaurante-zona-colonial",
    type: "contratacion",
    title: "Residencia acústica en restaurante de la Zona Colonial",
    organizer: "Restaurante de ejemplo (demo)",
    summary: "Se buscan artistas de bachata o bolero para noches acústicas los jueves.",
    description: "Oferta ficticia de demostración. Las condiciones económicas se negociarían directamente con el establecimiento.",
    location: "Zona Colonial, Santo Domingo",
    deadline: dateIn(10),
    status: "published",
    isDemo: true,
  },
  {
    slug: "campana-marca-verano",
    type: "convocatoria",
    title: "Campaña de verano para marca de bebidas",
    organizer: "Marca de ejemplo",
    summary: "Una marca busca artistas urbanos para contenido de campaña.",
    description: "Ejemplo ficticio de campaña patrocinada. Se muestra con la etiqueta «Patrocinado» para distinguirla de las oportunidades editoriales.",
    location: "Todo el país",
    deadline: dateIn(28),
    isSponsored: true,
    sponsorName: "Marca de ejemplo",
    status: "published",
    isDemo: true,
  },
]);

/* -------------------------------- Eventos -------------------------------- */
const at = (d: number, h: number) => {
  const x = new Date(Date.now() + d * 86_400_000);
  x.setHours(h, 0, 0, 0);
  return x;
};
await db.insert(s.events).values([
  { slug: "noche-de-bachata-acustica", title: "Noche de bachata acústica", kind: "Showcase", startsAt: at(9, 20), venue: "Sala de ejemplo", city: "Santiago", description: "Evento ficticio de demostración con tres artistas emergentes de bachata.", status: "published", isDemo: true },
  { slug: "tipico-en-la-plaza", title: "Típico en la plaza", kind: "Concierto", startsAt: at(16, 18), venue: "Plaza de ejemplo", city: "La Vega", description: "Evento ficticio de demostración dedicado al merengue típico.", status: "published", isDemo: true },
  { slug: "urbano-lab-sesion-abierta", title: "Urbano Lab: sesión abierta", kind: "Taller", startsAt: at(23, 17), venue: "Centro cultural de ejemplo", city: "Santo Domingo", description: "Taller ficticio de demostración sobre producción y escritura urbana.", status: "published", isDemo: true },
  { slug: "festival-raices-demo", title: "Festival Raíces", kind: "Festival", startsAt: at(40, 15), venue: "Parque de ejemplo", city: "San Cristóbal", description: "Festival ficticio de demostración con patrocinio etiquetado.", isSponsored: true, sponsorName: "Marca de ejemplo", status: "published", isDemo: true },
]);

/* ------------------------------- Editorial ------------------------------- */
await db.insert(s.posts).values([
  {
    slug: "talento-de-la-semana-mia-cayena",
    kind: "talento_semana",
    title: "Talento de la semana: Mía Cayena",
    excerpt: "Melodías R&B con acento caribeño. Por qué la elegimos esta semana.",
    body: "Este artículo es contenido ficticio de demostración.\n\nLa selección del talento de la semana la realiza el equipo editorial con criterios públicos: originalidad, calidad de la propuesta y trayectoria reciente dentro de la plataforma. No es una posición que se pueda comprar.\n\nMía Cayena (artista ficticia) destaca por su manera de mezclar el R&B con la cadencia caribeña.",
    artistId: art["mia-cayena"]!.id,
    authorId: admin!.id,
    status: "published",
    publishedAt: daysAgo(2),
    isDemo: true,
  },
  {
    slug: "entrevista-nando-tambora",
    kind: "entrevista",
    title: "Nando Tamborá: «El típico también es futuro»",
    excerpt: "Conversamos sobre acordeón, fiestas patronales y nuevas audiencias.",
    body: "Entrevista ficticia de demostración. Las respuestas son ilustrativas y no corresponden a ninguna persona real.\n\n¿Cómo empezaste en el típico?\nEn las fiestas del pueblo, escuchando a los mayores.\n\n¿Qué necesita un artista de provincia hoy?\nVisibilidad, formación y oportunidades de tocar en vivo con condiciones justas.",
    artistId: art["nando-tambora"]!.id,
    authorId: admin!.id,
    status: "published",
    publishedAt: daysAgo(6),
    isDemo: true,
  },
  {
    slug: "como-funcionan-los-destacados",
    kind: "anuncio",
    title: "Cómo elegimos a los artistas destacados",
    excerpt: "Transparencia editorial: qué es una recomendación y qué es un espacio patrocinado.",
    body: "Las recomendaciones editoriales las decide el equipo con criterios públicos y nunca se venden.\n\nLos espacios patrocinados existen, pero siempre aparecen con la etiqueta «Patrocinado» y el nombre de quien patrocina.\n\nNo modificamos estadísticas ni mostramos cifras que no podamos verificar.",
    authorId: admin!.id,
    status: "published",
    publishedAt: daysAgo(10),
    isDemo: true,
  },
]);

/* ------------------------------- Destacados ------------------------------ */
await db.insert(s.features).values([
  { artistId: art["luna-batey"]!.id, placement: "home_destacados", kind: "editorial", reason: "Selección editorial: propuesta de bachata con identidad propia.", createdBy: admin!.id },
  { artistId: art["nando-tambora"]!.id, placement: "home_destacados", kind: "editorial", reason: "Selección editorial: renovación del merengue típico.", createdBy: admin!.id },
  { artistId: art["colectivo-atabal-nuevo"]!.id, placement: "home_destacados", kind: "editorial", reason: "Selección editorial: fusión de raíces afrodominicanas.", createdBy: admin!.id },
  { artistId: art["dj-cabarete"]!.id, placement: "home_destacados", kind: "patrocinado", sponsorName: "Marca de ejemplo", reason: "Espacio patrocinado de demostración.", createdBy: admin!.id },
  { artistId: art["mia-cayena"]!.id, placement: "talento_semana", kind: "editorial", reason: "Talento de la semana (demo).", createdBy: admin!.id },
]);

/* ----------------------- Solicitud de contratación demo ------------------- */
const [booking] = await db
  .insert(s.bookingRequests)
  .values({
    artistId: art["luna-batey"]!.id,
    requesterId: promoter!.id,
    organization: "Eventos de ejemplo (demo)",
    eventType: "evento_privado",
    eventDate: dateIn(30),
    location: "Santiago de los Caballeros",
    budgetMin: 25000,
    budgetMax: 40000,
    details: "Solicitud ficticia de demostración: boda con 120 invitados, set acústico de 45 minutos.",
    status: "pending",
  })
  .returning();
await db.insert(s.bookingMessages).values({ bookingId: booking!.id, authorId: promoter!.id, body: "Hola, nos encantaría contar contigo. ¿Tienes disponibilidad esa fecha? (mensaje de demostración)" });

await client.end();
console.log("✔ Datos de demostración cargados");
console.log(`  Admin:     ${adminEmail} / ${process.env.SEED_ADMIN_PASSWORD ? "(SEED_ADMIN_PASSWORD)" : adminPassword}`);
console.log("  Artista:   artista@demo.local / DemoArtista2026!");
console.log("  Promotor:  promotor@demo.local / DemoPromotor2026!");
console.log("  Fan:       fan@demo.local / DemoFan2026!");
console.log("  Proveedor: proveedor@demo.local / DemoProveedor2026!");
