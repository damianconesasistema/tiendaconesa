"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, Plus, Trash2, CalendarCheck, ShieldCheck } from "lucide-react";
import { ChequearAhora } from "@/components/admin/ChequearAhora";
import {
  costoTotalPct,
  diasDesdeRevisados,
  planesConRecargo,
  tocaRevisarCostos,
  recargoParaCubrir,
  type CostosMp,
  type PlanCosto,
} from "@/lib/costos-mp";
import { precioCuotas } from "@/lib/precios";
import { formatPrice } from "@/lib/order";
import { guardarCostosMp, marcarCostosRevisados } from "@/app/admin/mercadopago/actions";

// La pantalla "Mercado Pago": los costos del mes y lo que le cobran al
// cliente. Ver src/app/admin/mercadopago/actions.ts y src/lib/costos-mp.ts.

const EJEMPLO = 100_000;

type Fila = { cuotas: string; costo: string };

const num = (s: string) => Number(String(s).replace(",", "."));
const pct = (n: number) => `${n.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;

export function CostosMercadoPago({
  guardados,
  revisados,
  control = null,
  recargoUnPago,
  local,
}: {
  /** Los costos que usa hoy la tienda (los de este local). */
  guardados: CostosMp;
  /** Cuando se revisaron por ultima vez (ISO), o null. */
  revisados: string | null;
  /** El recargo de 1 pago que usa la tienda (sale de Configuracion). */
  recargoUnPago: number;
  /** El local del panel, o null en el panel general. */
  local: string | null;
  /** El ultimo control automatico de todos los dias (src/lib/chequeo-diario.ts). */
  control?: { cuando: string; texto: string; aviso: boolean } | null;
}) {
  const [cobro, setCobro] = useState(String(guardados.cobro));
  const [iva, setIva] = useState(String(guardados.iva));
  const [filas, setFilas] = useState<Fila[]>(
    guardados.planes.map((p) => ({ cuotas: String(p.cuotas), costo: String(p.costo) })),
  );
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // La cuenta de hoy y la de lo que se esta cargando, plan por plan.
  const hoy = new Map(planesConRecargo(guardados).map((p) => [p.cuotas, p]));
  const planes: PlanCosto[] = filas
    .map((f) => ({ cuotas: Math.floor(num(f.cuotas)), costo: num(f.costo) }))
    .filter((p) => Number.isFinite(p.cuotas) && p.cuotas >= 2 && Number.isFinite(p.costo) && p.costo >= 0);
  const nuevos = new Map(
    planesConRecargo({ cobro: num(cobro), iva: num(iva), planes }).map((p) => [p.cuotas, p]),
  );
  const cambio =
    num(cobro) !== guardados.cobro ||
    num(iva) !== guardados.iva ||
    JSON.stringify(planes) !== JSON.stringify(guardados.planes);

  // 1 pago: lo que se lleva Mercado Pago contra lo que suma la tienda.
  const costo1 = costoTotalPct(num(cobro), 0, num(iva));
  const minimo1 = recargoParaCubrir(costo1);

  const dias = diasDesdeRevisados(revisados);
  const toca = tocaRevisarCostos(revisados);

  function guardar() {
    setError(null);
    setOk(null);
    const subidas = [...nuevos.values()]
      .map((p) => {
        const antes = hoy.get(p.cuotas)?.recargoPct;
        return antes === undefined
          ? `${p.cuotas} cuotas: nuevo, ${pct(p.recargoPct)}`
          : antes === p.recargoPct
            ? null
            : `${p.cuotas} cuotas: ${pct(antes)} → ${pct(p.recargoPct)}`;
      })
      .filter(Boolean);
    const sacados = [...hoy.keys()].filter((c) => !nuevos.has(c)).map((c) => `${c} cuotas: se deja de ofrecer`);
    const lista = [...subidas, ...sacados];
    if (
      !confirm(
        `Esto cambia ya los precios en cuotas de la tienda${local ? ` (${local})` : ""}:\n\n${
          lista.length ? lista.join("\n") : "los recargos quedan igual"
        }\n\n¿Seguimos?`,
      )
    )
      return;
    iniciar(async () => {
      const r = await guardarCostosMp({ cobro: num(cobro), iva: num(iva), planes });
      if (r.error) setError(r.error);
      else setOk("Listo: costos guardados. Los precios en cuotas de la tienda ya son los nuevos.");
    });
  }

  function siguenIgual() {
    setError(null);
    setOk(null);
    iniciar(async () => {
      const r = await marcarCostosRevisados();
      if (r.error) setError(r.error);
      else setOk("Anotado: este mes siguen igual.");
    });
  }

  return (
    <div className="mt-8 space-y-6">
      {/* El control automatico: todos los dias compara lo que se llevo
          Mercado Pago de cada venta con lo cargado aca. */}
      <div
        className={`rounded-2xl border p-4 ${
          control?.aviso ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
        }`}
      >
        <div className="flex items-start gap-3">
          {control?.aviso ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-bold">
              Control automático de todos los días
              {control ? <span className="font-normal"> · último: {control.cuando}</span> : null}
            </p>
            <p className="mt-0.5">
              {control
                ? control.texto
                : "Todavía no corrió el primero desde este cambio: corre solo una vez por día, o tocá Chequear ahora."}
            </p>
            <p className="mt-1 text-xs opacity-80">
              Compara lo que Mercado Pago se llevó de cada venta con tarjeta de los últimos 30 días con los costos
              cargados abajo. Si se lleva más, avisa acá y en las novedades.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <ChequearAhora />
        </div>
      </div>

      {/* Cuando se revisaron a mano */}
      <div
        className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${
          toca ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"
        }`}
      >
        {toca ? <AlertTriangle className="h-5 w-5 shrink-0" /> : <CalendarCheck className="h-5 w-5 shrink-0" />}
        <p className="flex-1 text-sm">
          {revisados
            ? `Costos cargados a mano: revisados el ${new Date(revisados).toLocaleDateString("es-AR")} (hace ${dias} ${dias === 1 ? "día" : "días"}).`
            : "Nunca se revisaron desde el panel: son los de octubre de 2026."}{" "}
          {toca ? (
            <strong>Revisalos: Mercado Pago los cambia mes a mes.</strong>
          ) : (
            "Están al día. Cuando pase un mes te avisa para que los mires de nuevo en tu cuenta."
          )}
        </p>
        {toca && !cambio && (
          <button
            type="button"
            onClick={siguenIgual}
            disabled={pendiente}
            className="rounded-full border border-current px-4 py-1.5 text-xs font-bold disabled:opacity-50"
          >
            Ya los miré: siguen igual
          </button>
        )}
      </div>

      {/* De donde salen */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">De dónde salen</h2>
        <p className="mt-2 text-[var(--muted)]">
          Mercado Pago no le pasa estos números a la tienda: están solo en tu cuenta y cambian según la
          provincia. Entrá a la app de Mercado Pago → <strong>Tu negocio → Costos</strong> (en la compu,
          mercadopago.com.ar → Tu negocio → Costos y cuotas) y copiá acá:
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[var(--muted)]">
          <li>
            El <strong>costo por cobrar</strong> con el plazo en que cobrás (al instante, a 10 días, etc.).
          </li>
          <li>
            El <strong>costo de cada plan de cuotas sin interés</strong> que ofrecés.
          </li>
          <li>Mercado Pago los muestra sin IVA: el IVA se suma acá.</li>
        </ol>
      </section>

      {/* Los costos */}
      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Costo por cobrar (%, sin IVA)
            </label>
            <input
              value={cobro}
              onChange={(e) => setCobro(e.target.value)}
              inputMode="decimal"
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">IVA (%)</label>
            <input
              value={iva}
              onChange={(e) => setIva(e.target.value)}
              inputMode="decimal"
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
            />
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="py-2 pr-3">Cuotas</th>
                <th className="py-2 pr-3">Costo del plan (%, sin IVA)</th>
                <th className="py-2 pr-3 text-right">Se lleva MP (con IVA)</th>
                <th className="py-2 pr-3 text-right">Recargo al cliente</th>
                <th className="py-2 pr-3 text-right">Ejemplo: {formatPrice(EJEMPLO)} de contado</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filas.map((f, i) => {
                const c = Math.floor(num(f.cuotas));
                const n = nuevos.get(c);
                const antes = hoy.get(c)?.recargoPct;
                const total = n ? precioCuotas(EJEMPLO, n.recargoPct) : null;
                return (
                  <tr key={i}>
                    <td className="py-2 pr-3">
                      <input
                        value={f.cuotas}
                        onChange={(e) => setFilas((l) => l.map((x, j) => (j === i ? { ...x, cuotas: e.target.value } : x)))}
                        inputMode="numeric"
                        className="h-9 w-16 rounded-lg border border-[var(--border)] px-2 text-sm outline-none focus:border-[var(--brand-red)]"
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        value={f.costo}
                        onChange={(e) => setFilas((l) => l.map((x, j) => (j === i ? { ...x, costo: e.target.value } : x)))}
                        inputMode="decimal"
                        className="h-9 w-24 rounded-lg border border-[var(--border)] px-2 text-sm outline-none focus:border-[var(--brand-red)]"
                      />
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{n ? pct(Math.round(n.costoTotal * 100) / 100) : "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {n ? (
                        <>
                          <strong>{pct(n.recargoPct)}</strong>
                          {antes !== undefined && antes !== n.recargoPct && (
                            <span className={`ml-1 text-xs ${n.recargoPct > antes ? "text-red-600" : "text-emerald-700"}`}>
                              (hoy {pct(antes)})
                            </span>
                          )}
                          {antes === undefined && <span className="ml-1 text-xs text-[var(--muted)]">(nuevo)</span>}
                        </>
                      ) : (
                        <span className="text-xs text-red-600">revisá</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-[var(--muted)]">
                      {total && c > 0 ? `${formatPrice(total)} · ${c} de ${formatPrice(Math.round(total / c))}` : "—"}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => setFilas((l) => l.filter((_, j) => j !== i))}
                        title="Dejar de ofrecer este plan"
                        className="text-[var(--muted)] hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={() => setFilas((l) => [...l, { cuotas: "", costo: "" }])}
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-red)]"
        >
          <Plus className="h-3.5 w-3.5" /> Agregar un plan
        </button>

        {/* 1 pago: informativo, el recargo se cambia en Configuracion */}
        <div
          className={`mt-5 rounded-xl p-3 text-sm ${
            minimo1 !== null && recargoUnPago < minimo1 ? "bg-red-50 text-red-900" : "bg-[var(--surface)] text-[var(--muted)]"
          }`}
        >
          <strong className="text-foreground">1 pago con tarjeta:</strong> Mercado Pago se lleva{" "}
          {pct(Math.round(costo1 * 100) / 100)} con IVA; para no perder plata el recargo tiene que ser al menos{" "}
          {minimo1 !== null ? pct(minimo1) : "—"}. La tienda usa {pct(recargoUnPago)} (es el que da el descuento por
          transferencia; se cambia en Configuración).
          {minimo1 !== null && recargoUnPago < minimo1 && <strong> Con este costo, en 1 pago perdés plata.</strong>}
        </div>

        {error && <p className="mt-4 text-sm font-medium text-red-700">{error}</p>}
        {ok && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <Check className="h-4 w-4" /> {ok}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={guardar}
            disabled={pendiente || !cambio || nuevos.size !== planes.length || planes.length !== filas.length}
            className="inline-flex h-10 items-center rounded-full bg-[var(--brand-red)] px-5 font-display text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40"
          >
            Guardar y actualizar las cuotas
          </button>
          <span className="text-xs text-[var(--muted)]">
            {cambio
              ? "Al guardar, los precios en cuotas de la tienda pasan a ser los de esta tabla."
              : "Cambiá algún número para guardar."}
          </span>
        </div>
      </section>
    </div>
  );
}
