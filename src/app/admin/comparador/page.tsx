import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ElegirSucursal } from "@/components/admin/ElegirSucursal";
import { ComparadorPrecios, type FilaComparador } from "@/components/admin/ComparadorPrecios";
import { prisma } from "@/lib/db";
import { sucursalDelPanel } from "@/lib/sucursal-panel";
import { getRecargosDelPanel } from "@/lib/settings";
import { getMarcas } from "@/lib/marcas-server";
import { getRubrosExtra } from "@/lib/rubros-server";
import { nombreRubro } from "@/lib/rubros";
import { precioVitrina } from "@/lib/precios";
import { comparacionesGuardadas } from "@/lib/comparador";
import { mlConectado } from "@/lib/mercadolibre";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Comparador de precios · Panel" };

// El comparador de precios: los productos publicados de este local, y a
// cuanto se venden afuera. Ver src/lib/comparador.ts.
export default async function ComparadorPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const suc = await sucursalDelPanel();
  if (!suc)
    return (
      <AdminShell username={session.username} active="comparador">
        <ElegirSucursal
          pantalla="/admin/comparador"
          titulo="¿De qué local querés comparar los precios?"
          soloConTienda
        />
      </AdminShell>
    );

  const [publicados, recargos, marcas, rubrosExtra, guardadas, conML] = await Promise.all([
    prisma.branchProduct.findMany({
      where: { branchId: suc.id, active: true },
      select: {
        price: true,
        salePrice: true,
        product: {
          select: { itemId: true, title: true, brand: true, category: true, imageUrl: true },
        },
      },
    }),
    getRecargosDelPanel(),
    getMarcas(),
    getRubrosExtra(),
    comparacionesGuardadas(),
    mlConectado().catch(() => false),
  ]);
  const nombreMarca = new Map(marcas.map((m) => [m.id, m.name]));

  const filas: FilaComparador[] = publicados
    .map((f) => ({
      itemId: f.product.itemId,
      titulo: f.product.title,
      marca: f.product.brand ? (nombreMarca.get(f.product.brand) ?? f.product.brand) : null,
      rubro: nombreRubro(f.product.category, rubrosExtra),
      imagen: f.product.imageUrl || `/categories/${f.product.category}.jpg`,
      // El que ve el cliente: debito o 1 pago, con la oferta si tiene.
      precio: precioVitrina(f.salePrice ?? f.price, recargos.unPago),
      comparacion: guardadas[f.product.itemId] ?? null,
    }))
    .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));

  return (
    <AdminShell username={session.username} active="comparador">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
          Comparador de precios
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Los productos publicados en la tienda de <strong>{suc.nombre}</strong> y a cuánto los venden
          otras casas de sanitarios y corralones: Easy, Sodimac, Blaisten, Carrefour, Edificor, Santagal, DePlano, Casapick y unas 30 más.
          Se busca con el código de fabricante; si no tiene, con los códigos del título y la ayuda
          memoria y la descripción. Solo se muestra el <strong>mismo modelo</strong>: cuando el otro
          nombra el mismo código y es de la misma marca. Lo que no es igual no aparece.
        </p>
        <ComparadorPrecios filas={filas} mlConectado={conML} />
      </div>
    </AdminShell>
  );
}
