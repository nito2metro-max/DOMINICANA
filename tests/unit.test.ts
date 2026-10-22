import { describe, expect, it } from "vitest";
import { allowedBookingTransitions, canEditArtist, canRequestBooking, canTransitionBooking, bookingPartyOf } from "@/lib/auth/policies";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { bookingRequestSchema, featureAdminSchema, mediaSchema, opportunityAdminSchema, registerSchema, serviceAdminSchema } from "@/lib/validation";
import { sniffImage } from "@/lib/storage";
import { toEmbedUrl } from "@/lib/embeds";
import { slugify } from "@/lib/utils";

const artistUser = { id: "a", role: "artist" as const, status: "active" as const };
const other = { id: "b", role: "artist" as const, status: "active" as const };
const admin = { id: "z", role: "admin" as const, status: "active" as const };
const promoter = { id: "p", role: "promoter" as const, status: "active" as const };

describe("políticas de autorización", () => {
  it("solo el dueño o un admin pueden editar un perfil de artista", () => {
    expect(canEditArtist(artistUser, { userId: "a" })).toBe(true);
    expect(canEditArtist(other, { userId: "a" })).toBe(false);
    expect(canEditArtist(admin, { userId: "a" })).toBe(true);
    expect(canEditArtist(null, { userId: "a" })).toBe(false);
    expect(canEditArtist({ ...artistUser, status: "suspended" }, { userId: "a" })).toBe(false);
  });

  it("no se puede solicitar contratación a perfiles ocultos, sin contratación o a uno mismo", () => {
    const a = { userId: "a", bookingEnabled: true, isPublished: true };
    expect(canRequestBooking(promoter, a)).toBe(true);
    expect(canRequestBooking(artistUser, a)).toBe(false);
    expect(canRequestBooking(promoter, { ...a, bookingEnabled: false })).toBe(false);
    expect(canRequestBooking(promoter, { ...a, isPublished: false })).toBe(false);
    expect(canRequestBooking(null, a)).toBe(false);
  });

  it("identifica la parte de una solicitud", () => {
    expect(bookingPartyOf(artistUser, { requesterId: "p" }, "a")).toBe("artist");
    expect(bookingPartyOf(promoter, { requesterId: "p" }, "a")).toBe("requester");
    expect(bookingPartyOf(admin, { requesterId: "p" }, "a")).toBe("admin");
    expect(bookingPartyOf(other, { requesterId: "p" }, "a")).toBeNull();
  });

  it("máquina de estados de contratación", () => {
    expect(canTransitionBooking("artist", "pending", "negotiating")).toBe(true);
    expect(canTransitionBooking("artist", "pending", "accepted")).toBe(true);
    expect(canTransitionBooking("requester", "pending", "accepted")).toBe(false);
    expect(canTransitionBooking("requester", "pending", "cancelled")).toBe(true);
    expect(canTransitionBooking("artist", "pending", "cancelled")).toBe(false);
    expect(canTransitionBooking("artist", "rejected", "accepted")).toBe(false);
    expect(canTransitionBooking("admin", "accepted", "cancelled")).toBe(true);
    expect(canTransitionBooking(null, "pending", "negotiating")).toBe(false);
    expect(allowedBookingTransitions("requester", "negotiating")).toEqual(["cancelled"]);
    expect(allowedBookingTransitions("artist", "cancelled")).toEqual([]);
  });
});

describe("contraseñas", () => {
  it("hash con sal y verificación", async () => {
    const h1 = await hashPassword("Secreta12345");
    const h2 = await hashPassword("Secreta12345");
    expect(h1).not.toEqual(h2);
    expect(h1).not.toContain("Secreta12345");
    expect(await verifyPassword("Secreta12345", h1)).toBe(true);
    expect(await verifyPassword("otra", h1)).toBe(false);
    expect(await verifyPassword("x", "basura")).toBe(false);
  });
});

