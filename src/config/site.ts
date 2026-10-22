/**
 * Configuración central de la marca. Cambia aquí el nombre, eslogan y
 * datos de contacto: toda la interfaz los lee de este archivo.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Dominican Flow",
  shortName: "DFlow",
  tagline: "Más que música, una oportunidad",
  description:
    "Plataforma para descubrir nuevos talentos musicales de República Dominicana, impulsar sus carreras y conectarlos con oportunidades reales.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contactEmail: "hola@ejemplo.com", // TODO: reemplazar por el correo real antes del lanzamiento
  locale: "es-DO",
  currency: "DOP",
} as const;

export const provinces = [
  "Santo Domingo",
  "Distrito Nacional",
  "Santiago",
  "La Vega",
  "San Cristóbal",
  "Puerto Plata",
  "La Romana",
  "San Pedro de Macorís",
  "La Altagracia",
  "Duarte",
  "Espaillat",
  "Monseñor Nouel",
  "Peravia",
  "Azua",
  "Barahona",
  "Valverde",
  "Monte Plata",
  "Samaná",
  "Otra",
] as const;

export const linkPlatforms = [
  { id: "spotify", label: "Spotify" },
  { id: "apple_music", label: "Apple Music" },
  { id: "youtube", label: "YouTube" },
  { id: "audiomack", label: "Audiomack" },
  { id: "soundcloud", label: "SoundCloud" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "web", label: "Sitio web" },
] as const;

export const roleLabels = {
  fan: "Fan",
  artist: "Artista",
  provider: "Profesional / Proveedor",
  promoter: "Promotor / Cliente",
  admin: "Administrador",
} as const;

export const eventTypeLabels = {
  discoteca: "Discoteca",
  restaurante: "Restaurante",
  fiesta: "Organizador de fiestas",
  promotor: "Promotor",
  festival: "Festival",
  evento_privado: "Evento privado",
  marca: "Marca / Patrocinador",
  otro: "Otro",
} as const;

export const bookingStatusLabels = {
  pending: "Pendiente",
  negotiating: "Negociando",
  accepted: "Aceptada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
} as const;

export const opportunityTypeLabels = {
  convocatoria: "Convocatoria",
  concurso: "Concurso",
  showcase: "Showcase",
  colaboracion: "Colaboración",
  contratacion: "Contratación",
} as const;

export const postKindLabels = {
  entrevista: "Entrevista",
  talento_semana: "Talento de la semana",
  noticia: "Noticia",
  anuncio: "Anuncio",
} as const;

export const reportReasonLabels = {
  derechos_autor: "Infracción de derechos de autor",
  suplantacion: "Suplantación de identidad",
  contenido_inapropiado: "Contenido inapropiado",
  spam: "Spam o fraude",
  otro: "Otro motivo",
} as const;

export const releaseTypeLabels = { single: "Sencillo", ep: "EP", album: "Álbum", video: "Video" } as const;
