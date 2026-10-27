"use client";

import { useState, useTransition } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { probarArca } from "@/app/admin/configuracion/actions";

type Resultado = Awaited<ReturnType<typeof probarArca>> | null;

export function ProbarArca() {
  const [resultado, setResultado] = useState<Resultado>(null);
  const [pendiente, empezar] = useTransition();

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          empezar(async () => {
            setResultado(null);
            setResultado(await probarArca());
          })
        }
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold hover:bg-[var(--surface)] disabled:opacity-60"
      >
        {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
        {pendiente ? "Preguntando a ARCA..." : "Probar conexión con ARCA"}
      </button>

      <p className="mt-2 text-xs text-[var(--muted)]">
        No emite ningún comprobante: solo le pregunta a ARCA si el certificado
        sirve y en qué número va la numeración.
      </p>

      {resultado?.ok && (
        <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-green-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            ARCA responde. La próxima Factura A sería la{" "}
            {resultado.proximaA} y la próxima Factura B, la {resultado.proximaB}
            .
            {resultado.ambiente !== "produccion" && (
              <> Ojo: está en prueba, los comprobantes no valen fiscalmente.</>
            )}
          </span>
        </p>
      )}

      {resultado?.error && (
        <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{resultado.error}</span>
        </p>
      )}
    </div>
  );
}
