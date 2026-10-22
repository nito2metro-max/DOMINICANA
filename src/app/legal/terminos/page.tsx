import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Términos de uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Términos de uso" updated="borrador v0.1">
      <h2>1. Objeto</h2>
      <p>{siteConfig.name} es una plataforma para descubrir artistas, gestionar perfiles, solicitar información sobre servicios de terceros y facilitar el contacto para contrataciones.</p>
      <h2>2. Cuentas</h2>
      <p>El registro básico es gratuito. Eres responsable de la veracidad de tus datos y de la confidencialidad de tu contraseña. No se permite suplantar a otras personas o artistas.</p>
      <h2>3. Contenido publicado</h2>
      <p>Solo puedes publicar contenido sobre el que tengas derechos o autorización. Al publicar un enlace o reproductor, declaras contar con dichos permisos. La plataforma no aloja ni distribuye archivos de audio: utiliza enlaces y reproductores oficiales.</p>
      <h2>4. Contrataciones</h2>
      <p>La plataforma facilita la comunicación entre las partes. Una solicitud aceptada no constituye un contrato ni una reserva confirmada. Los acuerdos económicos y contractuales se celebran directamente entre artista y cliente. En esta versión no se procesan pagos.</p>
      <h2>5. Servicios de terceros</h2>
      <p>Los servicios profesionales los prestan proveedores independientes. Los precios mostrados como «demo» son ilustrativos.</p>
      <h2>6. Contenido patrocinado</h2>
      <p>Toda promoción pagada se identifica como «Patrocinado». Las selecciones editoriales no se venden.</p>
      <h2>7. Suspensión</h2>
      <p>Podemos suspender cuentas que incumplan estos términos, previa revisión.</p>
    </LegalPage>
  );
}
