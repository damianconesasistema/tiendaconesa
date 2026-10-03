"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// Reloj en vivo (hora local Argentina). Refresca cada segundo.
// Evita hydration mismatch: no renderiza nada hasta que monta en cliente.
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    // Placeholder del mismo ancho para evitar layout shift
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[var(--muted)]">
        <Clock className="h-3 w-3 opacity-50" />
        <span className="opacity-30">--/--/---- --:--:--</span>
      </span>
    );
  }

  const date = now.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[var(--muted)]"
      title="Hora local de Argentina (Córdoba)"
    >
      <Clock className="h-3 w-3" />
      <span className="hidden sm:inline">{date}</span>
      <span className="font-bold text-foreground">{time}</span>
    </span>
  );
}
