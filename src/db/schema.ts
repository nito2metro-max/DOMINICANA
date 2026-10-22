import {
  pgTable,
  pgEnum,
  text,
  uuid,
  timestamp,
  boolean,
  integer,
  date,
  uniqueIndex,
  index,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const userRole = pgEnum("user_role", ["fan", "artist", "provider", "promoter", "admin"]);
export const userStatus = pgEnum("user_status", ["active", "suspended", "deleted"]);
export const verificationStatus = pgEnum("verification_status", ["none", "pending", "verified", "rejected"]);
export const releaseType = pgEnum("release_type", ["single", "ep", "album", "video"]);
export const mediaStatus = pgEnum("media_status", ["published", "under_review", "removed"]);
export const mediaPlatform = pgEnum("media_platform", ["youtube", "spotify", "soundcloud", "audiomack", "apple_music", "other"]);
export const serviceStatus = pgEnum("service_status", ["active", "coming_soon", "hidden"]);
export const inquiryStatus = pgEnum("inquiry_status", ["new", "contacted", "closed"]);
export const bookingStatus = pgEnum("booking_status", ["pending", "negotiating", "accepted", "rejected", "cancelled"]);
export const eventType = pgEnum("event_type", [
  "discoteca",
  "restaurante",
  "fiesta",
  "promotor",
  "festival",
  "evento_privado",
  "marca",
  "otro",
]);
export const opportunityType = pgEnum("opportunity_type", ["convocatoria", "concurso", "showcase", "colaboracion", "contratacion"]);
export const publishStatus = pgEnum("publish_status", ["draft", "published", "archived"]);
export const postKind = pgEnum("post_kind", ["entrevista", "talento_semana", "noticia", "anuncio"]);
export const featureKind = pgEnum("feature_kind", ["editorial", "patrocinado"]);
export const featurePlacement = pgEnum("feature_placement", ["home_destacados", "talento_semana"]);
export const reportReason = pgEnum("report_reason", ["derechos_autor", "suplantacion", "contenido_inapropiado", "spam", "otro"]);
export const reportStatus = pgEnum("report_status", ["open", "reviewing", "actioned", "dismissed"]);
export const applicationStatus = pgEnum("application_status", ["submitted", "shortlisted", "selected", "declined", "withdrawn"]);
export const leadKind = pgEnum("lead_kind", ["marca", "patrocinador", "promotor", "negocio", "otro"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ------------------------------------------------------------------ */
/* Usuarios y sesiones                                                 */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: userRole("role").notNull().default("fan"),
    status: userStatus("status").notNull().default("active"),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256 del token; el token en claro solo vive en la cookie
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/* ------------------------------------------------------------------ */
/* Catálogo musical                                                    */
/* ------------------------------------------------------------------ */

export const genres = pgTable("genres", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("blue"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const artists = pgTable(
  "artists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    stageName: text("stage_name").notNull(),
    genreId: uuid("genre_id").references(() => genres.id, { onDelete: "set null" }),
    province: text("province"),
    city: text("city"),
    shortBio: text("short_bio").notNull().default(""),
    bio: text("bio").notNull().default(""),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    bookingEnabled: boolean("booking_enabled").notNull().default(true),
    isPublished: boolean("is_published").notNull().default(false),
    verification: verificationStatus("verification").notNull().default("none"),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("artists_slug_idx").on(t.slug),
    uniqueIndex("artists_user_idx").on(t.userId),
    index("artists_genre_idx").on(t.genreId),
  ],
);

export const artistLinks = pgTable("artist_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const releases = pgTable(
  "releases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: releaseType("type").notNull().default("single"),
    releaseDate: date("release_date"),
    coverUrl: text("cover_url"),
    listenUrl: text("listen_url"), // enlace a plataforma oficial
    description: text("description").notNull().default(""),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("releases_artist_idx").on(t.artistId)],
);

/** Contenido multimedia: solo enlaces/embeds oficiales con confirmación de derechos. */
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    platform: mediaPlatform("platform").notNull(),
    url: text("url").notNull(),
    rightsConfirmed: boolean("rights_confirmed").notNull(),
    rightsConfirmedAt: timestamp("rights_confirmed_at", { withTimezone: true }),
    status: mediaStatus("status").notNull().default("published"),
    removalReason: text("removal_reason"),
    isDemo: boolean("is_demo").notNull().default(false),
    ...timestamps,
  },
  (t) => [index("media_artist_idx").on(t.artistId)],
);

export const follows = pgTable(
  "follows",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.artistId] }), index("follows_artist_idx").on(t.artistId)],
);

/** Visitas de perfil agregadas por día (métrica propia de la plataforma, sin datos personales). */
export const profileViews = pgTable(
  "profile_views",
  {
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.artistId, t.day] })],
);

