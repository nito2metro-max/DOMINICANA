import { eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { roleLabels } from "@/config/site";
import { PanelTitle } from "@/components/layout/panel-title";
import { Notice } from "@/components/ui/misc";
import { AccountForm, DeleteAccountForm, PasswordForm } from "@/components/panel/account-forms";

export default async function AccountPage() {
  const user = await requireUser();
  const [u] = await db.select({ marketingOptIn: users.marketingOptIn, createdAt: users.createdAt }).from(users).where(eq(users.id, user.id));
  return (
    <>
      <PanelTitle title="Cuenta y privacidad" description={`${user.email} · ${roleLabels[user.role]}`} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 font-bold">Datos de la cuenta</h2>
          <AccountForm name={user.name} marketingOptIn={u?.marketingOptIn ?? false} />
        </section>
        <section className="card p-6">
          <h2 className="mb-4 font-bold">Seguridad</h2>
          <PasswordForm />
        </section>
        <section className="card p-6">
          <h2 className="font-bold">Tus datos</h2>
          <p className="mt-2 text-sm text-muted">Descarga una copia de los datos personales asociados a tu cuenta en formato JSON.</p>
          <a href="/panel/cuenta/exportar" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
            <Download className="size-4" /> Descargar mis datos
          </a>
        </section>
        <section className="card border-rose-100 p-6">
          <h2 className="font-bold text-rose-700">Eliminar cuenta</h2>
          <Notice tone="warn" className="my-4">
            Se anonimizarán tus datos personales, se retirará tu perfil público y se cerrarán tus sesiones. Las solicitudes de contratación se conservan anonimizadas para
            el historial de la otra parte. Esta acción no se puede deshacer.
          </Notice>
          {user.role === "admin" ? <p className="text-sm text-muted">Las cuentas de administración se gestionan desde otro administrador.</p> : <DeleteAccountForm />}
        </section>
      </div>
    </>
  );
}
