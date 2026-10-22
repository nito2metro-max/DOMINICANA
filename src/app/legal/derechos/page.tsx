import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Derechos de autor y retirada de contenido" };

export default function RightsPage() {
  return (
    <LegalPage title="Derechos de autor y retirada de contenido" updated="borrador v0.1">
      <h2>Nuestro compromiso</h2>
      <ul>
        <li>No alojamos ni distribuimos archivos de música: solo enlaces y reproductores oficiales (YouTube, Spotify, etc.).</li>
        <li>Al publicar contenido, el artista confirma que tiene los derechos o la autorización necesaria. Guardamos la fecha de esa confirmación.</li>
        <li>Los enlaces a plataformas no reconocidas quedan en revisión antes de mostrarse.</li>
      </ul>
      <h2>Proceso de retirada</h2>
      <ol className="mb-4 list-decimal space-y-1 pl-5 text-ink-2">
        <li>El titular (o su representante) usa el enlace «Reportar» del contenido e identifica la obra y el material infractor.</li>
        <li>El equipo registra la denuncia, la revisa y puede retirar el contenido de forma preventiva.</li>
        <li>Si procede, el contenido se retira y se informa al usuario que lo publicó, quien puede presentar una contranotificación.</li>
        <li>Las infracciones reiteradas conllevan la suspensión de la cuenta.</li>
      </ol>
      <p>Todas las decisiones quedan registradas en el historial de auditoría de la administración.</p>
    </LegalPage>
  );
}
