"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2, Download, AlertTriangle } from "lucide-react";
import { facturarPedido } from "@/app/admin/pedidos/actions";

// Boton de facturar del detalle del pedido.
//
// Pide confirmacion porque emitir es irreversible: una vez que ARCA da el
// CAE, para dar marcha atras hace falta una nota de credito.

type Props = {
  orderId: string;
  /** Si ya esta facturado, el boton se reemplaza por el link al PDF. */
  cae?: string | null;
  numero?: string | null;
};

export function FacturarButton({ orderId, cae, numero }: Props) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [emitido, setEmitido] = useState<string | null>(cae ?? null);

  const pdf = `/api/admin/pedidos/${orderId}/factura`;

  if (emitido) {
    return (
      <div className="flex flex-col items-end gap-1">
        <a
          href={pdf}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-black)] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
        >
          <Download className="h-4 w-4" />
          Ver factura {numero ?? ""}
        </a>
        <span className="text-[11px] text-[var(--muted)]">CAE {emitido}</span>
        {aviso && (
          <span className="max-w-xs text-right text-[11px] text-amber-600">
            {aviso}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pendiente}
        onClick={() => {
          setError(null);
          if (
            !confirm(
              "Se va a emitir la factura en ARCA. Una vez emitida no se puede borrar: para anularla hay que hacer una nota de crédito.\n\n¿Confirmás?",
            )
          )
            return;
          startTransition(async () => {
            const r = await facturarPedido(orderId);
            if (r.error) setError(r.error);
            else {
              setEmitido(r.cae ?? null);
              setAviso(r.aviso ?? null);
            }
          });
        }}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pendiente ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {pendiente ? "Emitiendo…" : "Facturar"}
      </button>
      {error && (
        <span className="flex max-w-xs items-start gap-1 text-right text-[11px] text-[var(--brand-red)]">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}
