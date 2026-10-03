"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { quickUpdate } from "@/app/admin/productos/actions";
import { formatPrice } from "@/lib/order";

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
  const [value, setValue] = useState<string>(initial === null ? "" : String(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function commit() {
    const current = initial === null ? "" : String(initial);
    if (value === current) return; // sin cambios
    if (value === "" && !allowNull) {
      setValue(current);
      return;
    }
    startTransition(async () => {
      setStatus("saving");
      setError(null);
      const payload = value === "" ? null : Number(value);
      const r = await quickUpdate(itemId, field, payload);
      if (r.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("error");
        setError(r.error ?? "Error");
        setTimeout(() => setStatus("idle"), 2500);
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-end">
      <div className="inline-flex items-center gap-1.5">
        {prefix && <span className="text-xs text-[var(--muted)]">{prefix}</span>}
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setValue(initial === null ? "" : String(initial));
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={allowNull ? "—" : "0"}
          className={`h-8 w-24 rounded border bg-white px-2 text-right font-display text-sm font-bold outline-none focus:ring-2 ${
            status === "error"
              ? "border-red-400 focus:border-red-500 focus:ring-red-200"
              : status === "saved"
                ? "border-green-400 focus:ring-green-200"
                : "border-[var(--border)] focus:border-[var(--brand-red)] focus:ring-[var(--brand-red)]/20"
          } ${className}`}
        />
        <span className="inline-flex w-3 justify-start">
          {status === "saving" && (
            <Loader2 className="h-3 w-3 animate-spin text-[var(--muted)]" />
          )}
          {status === "saved" && <Check className="h-3 w-3 text-green-500" />}
        </span>
      </div>
      {error && (
        <span className="mt-0.5 text-[10px] text-red-500">{error}</span>
      )}
    </div>
  );
}

// Toggle para activo/destacado
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

  function toggle() {
    const next = !value;
    setValue(next);
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
