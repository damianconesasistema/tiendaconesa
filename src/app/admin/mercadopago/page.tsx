import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { CostosMercadoPago } from "@/components/admin/CostosMercadoPago";
import { getCostosMpDelPanel, getRecargosDelPanel } from "@/lib/settings";
import { sucursalDelPanel } from "@/lib/sucursal-panel";
import { cuandoFue, ultimoControlDeCuotas } from "@/lib/chequeo-diario";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mercado Pago · Panel" };

// Los costos de Mercado Pago de cada mes y lo que pagan los clientes en
// cuotas. Ver src/app/admin/mercadopago/actions.ts.
export default async function MercadoPagoPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [costos, recargos, local] = await Promise.all([
    getCostosMpDelPanel(),
    getRecargosDelPanel(),
    sucursalDelPanel(),
  ]);
  const { revisados, ...guardados } = costos;
  const ultimo = local ? await ultimoControlDeCuotas(local.slug) : null;
  const control = ultimo ? { cuando: cuandoFue(ultimo.fecha), texto: ultimo.texto, aviso: ultimo.nivel === "aviso" } : null;

  return (
    <AdminShell username={session.username} active="mercadopago">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
          Mercado Pago · Cuotas
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Lo que cobra Mercado Pago por cada plan de cuotas sin interés y lo que le queda de recargo al
          cliente. Mercado Pago los cambia mes a mes: cuando cambien, cargalos acá y los precios en cuotas
          de la tienda se ajustan solos.
          {local ? (
            <>
              {" "}
              Son los de la cuenta de <strong>{local.nombre}</strong>.
            </>
          ) : null}
        </p>
        <CostosMercadoPago
          guardados={guardados}
          revisados={revisados}
          recargoUnPago={recargos.unPago}
          local={local?.nombre ?? null}
          control={control}
        />
      </div>
    </AdminShell>
  );
}
