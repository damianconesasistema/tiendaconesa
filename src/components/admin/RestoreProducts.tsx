"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Check, AlertTriangle, Loader2 } from "lucide-react";
import {
  previewRestore,
  restoreMissingProducts,
} from "@/app/admin/productos/actions";

type Stats = {
  enJson?: number;
  yaExisten?: number;
  faltantes?: number;
  restaurados?: number;
};

export function RestoreProducts() {
  const [pending, startTransition] = useTransition();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Stats | null>(null);
  const [confirming, setConfirming] = useState(false);

  function check() {
    setError(null);
    setDone(null);
    startTransition(async () => {
      const r = await previewRestore();
      if (r.ok) setStats(r);
      else setError(r.error ?? "Error");
    });
  }

  function restore() {
    setError(null);
    startTransition(async () => {
      const r = await restoreMissingProducts();
      if (r.ok) {
        setDone(r);
        setStats(null);
        setConfirming(false);
      } else {
        setError(r.error ?? "Error");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <h2 className="font-display text-lg font-black uppercase tracking-wider">
        Restaurar productos borrados
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Vuelve a crear los productos del catálogo original (779) que ya no estén
        en la tienda, con sus <strong>precios reales originales</strong>. Nunca
        pisa un producto que ya existe: los que están ahora quedan intactos.
      </p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        Se restauran <strong>pausados</strong> para que revises precio y stock
        antes de que vuelvan a la tienda. Los productos que creaste a mano y las
        fotos que subiste <strong>no</strong> están en el catálogo original, así
        que no se recuperan por acá.
      </p>

      {!stats && !done && (
        <button
          type="button"
          onClick={check}
          disabled={pending}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-black)] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Ver cuántos faltan
        </button>
      )}

      {stats && (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="En el catálogo" value={stats.enJson ?? 0} />
            <Stat label="Ya están" value={stats.yaExisten ?? 0} />
            <Stat
              label="Faltan"
              value={stats.faltantes ?? 0}
              highlight={(stats.faltantes ?? 0) > 0}
            />
          </div>

          {(stats.faltantes ?? 0) === 0 ? (
            <p className="mt-4 text-center text-sm font-bold text-green-700">
              No falta ninguno del catálogo original.
            </p>
          ) : !confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={pending}
              className="mt-4 w-full rounded-full bg-green-600 px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-green-700 disabled:opacity-50"
            >
              Restaurar {stats.faltantes} productos
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-900">
                Se van a crear <strong>{stats.faltantes}</strong> productos
                pausados, con los precios del catálogo original. ¿Seguimos?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="flex-1 rounded-full border border-[var(--border)] bg-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={restore}
                  disabled={pending}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-green-600 px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Sí, restaurar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {done && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div className="text-sm text-green-900">
            <div className="font-bold">
              {done.restaurados} productos restaurados
            </div>
            <div className="mt-0.5 text-xs">
              Quedaron <strong>pausados</strong>. Revisá precios y stock, y
              activalos cuando estén listos.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          {error}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        className={`font-display text-2xl font-black ${
          highlight ? "text-[var(--brand-red)]" : "text-foreground"
        }`}
      >
        {value.toLocaleString("es-AR")}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </div>
    </div>
  );
}
