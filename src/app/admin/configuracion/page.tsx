import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { RecargosForm } from "@/components/admin/RecargosForm";
import { getRecargosMp } from "@/lib/settings";
import {
  mpConfigurado,
  mpEsPrueba,
  mpClavePropia,
  mpNombreDeVariable,
} from "@/lib/mercadopago";
import { prisma } from "@/lib/db";
import { emailConfigurado } from "@/lib/email";
import { ProbarArca } from "@/components/admin/ProbarArca";
import { afipConfigurado, esProduccion, puntoVenta } from "@/lib/afip/config";

export const metadata: Metadata = {
  title: "Configuración · Panel Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const recargos = await getRecargosMp();

  // Cada local cobra en su cuenta, asi que el estado de MercadoPago no es uno
  // solo: hay que mirarlo sucursal por sucursal.
  const sucursales = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { orden: "asc" },
    select: { slug: true, name: true, tiendaActiva: true },
  });

  // Cuantas tiendas estan abiertas. Mientras sea una sola, que use la clave
  // general del servidor no es un problema: esa cuenta es la suya. El dia
  // que haya dos abiertas y una no tenga clave propia, si lo es, porque las
  // dos estarian cobrando en la misma cuenta.
  const abiertas = sucursales.filter((s) => s.tiendaActiva).length;

  return (
    <AdminShell username={session.username} active="configuracion">
      <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
        Configuración
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Recargos por pago con tarjeta y cuotas.
      </p>

      <div className="mt-6 max-w-2xl space-y-6">
        {/* Estado de MercadoPago, una tarjeta por sucursal.
            Un cartel solo para las dos haria creer que esta todo andando
            cuando anda la mitad. */}
        {sucursales.map((suc) => {
          const anda = mpConfigurado(suc.slug);
          const prueba = mpEsPrueba(suc.slug);
          const propia = mpClavePropia(suc.slug);
          return (
            <div
              key={suc.slug}
              className={`rounded-2xl border p-4 text-sm ${
                !anda || (!propia && abiertas > 1)
                  ? "border-red-200 bg-red-50 text-red-900"
                  : prueba || !propia
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-green-200 bg-green-50 text-green-900"
              }`}
            >
              {!anda ? (
                <>
                  <strong>{suc.name}: MercadoPago apagado.</strong> Falta
                  cargar <code>{mpNombreDeVariable(suc.slug)}</code> en el
                  servidor. Los clientes de esta tienda solo pueden coordinar
                  por WhatsApp.
                </>
              ) : !propia && abiertas > 1 ? (
                <>
                  <strong>
                    {suc.name}: está cobrando en una cuenta que no es la suya.
                  </strong>{" "}
                  No tiene clave propia, así que usa la general
                  (MP_ACCESS_TOKEN), y hay otra tienda abierta cobrando con la
                  misma: la plata de las dos entra junta, a nombre de uno
                  solo. Cargá <code>{mpNombreDeVariable(suc.slug)}</code> en el
                  servidor con el access token de SU cuenta.
                </>
              ) : !propia ? (
                <>
                  <strong>{suc.name}: usa la clave general.</strong> Cobra con
                  MP_ACCESS_TOKEN, que es la de siempre. Mientras sea la única
                  tienda abierta está bien. Antes de abrir la otra hay que
                  cargar <code>{mpNombreDeVariable(suc.slug)}</code> con el
                  access token de su propia cuenta, o las dos van a cobrar
                  en la misma.
                </>
              ) : prueba ? (
                <>
                  <strong>{suc.name}: MercadoPago en modo PRUEBA.</strong> Los
                  pagos no son reales. Para cobrar de verdad, cambiá{" "}
                  <code>{mpNombreDeVariable(suc.slug)}</code> por el de
                  producción (empieza con APP_USR-).
                </>
              ) : (
                <>
                  <strong>{suc.name}: MercadoPago en PRODUCCIÓN.</strong> Los
                  pagos son reales y se acreditan en su cuenta.
                </>
              )}
            </div>
          );
        })}

        {/* Estado del correo */}
        <div
          className={`rounded-2xl border p-4 text-sm ${
            emailConfigurado()
              ? "border-green-200 bg-green-50 text-green-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {emailConfigurado() ? (
            <>
              <strong>Mails activados.</strong> Cada pedido dispara un mail de
              confirmación al cliente.
            </>
          ) : (
            <>
              <strong>Mails apagados.</strong> La tienda no envía ninguna
              confirmación. Falta cargar RESEND_API_KEY y MAIL_FROM en el
              servidor.
            </>
          )}
        </div>

        {/* Estado de la facturacion electronica */}
        <div
          className={`rounded-2xl border p-4 text-sm ${
            !afipConfigurado()
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : esProduccion()
                ? "border-green-200 bg-green-50 text-green-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          {!afipConfigurado() ? (
            <>
              <strong>Facturación electrónica apagada.</strong> El botón
              Facturar de cada pedido no va a emitir nada. Falta cargar el
              certificado de ARCA en el servidor.
            </>
          ) : (
            <>
              <strong>
                {esProduccion()
                  ? "Facturación electrónica en PRODUCCIÓN."
                  : "Facturación electrónica en PRUEBA."}
              </strong>{" "}
              {esProduccion()
                ? "Las facturas que emitas tienen validez fiscal."
                : "Los comprobantes NO tienen validez fiscal: sirven para probar."}{" "}
              Punto de venta {puntoVenta()}.
              <ProbarArca />
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