export const verificationRequests = pgTable("verification_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  evidence: text("evidence").notNull(),
  status: verificationStatus("status").notNull().default("pending"),
  reviewerNote: text("reviewer_note"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Servicios profesionales                                             */
/* ------------------------------------------------------------------ */

export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  contactEmail: text("contact_email"),
  website: text("website"),
  isActive: boolean("is_active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  deliverables: jsonb("deliverables").$type<string[]>().notNull().default([]),
  priceFrom: integer("price_from"), // en la moneda indicada; null = a consultar
  currency: text("currency").notNull().default("DOP"),
  priceIsDemo: boolean("price_is_demo").notNull().default(true),
  providerId: uuid("provider_id").references(() => providers.id, { onDelete: "set null" }),
  status: serviceStatus("status").notNull().default("coming_soon"),
  icon: text("icon").notNull().default("sparkles"),
  sortOrder: integer("sort_order").notNull().default(0),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const serviceInquiries = pgTable("service_inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  serviceId: uuid("service_id")
    .notNull()
    .references(() => services.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: inquiryStatus("status").notNull().default("new"),
  ...timestamps,
});

/* ------------------------------------------------------------------ */
/* Contrataciones                                                      */
/* ------------------------------------------------------------------ */

export const bookingRequests = pgTable(
  "booking_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organization: text("organization"),
    eventType: eventType("event_type").notNull(),
    eventDate: date("event_date").notNull(),
    location: text("location").notNull(),
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),
    currency: text("currency").notNull().default("DOP"),
    details: text("details").notNull().default(""),
    status: bookingStatus("status").notNull().default("pending"),
    ...timestamps,
  },
  (t) => [index("booking_artist_idx").on(t.artistId), index("booking_requester_idx").on(t.requesterId)],
);

export const bookingMessages = pgTable(
  "booking_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookingRequests.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    // Registro de cambio de estado (null si es un mensaje normal)
    statusChange: bookingStatus("status_change"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("booking_messages_booking_idx").on(t.bookingId)],
);

/* ------------------------------------------------------------------ */
/* Oportunidades, eventos y editorial                                  */
/* ------------------------------------------------------------------ */

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  type: opportunityType("type").notNull(),
  title: text("title").notNull(),
  organizer: text("organizer").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  rules: text("rules").notNull().default(""),
  location: text("location"),
  deadline: date("deadline"),
  genreId: uuid("genre_id").references(() => genres.id, { onDelete: "set null" }),
  isSponsored: boolean("is_sponsored").notNull().default(false),
  sponsorName: text("sponsor_name"),
  status: publishStatus("status").notNull().default("draft"),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const opportunityApplications = pgTable(
  "opportunity_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunities.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    status: applicationStatus("status").notNull().default("submitted"),
    ...timestamps,
  },
  (t) => [uniqueIndex("applications_unique_idx").on(t.opportunityId, t.artistId)],
);

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("showcase"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  venue: text("venue").notNull(),
  city: text("city").notNull(),
  description: text("description").notNull(),
  ticketUrl: text("ticket_url"),
  isSponsored: boolean("is_sponsored").notNull().default(false),
  sponsorName: text("sponsor_name"),
  status: publishStatus("status").notNull().default("draft"),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  kind: postKind("kind").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  artistId: uuid("artist_id").references(() => artists.id, { onDelete: "set null" }),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  isSponsored: boolean("is_sponsored").notNull().default(false),
  sponsorName: text("sponsor_name"),
  status: publishStatus("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

/**
 * Selección editorial y espacios patrocinados. Separar `kind` garantiza que
 * toda promoción pagada se muestre etiquetada y nunca como recomendación independiente.
 */
export const features = pgTable("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  placement: featurePlacement("placement").notNull(),
  kind: featureKind("kind").notNull(),
  sponsorName: text("sponsor_name"),
  reason: text("reason").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Denuncias, contactos y auditoría                                    */
/* ------------------------------------------------------------------ */

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  targetType: text("target_type").notNull(), // artist | media | release | post
  targetId: uuid("target_id").notNull(),
  reason: reportReason("reason").notNull(),
  details: text("details").notNull(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reporterName: text("reporter_name").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  isRightsHolder: boolean("is_rights_holder").notNull().default(false),
  status: reportStatus("status").notNull().default("open"),
  resolution: text("resolution"),
  ...timestamps,
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: leadKind("kind").notNull(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  status: inquiryStatus("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Genre = typeof genres.$inferSelect;
export type Release = typeof releases.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Provider = typeof providers.$inferSelect;
export type BookingRequest = typeof bookingRequests.$inferSelect;
export type Opportunity = typeof opportunities.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Feature = typeof features.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type Role = (typeof userRole.enumValues)[number];
export type BookingStatus = (typeof bookingStatus.enumValues)[number];
