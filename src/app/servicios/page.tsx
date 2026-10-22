import type { Metadata } from "next";
import { Info } from "lucide-react";
import { listServices, serviceAvailability } from "@/server/catalog";
import { PageHeader, Notice } from "@/components/ui/misc";
import { ServiceCard } from "@/components/cards/service-card";

export const metadata: Metadata = { title: "Servicios para artistas", description: "Diseño, promoción, producción y distribución con proveedores aliados." };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const services = await listServices();
  const categories = [...new Set(services.map((s) => s.service.category))];
  return (
    <>
      <PageHeader
        eyebrow="Impulsa tu carrera"
        title="Servicios profesionales"
        description="Herramientas y profesionales para cada etapa: desde la portada de tu sencillo hasta la estrategia de lanzamiento."
      />
      <div className="container-page py-10">
        <Notice tone="info" className="mb-8">
          <span className="flex gap-2">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Los servicios los prestan <strong>proveedores aliados</strong>, no la plataforma directamente. Los marcados como «Próximamente» aún no tienen proveedor:
              puedes registrar tu interés y te avisaremos. Los precios marcados como «precio demo» son orientativos y ficticios. No se procesan pagos en línea.
            </span>
          </span>
        </Notice>
        {categories.map((cat) => (
          <section key={cat} className="mb-10">
            <h2 className="mb-4 text-lg font-bold">{cat}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services
                .filter((s) => s.service.category === cat)
                .map(({ service, providerActive }, i) => (
                  <ServiceCard key={service.id} service={service} index={i} available={serviceAvailability(service, providerActive) === "disponible"} />
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
