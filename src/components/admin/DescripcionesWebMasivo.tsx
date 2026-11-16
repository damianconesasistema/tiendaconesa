"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Globe, Loader2, Check, AlertTriangle, Square, Save } from "lucide-react";
import {
  buscarDescripcionesEnTanda,
  guardarDescripciones,
  type Encontrada,
  type Fuente,
} from "@/app/admin/productos/descripciones/actions";
import { rutaAdminProducto } from "@/lib/rutas-producto";

// La pantalla "Buscar descripciones en la web": va pidiendo de a dos (cada
// busqueda en internet tarda unos segundos), muestra cada texto en un cuadro
// que se puede corregir, y guarda solo los tildados. Ver
// src/app/admin/productos/descripciones/actions.ts.

const POR_TANDA = 2;

type Pendiente = { itemId: string; title: string; brand: string | null };

type Fila = {
  itemId: string;
  texto: string;
  fuente: Fuente;
  fuentes?: string[];
  tildada: boolean;
  guardada?: boolean;
};

const ETIQUETA: Record<Fuente, string> = {
  fv: "Página oficial de FV",
  web: "Buscada en internet",
  titulo: "Sin búsqueda en internet: escrita solo con el título. Revisala bien.",
};

export function DescripcionesWebMasivo({
  pendientes,
  iaDisponible,
}: {
  pendientes: Pendiente[];
  iaDisponible: boolean;
}) {
  const [corriendo, setCorriendo] = useState(false);
  const [hechos, setHechos] = useState(0);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [fallidas, setFallidas] = useState<{ itemId: string; motivo: string }[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const parar = useRef(false);

  const titulo = new Map(pendientes.map((p) => [p.itemId, p.title]));
  const sinFV = pendientes.filter((p) => p.brand !== "fv").length;

  async function buscar() {
    parar.current = false;
    setCorriendo(true);
    setAviso(null);
    setHechos(0);
    setFilas([]);
    setFallidas([]);
    for (let i = 0; i < pendientes.length; i += POR_TANDA) {
      if (parar.current) break;
      const tanda = pendientes.slice(i, i + POR_TANDA).map((p) => p.itemId);
      let r: Encontrada[] = [];
      try {
        r = await buscarDescripcionesEnTanda(tanda);
      } catch (e) {
        setAviso(`Se cortó la conexión: ${(e as Error).message}. Podés volver a tocar Buscar.`);
        break;
      }
      const ok = r.filter((x): x is Extract<Encontrada, { ok: true }> => x.ok);
      const mal = r.filter((x): x is Extract<Encontrada, { ok: false }> => !x.ok);
      setFilas((prev) => [
        ...prev,
        ...ok.map((x) => ({
          itemId: x.itemId,
          texto: x.texto,
          fuente: x.fuente,
          fuentes: x.fuentes,
          // Las escritas sin buscar en internet pueden traer datos
          // inventados: arrancan destildadas.
          tildada: x.fuente !== "titulo",
        })),
      ]);
      setFallidas((prev) => [...prev, ...mal.map((x) => ({ itemId: x.itemId, motivo: x.motivo }))]);
      setHechos(Math.min(i + POR_TANDA, pendientes.length));
      // Google corta por limite de uso: seguir solo sumaria errores.
      if (mal.some((x) => /límite|saturado|cupo/i.test(x.motivo))) {
        setAviso(
          "Google cortó por límite de uso. Guardá lo que ya salió y volvé a intentar más tarde: los que falten van a seguir en la lista.",
        );
        break;
      }
    }
    setCorriendo(false);
  }

  async function guardar() {
    const elegidas = filas.filter((f) => f.tildada && !f.guardada);
    if (elegidas.length === 0) return;
    setGuardando(true);
    let guardadas = 0;
    let saltadas = 0;
    // De a 50: lo que acepta el servidor por pedido.
    for (let i = 0; i < elegidas.length; i += 50) {
      const r = await guardarDescripciones(
        elegidas.slice(i, i + 50).map((f) => ({ itemId: f.itemId, texto: f.texto })),
      );
      guardadas += r.guardadas;
      saltadas += r.saltadas;
    }
    const hechas = new Set(elegidas.map((f) => f.itemId));
    setFilas((prev) => prev.map((f) => (hechas.has(f.itemId) ? { ...f, guardada: true } : f)));
    setAviso(
      `Guardadas: ${guardadas}.` +
        (saltadas ? ` ${saltadas} no se guardaron porque ya tenían descripción o quedaron vacías.` : ""),
    );
    setGuardando(false);
  }

  const cambiar = (itemId: string, cambio: Partial<Fila>) =>
    setFilas((prev) => prev.map((f) => (f.itemId === itemId ? { ...f, ...cambio } : f)));

  if (pendientes.length === 0)
    return (
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
        <Check className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-3 font-display text-sm font-bold uppercase tracking-wider">
          No hay productos sin descripción con ese filtro
        </p>
      </div>
    );

  const tildadas = filas.filter((f) => f.tildada && !f.guardada).length;

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="text-sm">
          Hay <strong>{pendientes.length}</strong> producto
          {pendientes.length === 1 ? "" : "s"} sin descripción.
        </p>
        {!iaDisponible && sinFV > 0 && (
          <p className="mt-2 text-sm text-amber-800">
            La búsqueda en internet no está configurada: solo se van a poder
            completar los FV, desde la página de FV.
          </p>
        )}
        <p className="mt-2 text-xs text-[var(--muted)]">
          Cada producto tarda unos segundos. Google da un cupo chico de
          búsquedas por día: si se acaba, la IA escribe solo con el título y
          esas quedan destildadas para que las revises.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!corriendo ? (
            <button
              type="button"
              onClick={buscar}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white"
            >
              <Globe className="h-4 w-4" />
              Buscar en la web
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (parar.current = true)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 font-display text-sm font-bold uppercase tracking-wider"
            >
              <Square className="h-4 w-4" />
              Parar
            </button>
          )}
          {filas.length > 0 && (
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || tildadas === 0}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-black)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white disabled:opacity-50"
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar las tildadas ({tildadas})
            </button>
          )}
        </div>

        {(corriendo || hechos > 0) && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="inline-flex items-center gap-1.5">
                {corriendo && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {hechos} de {pendientes.length}
              </span>
              <span className="text-[var(--muted)]">
                {filas.length} encontradas · {fallidas.length} sin resultado
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className="h-full rounded-full bg-[var(--brand-red)] transition-all duration-300"
                style={{ width: `${Math.round((hechos / pendientes.length) * 100)}%` }}
              />
            </div>
          </div>
        )}
        {aviso && <p className="mt-3 text-sm font-semibold text-amber-800">{aviso}</p>}
      </div>

      {filas.length > 0 && (
        <div className="space-y-3">
          {filas.map((f) => (
            <div
              key={f.itemId}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${
                f.guardada ? "border-emerald-300 opacity-70" : "border-[var(--border)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={f.tildada}
                    disabled={f.guardada}
                    onChange={(e) => cambiar(f.itemId, { tildada: e.target.checked })}
                    className="mt-1 h-4 w-4 accent-[var(--brand-red)]"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{titulo.get(f.itemId)}</span>
                    <Link
                      href={rutaAdminProducto(f.itemId)}
                      target="_blank"
                      className="font-mono text-[11px] text-[var(--muted)] hover:text-[var(--brand-red)] hover:underline"
                    >
                      SKU {f.itemId}
                    </Link>
                  </span>
                </label>
                {f.guardada ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> Guardada
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                      f.fuente === "titulo" ? "text-amber-700" : "text-[var(--muted)]"
                    }`}
                  >
                    {f.fuente === "titulo" && <AlertTriangle className="h-3.5 w-3.5" />}
                    {ETIQUETA[f.fuente]}
                    {f.fuentes?.length ? ` (${f.fuentes.slice(0, 2).join(" · ")})` : ""}
                  </span>
                )}
              </div>
              <textarea
                value={f.texto}
                disabled={f.guardada}
                onChange={(e) => cambiar(f.itemId, { texto: e.target.value })}
                rows={6}
                className="mt-3 w-full resize-y rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-[var(--brand-red)]"
              />
            </div>
          ))}
        </div>
      )}

      {fallidas.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-xs">
          <p className="font-bold uppercase tracking-wider text-[var(--muted)]">
            Sin resultado ({fallidas.length})
          </p>
          <ul className="mt-2 space-y-1">
            {fallidas.map((x) => (
              <li key={x.itemId}>
                <Link
                  href={rutaAdminProducto(x.itemId)}
                  target="_blank"
                  className="font-mono hover:text-[var(--brand-red)] hover:underline"
                >
                  {x.itemId}
                </Link>{" "}
                {titulo.get(x.itemId)} — {x.motivo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
