"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Plus, Trash2, Lock } from "lucide-react";
import { crearMarca, borrarMarca } from "@/app/admin/marcas/actions";

type Fila = {
  id: string;
  name: string;
  logo: string | null;
  /** Las que vienen en el codigo no se borran desde el panel. */
  editable: boolean;
  productos: number;
};

export function MarcasAdmin({ marcas }: { marcas: Fila[] }) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);

  function agregar(fd: FormData) {
    setError(null);
    setOk(null);
    iniciar(async () => {
      const r = await crearMarca(fd);
      if (r.error) setError(r.error);
      else {
        setOk("Marca agregada");
        form.current?.reset();
      }
    });
  }

  function borrar(f: Fila) {
    setError(null);
    setOk(null);
    if (!confirm(`¿Borrar la marca "${f.name}"?`)) return;
    iniciar(async () => {
      const r = await borrarMarca(f.id);
      if (r.error) setError(r.error);
      else setOk("Marca borrada");
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <form
        ref={form}
        action={agregar}
        className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm"
      >
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">
          Agregar marca
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.4fr_auto]">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Nombre
            </label>
            <input
              name="nombre"
              required
              maxLength={40}
              placeholder="Narf"
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Logo (opcional)
            </label>
            <input
              name="logo"
              placeholder="https://… o /brand/marcas/narf.png"
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
            />
          </div>
          <button
            type="submit"
            disabled={pendiente}
            className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-5 font-display text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          Sin logo la marca funciona igual como filtro, pero no sale en la
          grilla de marcas del inicio.
        </p>
        {error && (
          <p className="mt-3 text-xs font-medium text-[var(--brand-red)]">{error}</p>
        )}
        {ok && <p className="mt-3 text-xs font-medium text-green-700">{ok}</p>}
      </form>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="bg-[var(--surface)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Marca</th>
              <th className="px-4 py-3">Identificador</th>
              <th className="px-4 py-3 text-right">Productos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {marcas.map((m) => (
              <tr key={m.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.logo ? (
                      <Image
                        src={m.logo}
                        alt=""
                        width={64}
                        height={24}
                        unoptimized
                        className="h-6 w-auto max-w-[64px] object-contain"
                      />
                    ) : (
                      <span className="inline-flex h-6 w-16 items-center justify-center rounded bg-[var(--surface)] text-[9px] uppercase text-[var(--muted)]">
                        sin logo
                      </span>
                    )}
                    <span className="font-medium">{m.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                  {m.id}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {m.productos > 0 ? (
                    <a
                      href={`/admin/productos?marca=${m.id}`}
                      className="font-bold text-[var(--brand-red)] hover:underline"
                    >
                      {m.productos}
                    </a>
                  ) : (
                    <span className="text-[var(--muted)]">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.editable ? (
                    <button
                      type="button"
                      onClick={() => borrar(m)}
                      disabled={pendiente}
                      title="Borrar marca"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-red-50 hover:text-[var(--brand-red)] disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span
                      title="Viene en el código del sitio"
                      className="inline-flex h-8 w-8 items-center justify-center text-[var(--border)]"
                    >
                      <Lock className="h-4 w-4" />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
