"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { CampoClave } from "@/components/admin/CampoClave";

/** `inicio`: a donde va despues de entrar si no vino de ninguna pantalla.
 *  El panel ("/admin") o el sistema Punto ("/sistema/demo"). */
export function LoginForm({ inicio = "/admin" }: { inicio?: string }) {
  const router = useRouter();
  // Vacio: cada uno entra con su usuario (antes venia escrito "admin").
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || "Error");
        return;
      }
      // Solo una ruta del panel o del sistema: nunca a otro sitio.
      const volver = new URLSearchParams(window.location.search).get("volver") ?? "";
      const vale = (volver.startsWith("/admin/") || volver.startsWith("/sistema/")) && !volver.startsWith("//");
      const destino = vale ? volver : inicio;
      // El sistema Punto no es una pantalla de Next: se entra con la pagina entera.
      if (destino.startsWith("/sistema/")) {
        window.location.assign(destino);
        return;
      }
      router.push(destino);
      router.refresh();
    } catch {
      setError("No se pudo conectar. Reintentá en unos segundos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Usuario
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className="w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-red)]"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Contraseña
        </label>
        <CampoClave
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--brand-red)]"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[var(--brand-red-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {loading ? "Verificando..." : "Entrar"}
      </button>
    </form>
  );
}
