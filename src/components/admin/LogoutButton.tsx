"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    // Navegacion entera (no del router): que no quede nada de la sesion vieja.
    window.location.assign("/admin/login");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      Salir
    </button>
  );
}
