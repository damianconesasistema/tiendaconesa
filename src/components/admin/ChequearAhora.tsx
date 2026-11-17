"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { chequearAhora } from "@/app/admin/novedades/actions";

export function ChequearAhora() {
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={pendiente}
        onClick={() =>
          iniciar(async () => {
            setMsg(null);
            const r = await chequearAhora();
            if (r.error) setMsg(r.error);
            else {
              setMsg(r.novedades ? `Listo: ${r.novedades} novedades.` : "Listo: nada nuevo desde el último chequeo.");
              router.refresh();
            }
          })
        }
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 font-display text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
      >
        {pendiente ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Chequear ahora
      </button>
      {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
    </div>
  );
}
