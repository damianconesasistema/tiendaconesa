"use client";

import { useActionState, useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { guardarRecargos } from "@/app/admin/configuracion/actions";
import { formatPrice } from "@/lib/order";

type State = { ok?: true; error?: string } | null;

export function RecargosForm({
  unPago,
  cuotas,
  cuotasMax,
}: {
  unPago: number;
  cuotas: number;
  cuotasMax: number;
}) {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    guardarRecargos as (prev: State, fd: FormData) => Promise<State>,
    null,
  );

  // Vista previa en vivo sobre un producto de $100.000, para que se entienda
  // en pesos lo que significa cada porcentaje.
  const [prevUnPago, setPrevUnPago] = useState(unPago);
  const [prevCuotas, setPrevCuotas] = useState(cuotas);
  const EJEMPLO = 100000;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Recargo débito / 1 pago (%)
          </label>
          <input
            name="unPago"
            type="number"
            min={0}
            max={60}
            step="0.1"
            defaultValue={unPago}
            onChange={(e) => setPrevUnPago(Number(e.target.value))}
            className="input"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Recargo en cuotas (%)
          </label>
          <input
            name="cuotas"
            type="number"
            min={0}
            max={60}
            step="0.1"
            defaultValue={cuotas}
            onChange={(e) => setPrevCuotas(Number(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <div className="sm:w-1/2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Cuotas máximas
        </label>
        <input
          name="cuotasMax"
          type="number"
          min={1}
          max={24}
          step="1"
          defaultValue={cuotasMax}
          className="input"
        />
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Cuántas cuotas fijas ofrecés. Tiene que coincidir con lo que
          tengas acordado con MercadoPago.
        </p>
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11px] text-sky-900">
          <strong>De dónde sacar estos números:</strong> en la app de
          MercadoPago, <em>Tu negocio → Costos → Simulador</em>. Poné cuánto
          querés RECIBIR y te dice cuánto paga el cliente. El recargo es la
          diferencia. Ejemplo: si para recibir $100.000 el cliente paga
          $125.711, el recargo es 25,71%.
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
        <div className="font-bold uppercase tracking-wider text-[var(--muted)]">
          Ejemplo con un producto de {formatPrice(EJEMPLO)}
        </div>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <span>Efectivo o transferencia</span>
            <strong>{formatPrice(EJEMPLO)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Débito o 1 pago ({prevUnPago}%)</span>
            <strong>
              {formatPrice(EJEMPLO + Math.round(EJEMPLO * (prevUnPago / 100)))}
            </strong>
          </div>
          <div className="flex justify-between">
            <span>
              Hasta {cuotasMax} cuotas ({prevCuotas}%)
            </span>
            <strong>
              {formatPrice(EJEMPLO + Math.round(EJEMPLO * (prevCuotas / 100)))}
            </strong>
          </div>
        </div>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-xs font-bold text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          Guardado. Ya se aplica en el checkout.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-[var(--brand-red-hover)] disabled:opacity-60"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: .6rem;
          padding: .625rem .75rem;
          background: #fff;
          font-size: .95rem;
          outline: none;
        }
        .input:focus { border-color: var(--brand-red); }
      `}</style>
    </form>
  );
}
