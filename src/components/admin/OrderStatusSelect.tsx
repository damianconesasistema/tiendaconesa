"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";

const STATUSES = [
  { id: "pendiente", label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  { id: "confirmado", label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  { id: "en_preparacion", label: "En preparación", color: "bg-indigo-100 text-indigo-800" },
  { id: "en_entrega", label: "En entrega", color: "bg-purple-100 text-purple-800" },
  { id: "entregado", label: "Entregado", color: "bg-green-100 text-green-800" },
  { id: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700" },
];

export function OrderStatusSelect({
  orderId,
  current,
  action,
}: {
  orderId: string;
  current: string;
  action: (orderId: string, status: string) => Promise<{ error?: string; ok?: boolean }>;
}) {
  const [status, setStatus] = useState(current);
  const [pending, startTransition] = useTransition();
  const [showOk, setShowOk] = useState(false);

  const current_meta = STATUSES.find((s) => s.id === status) || STATUSES[0];

  function handleChange(newStatus: string) {
    setStatus(newStatus);
    startTransition(async () => {
      const r = await action(orderId, newStatus);
      if (r.ok) {
        setShowOk(true);
        setTimeout(() => setShowOk(false), 2000);
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {showOk && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
          <Check className="h-3.5 w-3.5" />
          Guardado
        </span>
      )}
      <label className="relative inline-flex items-center">
        <span
          className={`pointer-events-none absolute left-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${current_meta.color}`}
        >
          {current_meta.label}
        </span>
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value)}
          disabled={pending}
          className="h-11 min-w-[200px] rounded-full border border-[var(--border)] bg-white pl-[142px] pr-4 text-sm outline-none focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 disabled:opacity-60"
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
