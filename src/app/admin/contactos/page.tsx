import { requireAdmin } from "@/lib/auth/session";
import { adminListInquiries, adminListLeads } from "@/server/admin";
import { setInquiryStatusAction } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/utils";
import { PanelTitle } from "@/components/layout/panel-title";
import { Badge } from "@/components/ui/badge";

const st = { new: ["Nuevo", "warn"], contacted: ["Contactado", "brand"], closed: ["Cerrado", "neutral"] } as const;

function StatusForm({ id, kind, current }: { id: string; kind: "lead" | "inquiry"; current: "new" | "contacted" | "closed" }) {
  return (
    <form action={setInquiryStatusAction} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <select name="status" defaultValue={current} className="h-8 rounded-lg border border-line bg-white px-2 text-sm" aria-label="Estado">
        <option value="new">Nuevo</option>
        <option value="contacted">Contactado</option>
        <option value="closed">Cerrado</option>
      </select>
      <button className="text-xs font-semibold text-brand-600">OK</button>
    </form>
  );
}

export default async function AdminContacts() {
  const admin = await requireAdmin();
  const [inq, leads] = await Promise.all([adminListInquiries(admin), adminListLeads(admin)]);
  return (
    <>
      <PanelTitle title="Contactos" description="Solicitudes de información de servicios y mensajes de marcas, patrocinadores y negocios." />
      <h2 className="mb-3 text-lg font-bold">Solicitudes de servicios ({inq.length})</h2>
      <ul className="space-y-3">
        {inq.length === 0 && <li className="card p-5 text-muted">Sin solicitudes.</li>}
        {inq.map(({ inq: i, serviceTitle }) => (
          <li key={i.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {serviceTitle} · {i.name} &lt;{i.email}&gt;
              </p>
              <div className="flex items-center gap-2">
                <Badge tone={st[i.status][1]}>{st[i.status][0]}</Badge>
                <StatusForm id={i.id} kind="inquiry" current={i.status} />
              </div>
            </div>
            <p className="mt-2 text-sm text-ink-2">{i.message}</p>
            <p className="mt-1 text-xs text-muted">{formatDateTime(i.createdAt)}</p>
          </li>
        ))}
      </ul>
      <h2 className="mb-3 mt-10 text-lg font-bold">Marcas y negocios ({leads.length})</h2>
      <ul className="space-y-3">
        {leads.length === 0 && <li className="card p-5 text-muted">Sin mensajes.</li>}
        {leads.map((l) => (
          <li key={l.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {l.kind} · {l.name}
                {l.company ? ` (${l.company})` : ""} &lt;{l.email}&gt;
              </p>
              <div className="flex items-center gap-2">
                <Badge tone={st[l.status][1]}>{st[l.status][0]}</Badge>
                <StatusForm id={l.id} kind="lead" current={l.status} />
              </div>
            </div>
            <p className="mt-2 text-sm text-ink-2">{l.message}</p>
            <p className="mt-1 text-xs text-muted">{formatDateTime(l.createdAt)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
