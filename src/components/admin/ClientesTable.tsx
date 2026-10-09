"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, Trash2, Mail, Phone } from "lucide-react";
import { formatPrice } from "@/lib/order";
import { borrarCliente } from "@/app/admin/clientes/actions";

type Cliente = {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  desde: string;
  pedidos: number;
  gastado: number;
};

export function ClientesTable({ clientes, q }: { clientes: Cliente[]; q: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [input, setInput] = useState(q);
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) {
        router.push(input ? `${pathname}?q=${encodeURIComponent(input)}` : pathname);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  function borrar(c: Cliente) {
    setError(null);
    if (!confirm(`¿Borrar a ${c.nombre}? No se puede deshacer.`)) return;
    iniciar(async () => {
      const r = await borrarCliente(c.id);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });

  return (
    <div className="mt-6 space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Buscar por nombre, DNI, mail o teléfono…"
          className="h-11 w-full rounded-full border border-[var(--border)] bg-white pl-11 pr-4 text-sm outline-none focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-[var(--brand-red)]/30 bg-red-50 px-4 py-3 text-sm font-medium text-[var(--brand-red)]">
          {error}
        </p>
      )}

      {clientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-12 text-center">
          <p className="font-display text-lg font-bold uppercase">Sin clientes</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Se cargan solos cuando alguien completa una compra.
          </p>
        </div>
      ) : (
        /* overflow-x-auto + min-w: en el celular la tabla se arrastra en vez
           de quedar recortada y dejar la columna de acciones afuera. */
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="bg-[var(--surface)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">DNI</th>
                <th className="px-4 py-3 text-right">Pedidos</th>
                <th className="px-4 py-3 text-right">Gastado</th>
                <th className="px-4 py-3">Desde</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 font-medium">{c.nombre || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs">
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--brand-red)]"
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          {c.email}
                        </a>
                      )}
                      {c.telefono && (
                        <a
                          href={`https://wa.me/${c.telefono.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--brand-red)]"
                        >
                          <Phone className="h-3 w-3 shrink-0" />
                          {c.telefono}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                    {c.dni || "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.pedidos > 0 ? (
                      <Link
                        href={`/admin/pedidos?q=${encodeURIComponent(c.nombre)}`}
                        className="font-bold text-[var(--brand-red)] hover:underline"
                      >
                        {c.pedidos}
                      </Link>
                    ) : (
                      <span className="text-[var(--muted)]">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatPrice(c.gastado)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted)]">
                    {fecha(c.desde)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => borrar(c)}
                      disabled={pendiente}
                      title={
                        c.pedidos > 0
                          ? "Tiene pedidos: hay que borrarlos primero"
                          : "Borrar cliente"
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-red-50 hover:text-[var(--brand-red)] disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
