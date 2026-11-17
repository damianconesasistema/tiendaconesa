"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Loader2, Check, X, ExternalLink, Minus } from "lucide-react";
import {
  completarFVEnTanda,
  terminarFV,
  type Incompleto,
  type ResultadoTanda,
} from "@/app/admin/productos/fotos-fv/actions";
import { rutaAdminProducto } from "@/lib/rutas-producto";

// La pantalla "Fotos de la web": recorre los articulos de las marcas con
// pagina oficial (FV, Piazza) a los que les falta foto o descripcion, de a cuatro (lo que acepta el servidor
// por pedido), y va mostrando el avance y que paso con cada uno.
// Ver src/lib/fv.ts.

const POR_TANDA = 2;

export function FotosFVMasivo({ pendientes }: { pendientes: Incompleto[] }) {
  const [corriendo, setCorriendo] = useState(false);
  const [hechos, setHechos] = useState(0);
  const [resultados, setResultados] = useState<ResultadoTanda[]>([]);
  const [terminado, setTerminado] = useState(false);
  // Si FV solo tiene la foto en otra terminacion (pidio negro y hay cromo).
  // Apagado: es mostrar otro producto. Se puede prender a conciencia.
  const [otraTerminacion, setOtraTerminacion] = useState(false);

  const titulo = new Map(pendientes.map((p) => [p.itemId, p.title]));
  const sinFoto = pendientes.filter((p) => p.faltaFoto).length;
  const sinDescripcion = pendientes.filter((p) => p.faltaDescripcion).length;
  // "FV y Piazza": las marcas que de verdad hay en la lista.
  const marcas = [...new Set(pendientes.map((p) => p.marca).filter(Boolean))];
  const deMarcas =
    marcas.length > 1
      ? `${marcas.slice(0, -1).join(", ")} y ${marcas[marcas.length - 1]}`
      : (marcas[0] ?? "");

  async function arrancar() {
    setCorriendo(true);
    setTerminado(false);
    setHechos(0);
    setResultados([]);
    for (let i = 0; i < pendientes.length; i += POR_TANDA) {
      const tanda = pendientes.slice(i, i + POR_TANDA).map((p) => ({
        itemId: p.itemId,
        faltaFoto: p.faltaFoto,
        faltaDescripcion: p.faltaDescripcion,
      }));
      const r = await completarFVEnTanda(tanda, otraTerminacion);
      setResultados((prev) => [...prev, ...r]);
      setHechos(Math.min(i + POR_TANDA, pendientes.length));
    }
    await terminarFV();
    setCorriendo(false);
    setTerminado(true);
  }

  if (pendientes.length === 0)
    return (
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
        <Check className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-3 font-display text-sm font-bold uppercase tracking-wider">
          Todos los artículos de las marcas con página tienen foto y descripción
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Para cambiar alguno en particular, entrá al artículo: ahí están
          &quot;Traer foto&quot; de la marca y, al lado de la descripción,
          &quot;Buscar en la web&quot;.
        </p>
      </div>
    );

  const fotosPuestas = resultados.filter((r) => r.foto?.ok).length;
  const descripcionesPuestas = resultados.filter((r) => r.descripcion?.ok).length;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="text-sm">
          Hay <strong>{pendientes.length}</strong> artículo
          {pendientes.length === 1 ? "" : "s"} de {deMarcas} para completar:{" "}
          <strong>{sinFoto}</strong> sin foto y <strong>{sinDescripcion}</strong>{" "}
          sin descripción.
        </p>

        {marcas.includes("FV") && (
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={otraTerminacion}
            onChange={(e) => setOtraTerminacion(e.target.checked)}
            disabled={corriendo}
            className="mt-0.5 h-4 w-4 accent-[var(--brand-red)]"
          />
          <span>
            Si FV no tiene la foto de esa terminación, usar la de otra
            <span className="block text-xs text-[var(--muted)]">
              Por ejemplo, la foto en cromo para un artículo negro. Apagado,
              esos quedan sin foto y se listan abajo para revisarlos.
            </span>
          </span>
        </label>
        )}

        <button
          type="button"
          onClick={arrancar}
          disabled={corriendo}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white disabled:opacity-60"
        >
          {corriendo ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {corriendo ? "Buscando en la web…" : "Buscar en la web"}
        </button>

        {(corriendo || terminado) && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>
                {hechos} de {pendientes.length}
              </span>
              <span className="text-[var(--muted)]">
                {fotosPuestas} foto{fotosPuestas === 1 ? "" : "s"} ·{" "}
                {descripcionesPuestas} descripci
                {descripcionesPuestas === 1 ? "ón" : "ones"}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className="h-full rounded-full bg-[var(--brand-red)] transition-all duration-300"
                style={{ width: `${Math.round((hechos / pendientes.length) * 100)}%` }}
              />
            </div>
            {terminado && (
              <p className="mt-3 text-sm font-semibold text-emerald-700">
                Terminado: {fotosPuestas} foto{fotosPuestas === 1 ? "" : "s"} y{" "}
                {descripcionesPuestas} descripci
                {descripcionesPuestas === 1 ? "ón" : "ones"} nuevas.
              </p>
            )}
          </div>
        )}
      </div>

      {resultados.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface)] text-left font-display text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              <tr>
                <th className="px-4 py-2.5">Código</th>
                <th className="px-4 py-2.5">Artículo</th>
                <th className="px-4 py-2.5">Foto</th>
                <th className="px-4 py-2.5">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.itemId} className="border-t border-[var(--border)] align-top">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">
                    <Link
                      href={rutaAdminProducto(r.itemId)}
                      className="hover:text-[var(--brand-red)] hover:underline"
                    >
                      {r.itemId}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{titulo.get(r.itemId)}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <Celda r={r.foto} hecho="Puesta" />
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    <Celda r={r.descripcion} hecho="Puesta" />
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

/** Que paso con la foto o con la descripcion de un articulo. Sin resultado:
 *  no le faltaba, no se toco. */
function Celda({
  r,
  hecho,
}: {
  r?: { ok: boolean; motivo?: string; ficha?: string };
  hecho: string;
}) {
  if (!r)
    return (
      <span className="inline-flex items-center gap-1 text-[var(--muted)]">
        <Minus className="h-3.5 w-3.5" /> Ya tenía
      </span>
    );
  if (r.ok)
    return (
      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
        <Check className="h-3.5 w-3.5" /> {hecho}
      </span>
    );
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 text-amber-800">
      <X className="h-3.5 w-3.5" /> {r.motivo}
      {r.ficha && (
        <a
          href={r.ficha}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 font-bold underline"
        >
          ver ficha <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </span>
  );
}
