import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/db";
import { SucursalFicha } from "@/components/admin/SucursalFicha";
import { mpClavePropia, mpNombreDeVariable } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sucursales · Panel" };

export default async function SucursalesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const sucursales = await prisma.branch.findMany({
    orderBy: { orden: "asc" },
    include: { _count: { select: { productos: true } } },
  });

  const sinCobertura = !sucursales.some((s) => s.cubreTodoElPais);

  // Para avisar, antes de cerrar, que no va a quedar ninguna abierta: ahi el
  // sitio entero pasa a atender por WhatsApp. Es un cambio grande como para
  // enterarse despues.
  const abiertas = sucursales.filter((s) => s.tiendaActiva).length;

  return (
    <AdminShell username={session.username} active="sucursales">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          Sucursales
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Cada sucursal tiene su propia tienda en su subdominio, y de ahí sale
          todo lo suyo: el QR fiscal, el CUIT con el que factura, los datos del
          local y a quién atiende.
        </p>

        {sinCobertura && (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Ninguna sucursal atiende el resto del país.</strong> Un
            pedido de un código postal que no esté en ninguna lista no le
            llegaría a nadie. Marcá la opción en una de las dos.
          </p>
        )}

        <div className="mt-6 space-y-6">
          {sucursales.map((s) => (
            <SucursalFicha
              key={s.id}
              sucursal={{
                id: s.id,
                slug: s.slug,
                subdominio: s.subdominio,
                orden: s.orden,
                name: s.name,
                active: s.active,
                tiendaActiva: s.tiendaActiva,
                razonSocial: s.razonSocial,
                cuit: s.cuit,
                iibb: s.iibb,
                inicioAct: s.inicioAct,
                afipQr: s.afipQr,
                address: s.address,
                city: s.city,
                province: s.province,
                postalCode: s.postalCode,
                lat: s.lat,
                lng: s.lng,
                phone: s.phone,
                whatsapp: s.whatsapp,
                email: s.email,
                hours: s.hours,
                codigosPostales: s.codigosPostales,
                cubreTodoElPais: s.cubreTodoElPais,
                zonaEnvio: s.zonaEnvio,
                productos: s._count.productos,
                // La clave de MercadoPago no esta en la base sino en el
                // servidor, asi que esto se mira aca y viaja ya resuelto: el
                // componente del panel corre en el navegador y ahi no hay
                // variables de entorno que valgan.
                clavePropia: mpClavePropia(s.slug),
                variableMp: mpNombreDeVariable(s.slug),
                ultimaAbierta: s.tiendaActiva && abiertas === 1,
              }}
            />
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
