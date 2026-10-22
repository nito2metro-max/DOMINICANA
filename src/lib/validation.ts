import { z } from "zod";
import { selfServiceRoles } from "@/lib/auth/policies";
import { eventType, opportunityType, postKind, releaseType, mediaPlatform, reportReason, leadKind, featureKind, featurePlacement, publishStatus, serviceStatus } from "@/db/schema";

const trimmed = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label}: mínimo ${min} caracteres`).max(max, `${label}: máximo ${max} caracteres`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Correo electrónico no válido")).pipe(z.string().max(160));

export const passwordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres")
  .max(128, "La contraseña es demasiado larga")
  .regex(/[A-Za-z]/, "Incluye al menos una letra")
  .regex(/[0-9]/, "Incluye al menos un número");

const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .pipe(z.url("Enlace no válido"))
  .refine((u) => u.startsWith("https://"), "El enlace debe empezar por https://");

export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(httpsUrl.optional());

const optionalInt = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(String(v).replace(/[^\d]/g, ""))),
  z.number().int().min(0).max(100_000_000).optional(),
);

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida");

export const registerSchema = z.object({
  name: trimmed(2, 80, "Nombre"),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(selfServiceRoles, { message: "Selecciona un tipo de cuenta" }),
  acceptTerms: checkbox.refine((v) => v, "Debes aceptar los términos y la política de privacidad"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Introduce tu contraseña").max(128),
});

export const artistProfileSchema = z.object({
  stageName: trimmed(2, 60, "Nombre artístico"),
  genreId: z.uuid("Selecciona un género"),
  province: optionalText(60),
  city: optionalText(80),
  shortBio: trimmed(10, 160, "Descripción corta"),
  bio: z.string().trim().max(4000, "Biografía: máximo 4000 caracteres"),
  bookingEnabled: checkbox,
  isPublished: checkbox,
});

export const linkSchema = z.object({
  platform: z.enum(["spotify", "apple_music", "youtube", "audiomack", "soundcloud", "instagram", "tiktok", "web"]),
  url: httpsUrl,
});

export const releaseSchema = z.object({
  title: trimmed(1, 120, "Título"),
  type: z.enum(releaseType.enumValues),
  releaseDate: isoDate.optional().or(z.literal("").transform(() => undefined)),
  listenUrl: optionalUrl,
  description: z.string().trim().max(1000).default(""),
});

/** Solo se aceptan enlaces a plataformas oficiales; no se alojan archivos de audio. */
const officialHosts: Record<(typeof mediaPlatform.enumValues)[number], string[]> = {
  youtube: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
  spotify: ["open.spotify.com"],
  soundcloud: ["soundcloud.com", "on.soundcloud.com"],
  audiomack: ["audiomack.com"],
  apple_music: ["music.apple.com"],
  other: [],
};

export const mediaSchema = z
  .object({
    title: trimmed(2, 120, "Título"),
    platform: z.enum(mediaPlatform.enumValues),
    url: httpsUrl,
    rightsConfirmed: checkbox.refine((v) => v, "Debes confirmar que tienes los derechos o la autorización para publicar este contenido"),
  })
  .refine(
    (d) => {
      const hosts = officialHosts[d.platform];
      if (hosts.length === 0) return true;
      try {
        return hosts.includes(new URL(d.url).hostname);
      } catch {
        return false;
      }
    },
    { message: "El enlace no corresponde a la plataforma oficial seleccionada", path: ["url"] },
  );

export const bookingRequestSchema = z
  .object({
    eventType: z.enum(eventType.enumValues, { message: "Selecciona el tipo de evento" }),
    eventDate: isoDate,
    location: trimmed(3, 160, "Ubicación"),
    organization: optionalText(120),
    budgetMin: optionalInt,
    budgetMax: optionalInt,
    details: trimmed(20, 2000, "Detalles"),
  })
  .refine((d) => d.budgetMin == null || d.budgetMax == null || d.budgetMin <= d.budgetMax, {
    message: "El presupuesto mínimo no puede superar al máximo",
    path: ["budgetMax"],
  })
  .refine((d) => d.eventDate >= new Date().toISOString().slice(0, 10), {
    message: "La fecha del evento debe ser futura",
    path: ["eventDate"],
  });

export const bookingMessageSchema = z.object({ body: trimmed(1, 2000, "Mensaje") });

export const contactSchema = z.object({
  name: trimmed(2, 80, "Nombre"),
  email: emailSchema,
  message: trimmed(10, 2000, "Mensaje"),
});

export const leadSchema = contactSchema.extend({
  kind: z.enum(leadKind.enumValues),
  company: optionalText(120),
  phone: optionalText(30),
});

export const reportSchema = z.object({
  targetType: z.enum(["artist", "media", "release", "post"]),
  targetId: z.uuid(),
  reason: z.enum(reportReason.enumValues),
  details: trimmed(20, 3000, "Descripción"),
  reporterName: trimmed(2, 80, "Nombre"),
  reporterEmail: emailSchema,
  isRightsHolder: checkbox,
  goodFaith: checkbox.refine((v) => v, "Debes declarar que la denuncia se hace de buena fe"),
});

export const applicationSchema = z.object({ message: trimmed(20, 1500, "Mensaje") });

export const verificationSchema = z.object({ evidence: trimmed(20, 1500, "Evidencia") });

export const accountSchema = z.object({ name: trimmed(2, 80, "Nombre"), marketingOptIn: checkbox });

export const changePasswordSchema = z.object({ current: z.string().min(1).max(128), next: passwordSchema });

/* ---------------------------- Administración ---------------------------- */

export const serviceAdminSchema = z.object({
  title: trimmed(3, 100, "Título"),
  category: trimmed(2, 60, "Categoría"),
  summary: trimmed(10, 200, "Resumen"),
  description: trimmed(20, 4000, "Descripción"),
  deliverables: z
    .string()
    .max(3000)
    .transform((s) =>
      s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 20),
    ),
  priceFrom: optionalInt,
  currency: z.enum(["DOP", "USD"]),
  priceIsDemo: checkbox,
  providerId: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
  status: z.enum(serviceStatus.enumValues),
  icon: z.string().trim().max(40).default("sparkles"),
  sortOrder: optionalInt.transform((v) => v ?? 0),
});

export const providerAdminSchema = z.object({
  name: trimmed(2, 100, "Nombre"),
  description: z.string().trim().max(1000).default(""),
  contactEmail: z.preprocess((v) => (v === "" ? undefined : v), emailSchema.optional()),
  website: optionalUrl,
  isActive: checkbox,
});

export const opportunityAdminSchema = z
  .object({
    title: trimmed(3, 140, "Título"),
    type: z.enum(opportunityType.enumValues),
    organizer: trimmed(2, 100, "Organizador"),
    summary: trimmed(10, 240, "Resumen"),
    description: trimmed(20, 5000, "Descripción"),
    rules: z.string().trim().max(5000).default(""),
    location: optionalText(120),
    deadline: isoDate.optional().or(z.literal("").transform(() => undefined)),
    isSponsored: checkbox,
    sponsorName: optionalText(100),
    status: z.enum(publishStatus.enumValues),
  })
  .refine((d) => !d.isSponsored || !!d.sponsorName, { message: "Indica el patrocinador", path: ["sponsorName"] })
  .refine((d) => d.type !== "concurso" || d.rules.length >= 40 || d.status !== "published", {
    message: "Un concurso publicado debe incluir reglas transparentes (mínimo 40 caracteres)",
    path: ["rules"],
  });

export const eventAdminSchema = z
  .object({
    title: trimmed(3, 140, "Título"),
    kind: trimmed(2, 40, "Tipo"),
    startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Fecha y hora no válidas"),
    venue: trimmed(2, 120, "Lugar"),
    city: trimmed(2, 80, "Ciudad"),
    description: trimmed(10, 4000, "Descripción"),
    ticketUrl: optionalUrl,
    isSponsored: checkbox,
    sponsorName: optionalText(100),
    status: z.enum(publishStatus.enumValues),
  })
  .refine((d) => !d.isSponsored || !!d.sponsorName, { message: "Indica el patrocinador", path: ["sponsorName"] });

export const postAdminSchema = z
  .object({
    title: trimmed(3, 160, "Título"),
    kind: z.enum(postKind.enumValues),
    excerpt: trimmed(10, 300, "Extracto"),
    body: trimmed(20, 20000, "Contenido"),
    artistId: z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional()),
    isSponsored: checkbox,
    sponsorName: optionalText(100),
    status: z.enum(publishStatus.enumValues),
  })
  .refine((d) => !d.isSponsored || !!d.sponsorName, { message: "Indica el patrocinador", path: ["sponsorName"] });

export const featureAdminSchema = z
  .object({
    artistId: z.uuid("Selecciona un artista"),
    placement: z.enum(featurePlacement.enumValues),
    kind: z.enum(featureKind.enumValues),
    sponsorName: optionalText(100),
    reason: trimmed(10, 300, "Motivo editorial"),
    endsAt: isoDate.optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((d) => d.kind !== "patrocinado" || !!d.sponsorName, {
    message: "Un espacio patrocinado debe indicar quién lo patrocina",
    path: ["sponsorName"],
  });

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = { ok?: boolean; message?: string; errors?: FieldErrors } | undefined;

export function formToObject(fd: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export function zodErrors(err: z.ZodError): FieldErrors {
  return z.flattenError(err).fieldErrors as FieldErrors;
}