describe("validación", () => {
  it("registro: contraseña fuerte, términos y rol permitido (nunca admin)", () => {
    const base = { name: "Ana", email: "ANA@Mail.com", password: "abcde12345", role: "artist", acceptTerms: "on" };
    const ok = registerSchema.safeParse(base);
    expect(ok.success && ok.data.email).toBe("ana@mail.com");
    expect(registerSchema.safeParse({ ...base, password: "corta1" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, acceptTerms: undefined }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, role: "admin" }).success).toBe(false);
  });

  it("contenido multimedia: plataforma oficial y confirmación de derechos", () => {
    const m = { title: "Video", platform: "youtube", url: "https://www.youtube.com/watch?v=abcdefghijk", rightsConfirmed: "on" };
    expect(mediaSchema.safeParse(m).success).toBe(true);
    expect(mediaSchema.safeParse({ ...m, rightsConfirmed: undefined }).success).toBe(false);
    expect(mediaSchema.safeParse({ ...m, url: "https://descargas-piratas.example/x.mp3" }).success).toBe(false);
    expect(mediaSchema.safeParse({ ...m, url: "http://www.youtube.com/watch?v=abc" }).success).toBe(false);
  });

  it("solicitud de contratación: fecha futura y presupuesto coherente", () => {
    const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    const b = { eventType: "discoteca", eventDate: future, location: "Santiago", details: "Fiesta de aniversario del local, set de una hora." };
    expect(bookingRequestSchema.safeParse(b).success).toBe(true);
    expect(bookingRequestSchema.safeParse({ ...b, eventDate: "2020-01-01" }).success).toBe(false);
    expect(bookingRequestSchema.safeParse({ ...b, budgetMin: "50000", budgetMax: "10000" }).success).toBe(false);
    const parsed = bookingRequestSchema.parse({ ...b, budgetMin: "RD$ 20,000" });
    expect(parsed.budgetMin).toBe(20000);
  });

  it("patrocinios siempre identificados y concursos con reglas", () => {
    const f = { artistId: "8c4d2f2e-5b7e-4b8e-9b0e-2d0a1f6f3c11", placement: "home_destacados", kind: "patrocinado", reason: "Campaña de verano" };
    expect(featureAdminSchema.safeParse(f).success).toBe(false);
    expect(featureAdminSchema.safeParse({ ...f, sponsorName: "Marca" }).success).toBe(true);
    const o = { title: "Concurso", type: "concurso", organizer: "Org", summary: "Resumen del concurso", description: "Descripción larga del concurso de prueba", rules: "", status: "published" };
    expect(opportunityAdminSchema.safeParse(o).success).toBe(false);
    expect(opportunityAdminSchema.safeParse({ ...o, rules: "Criterios: originalidad 50%, interpretación 50%. Jurado de tres personas." }).success).toBe(true);
  });

  it("servicios: entregables por línea y precio opcional", () => {
    const s = serviceAdminSchema.parse({
      title: "Portadas",
      category: "Diseño",
      summary: "Resumen del servicio",
      description: "Descripción suficientemente larga",
      deliverables: "Uno\n\n Dos ",
      priceFrom: "",
      currency: "DOP",
      status: "coming_soon",
    });
    expect(s.deliverables).toEqual(["Uno", "Dos"]);
    expect(s.priceFrom).toBeUndefined();
    expect(s.priceIsDemo).toBe(false);
  });
});

describe("utilidades", () => {
  it("detecta imágenes por su firma real", () => {
    expect(sniffImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.ext).toBe("jpg");
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext).toBe("png");
    expect(sniffImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
  it("solo incrusta reproductores oficiales", () => {
    expect(toEmbedUrl("youtube", "https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(toEmbedUrl("spotify", "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC")).toBe("https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC");
    expect(toEmbedUrl("youtube", "https://evil.example/watch?v=x")).toBeNull();
    expect(toEmbedUrl("other", "https://example.com")).toBeNull();
  });
  it("slugify", () => {
    expect(slugify("Ñandú Típico  del Cibao!")).toBe("nandu-tipico-del-cibao");
  });
});
