"use client";

import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  Check,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import {
  previsualizarAlta,
  crearArticulos,
  type PreviewAltaResult,
  type ArticuloNuevo,
  type AltaResult,
} from "@/app/admin/productos/alta/actions";
import { formatPrice } from "@/lib/order";

/** Cuantas fichas se dibujan de una. El archivo del sistema puede traer
 *  miles de filas; pintarlas todas cuelga el navegador. */
const DE_A = 25;

type Edicion = {
  titulo?: string;
  marca?: string | null;
  categoria?: string;
  unPago?: number;
  stock?: number;
};

type Filtro = "todos" | "sin-rubro" | "sin-marca" | "margen";

export function AltaArticulosFlow({ dctoContado }: { dctoContado: number }) {
  const [stage, setStage] = useState<"subir" | "revisar" | "listo">("subir");
  const [prev, setPrev] = useState<PreviewAltaResult | null>(null);
  const [resultado, setResultado] = useState<AltaResult | null>(null);
  const [ediciones, setEdiciones] = useState<Record<string, Edicion>>({});
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [visibles, setVisibles] = useState(DE_A);
  const [publicar, setPublicar] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendiente, startTransition] = useTransition();

  const nuevos = prev?.nuevos ?? [];
  // El mismo recargo con el que el servidor va a hacer la cuenta. Se usa el
  // de verdad y no el descuento redondeado, para que el numero que se ve en
  // pantalla sea exactamente el que se guarda.
  const recargo = prev?.recargoUnPago ?? 0;

  /** El articulo con las correcciones que se hicieron en pantalla. */
  const conEdicion = (a: ArticuloNuevo) => {
    const e = ediciones[a.itemCode] ?? {};
    const unPago = e.unPago ?? a.unPago;
    return {
      ...a,
      titulo: e.titulo ?? a.titulo,
      marca: e.marca !== undefined ? e.marca : a.marca,
      categoria: e.categoria ?? a.categoria,
      unPago,
      stock: e.stock ?? a.stock,
      contado: Math.round(unPago / (1 + recargo / 100)),
    };
  };

  const filtrados = useMemo(() => {
    if (filtro === "todos") return nuevos;
    if (filtro === "sin-rubro")
      return nuevos.filter((a) => conEdicion(a).categoria === "otros");
    if (filtro === "sin-marca")
      return nuevos.filter((a) => !conEdicion(a).marca);
    return nuevos.filter((a) => a.margenPct !== null && a.margenPct < 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevos, filtro, ediciones]);

  const elegidos = nuevos.filter((a) => !excluidos.has(a.itemCode));

  function subir(file: File) {
    setNombreArchivo(file.name);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      const r = await previsualizarAlta(fd);
      setPrev(r);
      setEdiciones({});
      setExcluidos(new Set());
      setFiltro("todos");
      setVisibles(DE_A);
      if (r.ok) setStage("revisar");
    });
  }

  function editar(itemCode: string, cambio: Edicion) {
    setEdiciones((e) => ({ ...e, [itemCode]: { ...e[itemCode], ...cambio } }));
  }

  function alternar(itemCode: string) {
    setExcluidos((s) => {
      const n = new Set(s);
      if (n.has(itemCode)) n.delete(itemCode);
      else n.add(itemCode);
      return n;
    });
  }

  function crear() {
    if (elegidos.length === 0) return;
    startTransition(async () => {
      const r = await crearArticulos(
        elegidos.map((a) => {
          const c = conEdicion(a);
          return {
            itemCode: c.itemCode,
            titulo: c.titulo,
            marca: c.marca,
            categoria: c.categoria,
            unPago: c.unPago,
            stock: c.stock,
            descripcionGBP: c.descripcionGBP,
          };
        }),
        { publicar },
      );
      setResultado(r);
      if (r.ok) setStage("listo");
    });
  }

  function empezarDeNuevo() {
    setStage("subir");
    setPrev(null);
    setResultado(null);
    setEdiciones({});
    setExcluidos(new Set());
    setNombreArchivo(null);
  }

  // ------------------------------------------------------------- subir

  if (stage === "subir")
    return (
      <div className="mt-8">
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--border)] bg-white px-6 py-16 text-center transition-colors hover:border-[var(--brand-red)]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) subir(f);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subir(f);
            }}
          />
          {pendiente ? (
            <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-red)]" />
          ) : (
            <Upload className="h-10 w-10 text-[var(--muted)]" />
          )}
          <p className="font-display text-sm font-bold uppercase tracking-wider">
            {pendiente ? "Leyendo el archivo…" : "Soltá acá el Excel de GBP"}
          </p>
          <p className="max-w-md text-sm text-[var(--muted)]">
            El que exporta el sistema, tal cual sale. Nada se crea hasta que
            revises artículo por artículo en la pantalla siguiente.
          </p>
        </label>

        {prev && !prev.ok && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm text-red-800">{prev.error}</p>
          </div>
        )}
      </div>
    );

  // ------------------------------------------------------------- listo

  if (stage === "listo" && resultado)
    return (
      <div className="mt-8">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
          <Check className="mx-auto h-12 w-12 text-green-600" />
          <p className="mt-4 font-display text-2xl font-black uppercase">
            {resultado.creados} artículo
            {resultado.creados === 1 ? "" : "s"} creado
            {resultado.creados === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {publicar
              ? "Quedaron publicados en la tienda."
              : "Quedaron ocultos: se ven en el panel, el cliente todavía no los ve. Cargales la foto y publicalos."}
          </p>

          {resultado.omitidos && resultado.omitidos.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
              <p className="text-sm font-medium text-amber-900">
                {resultado.omitidos.length} quedaron afuera:
              </p>
              <ul className="mt-1 space-y-0.5 text-sm text-amber-800">
                {resultado.omitidos.slice(0, 20).map((o) => (
                  <li key={o.itemCode}>
                    {o.itemCode} — {o.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/admin/productos"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white"
            >
              Ver los productos
            </Link>
            <button
              onClick={empezarDeNuevo}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider"
            >
              <RotateCcw className="h-4 w-4" />
              Subir otro Excel
            </button>
          </div>
        </div>
      </div>
    );

  // ------------------------------------------------------------ revisar

  const s = prev?.stats;
  const rubros = prev?.rubros ?? [];
  const marcas = prev?.marcas ?? [];

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <FileSpreadsheet className="h-4 w-4" />
        {nombreArchivo}
        {prev?.sucursal && <> · se carga en {prev.sucursal}</>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tarjeta label="Filas en el Excel" valor={s?.total ?? 0} />
        <Tarjeta label="Ya están cargados" valor={s?.yaEstan ?? 0} />
        <Tarjeta
          label="Para dar de alta"
          valor={s?.nuevos ?? 0}
          tono="verde"
        />
        <Tarjeta
          label="Margen flojo"
          valor={s?.margenFlojo ?? 0}
          tono={s?.margenFlojo ? "rojo" : undefined}
        />
      </div>

      {prev?.regla && (
        <p className="mt-4 text-sm text-[var(--muted)]">{prev.regla}</p>
      )}
      {prev?.avisos?.map((a) => (
        <p key={a} className="mt-2 text-sm text-amber-700">
          {a}
        </p>
      ))}

      {s?.nuevos === 0 ? (
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-white px-4 py-6 text-center text-sm text-[var(--muted)]">
          Todos los códigos de este archivo ya están cargados. Para cambiarles
          el precio o el stock, usá{" "}
          <Link
            href="/admin/productos/importar"
            className="font-medium text-[var(--brand-red)]"
          >
            Precios y stock por Excel
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Chip activo={filtro === "todos"} onClick={() => setFiltro("todos")}>
              Todos ({s?.nuevos ?? 0})
            </Chip>
            <Chip
              activo={filtro === "sin-rubro"}
              onClick={() => setFiltro("sin-rubro")}
            >
              Sin rubro ({s?.sinRubro ?? 0})
            </Chip>
            <Chip
              activo={filtro === "sin-marca"}
              onClick={() => setFiltro("sin-marca")}
            >
              Sin marca ({s?.sinMarca ?? 0})
            </Chip>
            <Chip
              activo={filtro === "margen"}
              onClick={() => setFiltro("margen")}
            >
              Margen flojo ({s?.margenFlojo ?? 0})
            </Chip>
          </div>

          <div className="mt-4 space-y-3">
            {filtrados.slice(0, visibles).map((a) => (
              <Ficha
                key={a.itemCode}
                a={conEdicion(a)}
                original={a}
                incluido={!excluidos.has(a.itemCode)}
                rubros={rubros}
                marcas={marcas}
                dctoContado={dctoContado}
                onAlternar={() => alternar(a.itemCode)}
                onEditar={(c) => editar(a.itemCode, c)}
              />
            ))}
          </div>

          {filtrados.length > visibles && (
            <button
              onClick={() => setVisibles((v) => v + DE_A)}
              className="mt-4 w-full rounded-full border border-[var(--border)] bg-white px-5 py-3 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)]"
            >
              Ver {Math.min(DE_A, filtrados.length - visibles)} más · quedan{" "}
              {filtrados.length - visibles}
            </button>
          )}

          <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-4 border-t border-[var(--border)] bg-[var(--surface)] py-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={publicar}
                onChange={(e) => setPublicar(e.target.checked)}
                className="h-4 w-4"
              />
              Publicarlos ya en la tienda
            </label>
            <span className="text-sm text-[var(--muted)]">
              {publicar
                ? "Van a salir sin foto."
                : "Nacen ocultos hasta que les cargues la foto."}
            </span>
            <button
              onClick={crear}
              disabled={pendiente || elegidos.length === 0}
              className="ml-auto inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40"
            >
              {pendiente ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Crear {elegidos.length} artículo
              {elegidos.length === 1 ? "" : "s"}
            </button>
          </div>
        </>
      )}

      {resultado && !resultado.ok && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{resultado.error}</p>
        </div>
      )}
    </div>
  );
}

function Tarjeta({
  label,
  valor,
  tono,
}: {
  label: string;
  valor: number;
  tono?: "verde" | "rojo";
}) {
  const color =
    tono === "verde"
      ? "text-green-700"
      : tono === "rojo"
        ? "text-red-700"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`mt-1 font-display text-2xl font-black ${color}`}>
        {valor}
      </p>
    </div>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
        activo
          ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white"
          : "border-[var(--border)] bg-white text-[var(--muted)] hover:border-[var(--brand-red)]"
      }`}
    >
      {children}
    </button>
  );
}

function Ficha({
  a,
  original,
  incluido,
  rubros,
  marcas,
  dctoContado,
  onAlternar,
  onEditar,
}: {
  a: ArticuloNuevo;
  original: ArticuloNuevo;
  incluido: boolean;
  rubros: { slug: string; name: string }[];
  marcas: { id: string; name: string }[];
  dctoContado: number;
  onAlternar: () => void;
  onEditar: (c: Edicion) => void;
}) {
  const margenFlojo = a.margenPct !== null && a.margenPct < 10;
  return (
    <div
      className={`rounded-xl border bg-white p-4 ${
        incluido ? "border-[var(--border)]" : "border-dashed border-[var(--border)] opacity-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={incluido}
          onChange={onAlternar}
          className="mt-2 h-4 w-4 shrink-0"
          aria-label={`Dar de alta ${a.itemCode}`}
        />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-[var(--muted)]">
            Código {a.itemCode}
          </p>
          <input
            type="text"
            value={a.titulo}
            onChange={(e) => onEditar({ titulo: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            aria-label="Título"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            En GBP: {a.descripcionGBP}
            {a.titulo !== original.descripcionGBP && (
              <button
                onClick={() => onEditar({ titulo: original.descripcionGBP })}
                className="ml-2 font-medium text-[var(--brand-red)]"
              >
                usar este
              </button>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-[var(--muted)]">Marca</label>
          <select
            value={a.marca ?? ""}
            onChange={(e) => onEditar({ marca: e.target.value || null })}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <option value="">Sin marca</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {original.marca
              ? "de la columna del sistema"
              : original.marcaGBP
                ? `el sistema dice "${original.marcaGBP}", que no está en tu lista de marcas`
                : "el archivo no trae marca"}
          </p>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Rubro</label>
          <select
            value={a.categoria}
            onChange={(e) => onEditar({ categoria: e.target.value })}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            {rubros.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name}
              </option>
            ))}
          </select>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">
            {original.motivoCategoria}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-[var(--border)] pt-3 sm:grid-cols-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Precio 1 pago</label>
          <input
            type="number"
            value={a.unPago}
            onChange={(e) => onEditar({ unPago: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            transferencia {formatPrice(a.contado)} ({dctoContado}% menos)
          </p>
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">Stock</label>
          <input
            type="number"
            value={a.stock}
            onChange={(e) => onEditar({ stock: Number(e.target.value) || 0 })}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <p className="text-xs text-[var(--muted)]">Costo</p>
          <p className="mt-1 py-2 text-sm">
            {a.costo !== null ? formatPrice(a.costo) : "no vino en el archivo"}
          </p>
          {a.margenPct !== null && (
            <p
              className={`text-xs ${margenFlojo ? "text-red-700" : "text-[var(--muted)]"}`}
            >
              margen {a.margenPct}%
            </p>
          )}
        </div>
      </div>

      {margenFlojo && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-xs text-red-800">
            Con el precio de transferencia este artículo deja {a.margenPct}%
            sobre el costo. Revisalo en GBP antes de publicarlo.
          </p>
        </div>
      )}
    </div>
  );
}
