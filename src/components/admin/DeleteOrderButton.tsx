"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteOrder } from "@/app/admin/pedidos/actions";

export function DeleteOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    if (
      !confirm(
        `¿Eliminar el pedido #${orderNumber}? Esta acción no se puede deshacer.`,
      )
    )
      return;
    startTransition(async () => {
      const r = await deleteOrder(orderId);
      if (r.ok) {
        router.push("/admin/pedidos");
      } else {
        setError(r.error ?? "Error al eliminar");
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        Eliminar pedido
      </button>
      {error && <span className="mt-1 text-[11px] text-red-500">{error}</span>}
    </div>
  );
}
