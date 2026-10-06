"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { quickUpdate } from "@/app/admin/productos/actions";

type NumField = "price" | "salePrice" | "stock";
type BoolField = "active" | "featured";

// Input numerico editable inline (price, salePrice, stock)
export function InlineNumber({
  itemId,
  field,
  initial,
  prefix,
  allowNull = false,
  className = "",
}: {
  itemId: string;
  field: NumField;
  initial: number | null;
  prefix?: string;
  allowNull?: boolean;
  className?: string;
}) {
  const initialStr = initial === null ? "" : String(initial);
  const [value, setValue] = useState<string>(initialStr);
  const [savedInitial, setSavedInitial] = useState<string>(initialStr);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dirty = value !== savedInitial;

  // Si el server manda un nuevo valor (ej. tras una acción masiva o
  // recarga de datos), sincronizamos — PERO solo si el usuario no está
  // editando este campo, para no pisarle lo que escribió.
  useEffect(() => {
    if (!dirty) {
      setValue(initialStr);
      setSavedInitial(initialStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStr]);
  // Para price/stock no permitimos vacio: no se puede aplicar si quedo vacio
  const canApply = dirty && (allowNull || value !== "");

  function commit() {
    if (!canApply) return;
    startTransition(async () => {
      setStatus("saving");
      setError(null);
      const payload = value === "" ? null : Number(value);
      const r = await quickUpdate(itemId, field, payload);
      if (r.ok) {
        setSavedInitial(value);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("error");
        setError(r.error ?? "Error");
        setTimeout(() => setStatus("idle"), 2500);
      }
    });
  }

  function cancel() {
    setValue(savedInitial);
    setError(null);
    setStatus("idle");
  }

  const borderCls =
    status === "error"
      ? "border-red-400 focus:border-red-500 focus:ring-red-200"
      : status === "saved"
        ? "border-green-400 focus:ring-green-200"
        : dirty
          ? "border-amber-400 focus:border-amber-500 focus:ring-amber-200"
          : "border-[var(--border)] focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]/20";

  return (
    // Ancho fijo que SIEMPRE reserva espacio para los 2 botones chicos,
    // asi la fila nunca cambia de tamaño al pasar de clean a dirty.
    <div className="inline-flex items-center justify-end gap-1" style={{ width: "9rem" }}>
      {prefix && (
        <span className="text-xs text-[var(--muted)]">{prefix}</span>
      )}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        placeholder={allowNull ? "—" : "0"}
        title={dirty ? "Sin guardar — Enter aplica, Esc cancela" : undefined}
        className={`inline-edit-number h-9 min-w-0 flex-1 rounded border bg-white px-2 text-right font-display text-sm font-bold outline-none focus:ring-2 ${borderCls} ${className}`}
      />
      {/* Slot reservado para los 2 botones (ancho fijo, no cambia la fila) */}
      <div className="flex w-14 items-center justify-start gap-0.5">
        {dirty ? (
          <>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                commit();
              }}
              disabled={!canApply || status === "saving"}
              title="Aplicar (Enter)"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              {status === "saving" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" strokeWidth={3} />
              )}
            </button>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                cancel();
              }}
              disabled={status === "saving"}
              title="Cancelar (Esc)"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-white text-[var(--muted)] hover:border-red-400 hover:text-red-500"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </>
        ) : status === "saved" ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : null}
      </div>
      <style>{`
        .inline-edit-number::-webkit-outer-spin-button,
        .inline-edit-number::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .inline-edit-number {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>
    </div>
  );
}

// Toggle simple (featured): un boton que cambia estado
export function InlineToggle({
  itemId,
  field,
  initial,
  labelOn,
  labelOff,
}: {
  itemId: string;
  field: BoolField;
  initial: boolean;
  labelOn: string;
  labelOff: string;
}) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [, startTransition] = useTransition();

  // Sincronizar con el server cuando llega un valor nuevo (acción masiva,
  // recarga), salvo que haya un guardado en curso.
  const savingRef = useRef(false);
  useEffect(() => {
    if (!savingRef.current) setValue(initial);
  }, [initial]);

  function toggle() {
    const next = !value;
    setValue(next);
    savingRef.current = true;
    startTransition(async () => {
      setStatus("saving");
      const r = await quickUpdate(itemId, field, next);
      if (r.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1200);
      } else {
        setValue(!next); // revertir
        setStatus("idle");
      }
      savingRef.current = false;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={status === "saving"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase transition-colors ${
        value
          ? field === "featured"
            ? "bg-[var(--brand-red)]/10 text-[var(--brand-red)] hover:bg-[var(--brand-red)]/20"
            : "bg-green-100 text-green-800 hover:bg-green-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {status === "saving" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
      {value ? labelOn : labelOff}
    </button>
  );
}

// Segmented control de 2 opciones (ej. Activo | Pausado) - ambas visibles
export function InlineSegmented({
  itemId,
  field,
  initial,
  labelOn,
  labelOff,
}: {
  itemId: string;
  field: BoolField;
  initial: boolean;
  labelOn: string;
  labelOff: string;
}) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [, startTransition] = useTransition();

  // Sincronizar con el server cuando llega un valor nuevo (acción masiva,
  // recarga), salvo que haya un guardado en curso.
  const savingRef = useRef(false);
  useEffect(() => {
    if (!savingRef.current) setValue(initial);
  }, [initial]);

  function set(next: boolean) {
    if (next === value) return;
    const prev = value;
    setValue(next);
    savingRef.current = true;
    startTransition(async () => {
      setStatus("saving");
      const r = await quickUpdate(itemId, field, next);
      if (!r.ok) setValue(prev);
      setStatus("idle");
      savingRef.current = false;
    });
  }

  return (
    <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 text-[10px] font-bold uppercase">
      <button
        type="button"
        onClick={() => set(true)}
        disabled={status === "saving"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          value
            ? "bg-green-500 text-white shadow"
            : "text-[var(--muted)] hover:text-foreground"
        }`}
      >
        {labelOn}
      </button>
      <button
        type="button"
        onClick={() => set(false)}
        disabled={status === "saving"}
        className={`rounded-full px-2.5 py-1 transition-colors ${
          !value
            ? "bg-gray-700 text-white shadow"
            : "text-[var(--muted)] hover:text-foreground"
        }`}
      >
        {labelOff}
      </button>
    </div>
  );
}
