"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateOrderStatus } from "@/app/admin/pedidos/actions";

// Marca el pedido como entregado desde el listado, sin tener que entrar.
//
// La mayoria de los pedidos son retiro en tienda: pasan de confirmado a
// entregado de una, cuando el cliente se lo lleva. Obligar a entrar al
// pedido y abrir un desplegable para eso hace que no se marque nunca, y un
// listado donde todo figura "confirmado" no sirve para saber que falta.
//
// Pide confirmacion igual, porque es un clic al lado de "Ver". A diferencia
// de la nota de credito, esto se puede volver atras desde la pantalla del
// pedido.
export function MarcarEntregado({
  orderId,
  cliente,
}: {
  orderId: string;
  cliente: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendiente}
      title={`Marcar el pedido de ${cliente} como entregado`}
      onClick={() => {
        if (!confirm(`¿Marcar como ENTREGADO el pedido de ${cliente}?`)) return;
        empezar(async () => {
          const r = await updateOrderStatus(orderId, "entregado");
          if (r?.error) setError(r.error);
        });
      }}
      className="inline-flex items-center gap-1 rounded-full border border-green-300 bg-white px-2.5 py-1 text-xs font-bold text-green-800 hover:bg-green-50 disabled:opacity-50"
    >
      {pendiente ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      {error ?? "Entregado"}
    </button>
  );
}
