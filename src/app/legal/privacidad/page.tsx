import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" updated="borrador v0.1">
      <h2>Datos que recogemos</h2>
      <ul>
        <li>Cuenta: nombre, correo electrónico y contraseña (almacenada solo como hash scrypt, nunca en texto plano).</li>
        <li>Perfil de artista: la información que decides publicar.</li>
        <li>Solicitudes y mensajes de contratación entre las partes.</li>
        <li>Métricas agregadas de visitas a perfiles (sin identificar a quién visita).</li>
      </ul>
      <h2>Para qué los usamos</h2>
      <p>Para prestar el servicio, permitir el contacto entre partes, prevenir abusos y, solo si lo autorizas, enviarte novedades.</p>
      <h2>Con quién se comparten</h2>
      <p>Tu correo solo se comparte con un artista cuando una solicitud tuya pasa a negociación. No vendemos datos personales.</p>
      <h2>Tus derechos</h2>
      <p>Desde «Cuenta y privacidad» puedes descargar tus datos, cambiar tus preferencias y eliminar tu cuenta. La eliminación anonimiza tus datos personales y retira tu perfil público.</p>
      <h2>Cookies</h2>
      <p>Usamos una única cookie técnica de sesión, imprescindible para iniciar sesión. No usamos cookies publicitarias.</p>
    </LegalPage>
  );
}
