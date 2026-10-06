import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { publicPaywayConfig } from "@/lib/payway";
import { CheckoutPaywayForm } from "@/components/CheckoutPaywayForm";

export const metadata: Metadata = {
  title: "Pago con tarjeta",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ orden?: string }>;

export default async function PagoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const orderNumber = Number(sp.orden);
  if (!Number.isFinite(orderNumber) || orderNumber <= 0) {
    redirect("/tienda/carrito");
  }

  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: { customer: true, items: true },
  });

  if (!order) redirect("/tienda/carrito");
  // Si ya está pagada, mandamos a éxito
  if (order.paidAt) redirect(`/tienda/checkout/exito?orden=${orderNumber}`);
  if (order.status === "cancelado") redirect("/tienda/carrito");

  const config = publicPaywayConfig();

  return (
    <CheckoutPaywayForm
      orderNumber={order.number}
      total={order.total}
      customerName={`${order.customer.firstName} ${order.customer.lastName}`}
      items={order.items.map((it) => ({
        title: it.title,
        qty: it.qty,
        price: it.price,
      }))}
      payway={config}
    />
  );
}
