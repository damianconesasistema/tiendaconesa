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
  disabled = false,
}: {
  itemId: string;
  field: NumField;
  initial: number | null;
  prefix?: string;
  allowNull?: boolean;
  className?: string;
  // disabled: producto bloqueado con candado. El server igual lo rechaza.
  disabled?: boolean;
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

  // Valor que acabamos de guardar nosotros. Mientras esté seteado,
  // ignoramos valores "viejos" que el server pueda mandar durante la
  // revalidación (evita que el precio "revierta" al anterior).
  const justSavedRef = useRef<string | null>(null);

  // Si el server manda un nuevo valor (acción masiva, recarga), sincronizamos
  // — salvo que el usuario esté editando, o que sea un valor viejo que llega
  // justo después de que guardamos.
  useEffect(() => {
    if (dirty) return;
    if (justSavedRef.current !== null) {
      if (initialStr === justSavedRef.current) {
        // llegó el dato fresco que coincide con lo guardado: todo en orden
        justSavedRef.current = null;
      } else {
        // dato viejo/rezagado: lo ignoramos para no revertir
        return;
      }
    }
    setValue(initialStr);
    setSavedInitial(initialStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStr]);
  // Para price/stock no permitimos vacio: no se puede aplicar si quedo vacio
  const canApply = dirty && (allowNull || value !== "");

  function commit() {
    if (!canApply) return;
    const toSave = value;
    startTransition(async () => {
      setStatus("saving");
      setError(null);
      const payload = toSave === "" ? null : Number(toSave);
      const r = await quickUpdate(itemId, field, payload);
      if (r.ok) {
        justSavedRef.current = toSave;
        setSavedInitial(toSave);
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
    <div className="inline-flex items-center justify-end gap-1" style={{ width: "6.25rem" }}>
      {prefix && (
        <span className="text-xs text-[var(--muted)]">{prefix}</span>
      )}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          // Guardar también al salir del campo (como una planilla), así no
          // se pierde el cambio si el usuario no apreta Enter / Aplicar.
          // Los botones Aplicar/Cancelar usan onPointerDown+preventDefault,
          // por eso no disparan este blur.
          if (dirty && canApply) commit();
        }}
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
        title={dirty ? "Sin guardar — Enter o salí del campo para guardar, Esc cancela" : undefined}
        className={`inline-edit-number h-9 min-w-0 flex-1 rounded border bg-white px-2 text-right font-display text-sm font-bold outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[var(--surface)] disabled:text-[var(--muted)] ${borderCls} ${className}`}
      />
      {/* Slot reservado para los 2 botones (ancho fijo, no cambia la fila) */}
      <div className="flex w-9 items-center justify-start gap-0.5">
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
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
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
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-white text-[var(--muted)] hover:border-red-400 hover:text-red-500"
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
  disabled = false,
}: {
  itemId: string;
  field: BoolField;
  initial: boolean;
  labelOn: string;
  labelOff: string;
  disabled?: boolean;
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
      disabled={disabled || status === "saving"}
      title={disabled ? "Bloqueado con candado" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
  disabled = false,
}: {
  itemId: string;
  field: BoolField;
  initial: boolean;
  labelOn: string;
  labelOff: string;
  disabled?: boolean;
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

  function set(next: boolean) {
    if (next === value) return;
    const prev = value;
    setValue(next);
    savingRef.current = true;
    startTransition(async () => {
      setStatus("saving");
      const r = await quickUpdate(itemId, field, next);
      if (!r.ok) {
        setValue(prev);
        setStatus("idle");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1200);
      }
      savingRef.current = false;
    });
  }

  return (
    <div className="inline-flex items-center gap-1">
    <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5 text-[10px] font-bold uppercase">
      <button
        type="button"
        onClick={() => set(true)}
        disabled={disabled || status === "saving"}
        title={disabled ? "Bloqueado con candado" : undefined}
        className={`rounded-full px-2.5 py-1 transition-colors disabled:cursor-not-allowed ${
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
        disabled={disabled || status === "saving"}
        title={disabled ? "Bloqueado con candado" : undefined}
        className={`rounded-full px-2.5 py-1 transition-colors disabled:cursor-not-allowed ${
          !value
            ? "bg-gray-700 text-white shadow"
            : "text-[var(--muted)] hover:text-foreground"
        }`}
      >
        {labelOff}
      </button>
    </div>
      <span className="inline-flex w-3 justify-start">
        {status === "saving" && (
          <Loader2 className="h-3 w-3 animate-spin text-[var(--muted)]" />
        )}
        {status === "saved" && <Check className="h-3 w-3 text-green-500" />}
      </span>
    </div>
  );
}
