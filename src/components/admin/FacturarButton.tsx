"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2, Download, AlertTriangle, Undo2, Send } from "lucide-react";
import {
  facturarPedido,
  anularFactura,
  linkDelComprobante,
} from "@/app/admin/pedidos/actions";

// Boton de facturar del detalle del pedido.
//
// Pide confirmacion porque emitir es irreversible: una vez que ARCA da el
// CAE, para dar marcha atras hace falta una nota de credito.

type Props = {
  orderId: string;
  /** Si ya esta facturado, el boton se reemplaza por el link al PDF. */
  cae?: string | null;
  numero?: string | null;
  /** Si ademas ya se anulo, se muestra la nota de credito. */
  ncCae?: string | null;
  ncNumero?: string | null;
  /** Telefono del cliente, para el boton de WhatsApp. */
  telefono?: string | null;
};

export function FacturarButton({ orderId, cae, numero, ncCae, ncNumero, telefono }: Props) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [emitido, setEmitido] = useState<string | null>(cae ?? null);
  const [anulado, setAnulado] = useState<string | null>(ncCae ?? null);

  const pdf = `/api/admin/pedidos/${orderId}/factura`;
  const pdfNc = `/api/admin/pedidos/${orderId}/nota-credito`;

  if (emitido) {
    return (
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={pdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-black)] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
          >
            <Download className="h-4 w-4" />
            Factura {numero ?? ""}
          </a>

          {telefono && (
            <button
              type="button"
              onClick={async () => {
                const r = await linkDelComprobante(orderId, "factura");
                if (!r.link) return setError(r.error ?? "No se pudo armar el link");
                const tel = telefono.replace(/D/g, "");
                const texto = encodeURIComponent(
                  `Hola! Te paso la factura de tu compra: ${r.link}`,
                );
                window.open(
                  `https://api.whatsapp.com/send?phone=54${tel}&text=${texto}`,
                  "_blank",
                  "noopener",
                );
              }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <Send className="h-4 w-4" />
              Enviar por WhatsApp
            </button>
          )}

          {anulado ? (
            <a
              href={pdfNc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800"
            >
              <Download className="h-4 w-4" />
              NC {ncNumero ?? ""}
            </a>
          ) : (
            <button
              type="button"
              disabled={pendiente}
              onClick={() => {
                setError(null);
                const motivo = prompt(
                  "Se va a emitir una NOTA DE CRÉDITO que anula esta factura en ARCA.\n\n¿Por qué se anula? (queda registrado)",
                  "Anulación por error de carga",
                );
                if (motivo === null) return;
                if (
                  !confirm(
                    "Última confirmación: se emite la nota de crédito por el total de la factura. Esto tampoco se puede deshacer.\n\n¿Emitir?",
                  )
                )
                  return;
                startTransition(async () => {
                  const r = await anularFactura(orderId, motivo);
                  if (r.error) setError(r.error);
                  else setAnulado(r.cae ?? null);
                });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-[var(--muted)] transition-colors hover:border-amber-400 hover:text-amber-700 disabled:opacity-60"
            >
              {pendiente ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4" />
              )}
              Nota de crédito
            </button>
          )}
        </div>

        <span className="text-[11px] text-[var(--muted)]">
          CAE {emitido}
          {anulado ? " · ANULADA con nota de crédito" : ""}
        </span>
        {(aviso || error) && (
          <span
            className={`max-w-xs text-right text-[11px] ${
              error ? "text-[var(--brand-red)]" : "text-amber-600"
            }`}
          >
            {error ?? aviso}
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
