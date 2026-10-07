import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RecargosForm } from "@/components/admin/RecargosForm";
import { getRecargosMp } from "@/lib/settings";
import { MP_CONFIGURED, MP_IS_TEST } from "@/lib/mercadopago";

export const metadata: Metadata = {
  title: "Configuración · Panel Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const recargos = await getRecargosMp();

  return (
    <AdminShell username={session.username} active="configuracion">
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Configuración
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Recargos por pago con tarjeta y cuotas.
      </p>

      <div className="mt-6 max-w-2xl space-y-6">
        {/* Estado de MercadoPago */}
        <div
          className={`rounded-2xl border p-4 text-sm ${
            !MP_CONFIGURED
              ? "border-red-200 bg-red-50 text-red-900"
              : MP_IS_TEST
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-green-200 bg-green-50 text-green-900"
          }`}
        >
          {!MP_CONFIGURED ? (
            <>
              <strong>MercadoPago está apagado.</strong> Falta cargar
              MP_ACCESS_TOKEN en Railway. Los clientes solo pueden coordinar por
              WhatsApp.
            </>
          ) : MP_IS_TEST ? (
            <>
              <strong>MercadoPago en modo PRUEBA.</strong> Los pagos no son
              reales. Para cobrar de verdad, cambiá MP_ACCESS_TOKEN en Railway
              por el de producción (empieza con APP_USR-).
            </>
          ) : (
            <>
              <strong>MercadoPago en PRODUCCIÓN.</strong> Los pagos son reales y
              se acreditan en tu cuenta.
            </>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="font-display text-lg font-black uppercase tracking-wider">
            Recargos por tarjeta
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Los precios de la tienda son de <strong>contado</strong>.
            MercadoPago te cobra una comisión por cada venta, así que acá
            definís cuánto se le suma al cliente según cómo pague. Si ponés
            0% lo absorbés vos.
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            El cliente ve el recargo desglosado <strong>antes</strong> de pagar,
            y en MercadoPago solo va a poder pagar en la cantidad de cuotas que
            eligió acá.
          </p>

          <div className="mt-5">
            <RecargosForm
              unPago={recargos.unPago}
              cuotas={recargos.cuotas}
              cuotasMax={recargos.cuotasMax}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
