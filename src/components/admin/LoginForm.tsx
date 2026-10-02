"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
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
      router.push("/admin");
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
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 outline-none transition focus:border-[var(--brand-red)]"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 outline-none transition focus:border-[var(--brand-red)]"
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
