"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
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
  Globe,
  ImagePlus,
} from "lucide-react";
import {
  previsualizarAlta,
  crearArticulos,
  traerDeFV,
  agregarMarcaDesdeAlta,
  type PreviewAltaResult,
  type ArticuloNuevo,
  type AltaResult,
  type AltaElegida,
  type RespuestaFV,
} from "@/app/admin/productos/alta/actions";
import { uploadOneImage, finishImageBulk } from "@/app/admin/productos/imagenes/actions";
import { formatPrice } from "@/lib/order";
import { subrubrosDe, subrubroSugerido } from "@/lib/subrubros";
import { rubroSugerido } from "@/lib/alta-articulos";
import { MARCAS_BASE } from "@/lib/marcas";

/** Cuantas fichas se dibujan de una. El archivo del sistema puede traer
 *  miles de filas; pintarlas todas cuelga el navegador. */
const DE_A = 25;

/** De a cuantos se le piden a FV y de a cuantos se crean. El servidor corta
 *  un pedido a los 120 segundos, y crear un articulo con su foto de FV lleva
 *  uno o dos: de a 10 queda lejos del corte y se ve avanzar. */
const FV_DE_A = 2;
const CREAR_DE_A = 10;

/** El mismo tope que pone el servidor al subir una foto
 *  (src/app/admin/productos/imagenes/actions.ts). Se avisa al elegirla, no
 *  recien al crear. */
const FOTO_MAX = 10 * 1024 * 1024;

/** Una foto elegida en la compu para un articulo que todavia no existe. Se
 *  guarda en memoria del navegador y se sube recien despues de crearlo. */
type FotoPropia = { file: File; url: string };

type MarcaDeLista = { id: string; name: string; /** Tiene su pagina web cargada en Marcas. */ web?: boolean };

type Edicion = {
  titulo?: string;
  marca?: string | null;
  categoria?: string;
  subrubro?: string | null;
  unPago?: number;
  stock?: number;
  /** La foto de FV elegida. null = sin foto. */
  fotoFV?: string | null;
  /** La descripcion de la ficha de FV. null = sin descripcion. */
  descripcion?: string | null;
};

type Avance = { hechos: number; total: number } | null;

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
  /** Lo que contesto FV por cada codigo. */
  const [fv, setFv] = useState<Record<string, RespuestaFV>>({});
  const [avanceFV, setAvanceFV] = useState<Avance>(null);
  const [avanceAlta, setAvanceAlta] = useState<Avance>(null);
  const [avanceFotos, setAvanceFotos] = useState<Avance>(null);
  /** Las marcas que se agregaron desde esta pantalla. */
  const [marcasNuevas, setMarcasNuevas] = useState<MarcaDeLista[]>([]);
  /** La foto que se eligio en la compu para cada codigo. */
  const [fotosPropias, setFotosPropias] = useState<Record<string, FotoPropia>>({});
  // Para leerlas desde lo que corre en segundo plano (la busqueda en la web)
  // y para soltar la memoria al salir de la pantalla.
  const fotosPropiasRef = useRef(fotosPropias);
  useEffect(() => {
    fotosPropiasRef.current = fotosPropias;
  }, [fotosPropias]);
  useEffect(() => {
    const fotos = fotosPropiasRef;
    return () => {
      for (const f of Object.values(fotos.current)) URL.revokeObjectURL(f.url);
    };
  }, []);

  const nuevos = prev?.nuevos ?? [];

  /** La lista de marcas para elegir: la de la tienda mas las que se
   *  agregaron aca, de la A a la Z (el orden del codigo es el del home y en
   *  un desplegable no le dice nada a nadie). */
  const marcas = useMemo(() => {
    const base = prev?.marcas ?? [];
    const ids = new Set(base.map((m) => m.id));
    return [...base, ...marcasNuevas.filter((m) => !ids.has(m.id))].sort((a, b) =>
      a.name.localeCompare(b.name, "es"),
    );
  }, [prev, marcasNuevas]);

  function sumarMarca(m: MarcaDeLista) {
    setMarcasNuevas((l) => (l.some((x) => x.id === m.id) ? l : [...l, m]));
  }
  // El mismo recargo con el que el servidor va a hacer la cuenta. Se usa el
  // de verdad y no el descuento redondeado, para que el numero que se ve en
  // pantalla sea exactamente el que se guarda.
  const recargo = prev?.recargoUnPago ?? 0;

  /** El articulo con las correcciones que se hicieron en pantalla. */
  const conEdicion = (a: ArticuloNuevo) => {
    const e = ediciones[a.itemCode] ?? {};
    const unPago = e.unPago ?? a.unPago;
    const categoria = e.categoria ?? a.categoria;
    // Si se cambio el rubro, el subrubro viejo puede no existir en el nuevo:
    // "Lavatorio" no es un subrubro de Sanitarios. Ahi queda vacio.
    const sub = e.subrubro !== undefined ? e.subrubro : a.subrubro;
    const subrubro =
      sub && subrubrosDe(categoria).some((x) => x.slug === sub) ? sub : null;
    return {
      ...a,
      titulo: e.titulo ?? a.titulo,
      marca: e.marca !== undefined ? e.marca : a.marca,
      categoria,
      subrubro,
      unPago,
      stock: e.stock ?? a.stock,
      contado: Math.round(unPago / (1 + recargo / 100)),
      fotoFV: e.fotoFV ?? null,
      descripcion: e.descripcion ?? null,
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
      setFv({});
      soltarFotos();
      setMarcaParaTodos(r.ok ? marcaDelArchivo(file.name, r.marcas ?? []) : "");
      if (r.ok) setStage("revisar");
    });
  }

  // --- Fotos propias ---
  // Damian, 17/11/2026: "el tema de las fotos, ahi en la precarga se puede
  // hacer algo o solo cuando estamos ya creado el articulo?". Se eligen aca
  // (archivo, arrastrada o pegada con Ctrl+V) y se suben al crear.

  /** Pone o saca la foto de un articulo. Devuelve el error para mostrarlo en
   *  la ficha, o null si quedo. */
  function ponerFoto(itemCode: string, file: File | null): string | null {
    if (file) {
      if (!file.type.startsWith("image/")) return "Eso no es una imagen.";
      if (file.size > FOTO_MAX) return "Pesa más de 10 MB. Elegí una más liviana.";
    }
    const vieja = fotosPropias[itemCode];
    if (vieja) URL.revokeObjectURL(vieja.url);
    const nueva = file ? { file, url: URL.createObjectURL(file) } : null;
    setFotosPropias((p) => {
      const n = { ...p };
      if (nueva) n[itemCode] = nueva;
      else delete n[itemCode];
      return n;
    });
    // La que se elige a mano manda: la de la pagina del fabricante se
    // destilda (se puede volver a tildar y van las dos).
    if (file) editar(itemCode, { fotoFV: null });
    return null;
  }

  function soltarFotos() {
    for (const f of Object.values(fotosPropiasRef.current)) URL.revokeObjectURL(f.url);
    setFotosPropias({});
  }

  // --- Marca para todos los que no tienen ---
  // Damian, 16/11/2026, con "pagina srl piazza.xlsx": 51 de 68 sin marca,
  // porque GBP no trae la columna y la descripcion casi nunca la nombra. De
  // entrada se propone la que dice el nombre del archivo (se elige al subirlo,
  // en subir()).
  const [marcaParaTodos, setMarcaParaTodos] = useState("");

  const sinMarcaTildados = nuevos.filter(
    (a) => !excluidos.has(a.itemCode) && !conEdicion(a).marca,
  );

  /** Les pone la marca elegida a los tildados que no tienen. Si el rubro no
   *  lo toco nadie, se recalcula con la marca: una canilla Piazza que por las
   *  palabras habia caido en Sanitarios ("LAVATORIO") vuelve a Griferia. */
  function ponerMarcaATodos() {
    if (!marcaParaTodos) return;
    const marca = MARCAS_BASE.find((m) => m.id === marcaParaTodos) ?? null;
    setEdiciones((prevEd) => {
      const n = { ...prevEd };
      for (const a of sinMarcaTildados) {
        const e = n[a.itemCode] ?? {};
        const cambio: Edicion = { marca: marcaParaTodos };
        if (e.categoria === undefined && marca) {
          const r = rubroSugerido(a.titulo, null, null, marca);
          if (r.slug !== "otros") {
            cambio.categoria = r.slug;
            cambio.subrubro = subrubroSugerido(r.slug, a.hoja ?? null, a.titulo).slug ?? null;
          }
        }
        n[a.itemCode] = { ...e, ...cambio };
      }
      return n;
    });
  }

  /** La marca que trae la columna del sistema y no esta en la lista: se
   *  agrega y se les pone a todos los que la traen y siguen sin marca. */
  async function agregarMarcaDelSistema(nombreGBP: string): Promise<string | null> {
    try {
      const r = await agregarMarcaDesdeAlta(nombreGBP);
      if (!r.ok) return r.error;
      sumarMarca(r.marca);
      const igual = nombreGBP.trim().toLowerCase();
      setEdiciones((prevEd) => {
        const n = { ...prevEd };
        for (const a of nuevos) {
          if ((a.marcaGBP ?? "").trim().toLowerCase() !== igual) continue;
          const e = n[a.itemCode] ?? {};
          const actual = e.marca !== undefined ? e.marca : a.marca;
          if (!actual) n[a.itemCode] = { ...e, marca: r.marca.id };
        }
        return n;
      });
      return null;
    } catch {
      return "No se pudo guardar. Probá de nuevo.";
    }
  }

  /** Los tildados de una marca con pagina oficial que se sabe leer: FV y
   *  Piazza (src/lib/fv.ts, src/lib/piazza.ts). */
  const deFV = elegidosDeFV();
  function elegidosDeFV() {
    return nuevos
      .filter((a) => !excluidos.has(a.itemCode))
      .map(conEdicion)
      // Toda marca con su pagina web cargada en Marcas (FV, Piazza, Ferrum...).
      .filter((a) => !!a.marca && marcas.some((m) => m.id === a.marca && m.web));
  }

  /** Va a la pagina de FV de a pocos y completa titulo y foto.
   *
   *  La foto se tilda sola solo si es la de ESTA terminacion. Si FV tiene
   *  unicamente la de otra (el Epuyen negro cuando se vende el cromo), se
   *  muestra pero queda sin tildar: elegirla es una decision, no un default. */
  function traerTodoDeFV() {
    const lista = elegidosDeFV();
    if (lista.length === 0) return;
    startTransition(async () => {
      setAvanceFV({ hechos: 0, total: lista.length });
      for (let i = 0; i < lista.length; i += FV_DE_A) {
        const tanda = lista.slice(i, i + FV_DE_A);
        const resp = await traerDeFV(
          tanda.map((a) => ({
            itemCode: a.itemCode,
            descripcionGBP: a.descripcionGBP,
            marca: a.marca,
            categoria: a.categoria,
            subrubro: a.subrubro,
          })),
        );
        setFv((prev) => {
          const n = { ...prev };
          for (const r of resp) n[r.itemCode] = r;
          return n;
        });
        setEdiciones((prev) => {
          const n = { ...prev };
          for (const r of resp) {
            if (!r.encontrado || !r.titulo) continue;
            n[r.itemCode] = {
              ...n[r.itemCode],
              titulo: r.titulo,
              // Si ya le eligieron una foto a mano, esa manda.
              fotoFV:
                r.foto && !r.fotoDeOtraTerminacion && !fotosPropiasRef.current[r.itemCode]
                  ? r.foto
                  : null,
              // La descripcion de la ficha va tildada sola: es la del
              // fabricante para ESE codigo.
              descripcion: r.descripcion ?? null,
              // El rubro que dice la pagina (Piazza: "Inodoros" es
              // Sanitarios), si lo dijo claro.
              ...(r.categoria ? { categoria: r.categoria, subrubro: r.subrubro ?? null } : {}),
            };
          }
          return n;
        });
        setAvanceFV({ hechos: Math.min(i + FV_DE_A, lista.length), total: lista.length });
      }
    });
  }

  // Apenas se sube un Excel con articulos de FV, se los busca en la pagina
  // de FV solos: titulo oficial y foto, sin tener que apretar nada (Damian,
  // 16/11/2026: "que levante por el codigo fotos del modelo desde la pagina
  // de FV"). El boton queda para volver a buscar. Una vez por archivo.
  const buscadoEn = useRef<PreviewAltaResult | null>(null);
  useEffect(() => {
    if (!prev?.ok || buscadoEn.current === prev) return;
    buscadoEn.current = prev;
    if (elegidosDeFV().length > 0) traerTodoDeFV();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prev]);

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

  /** Se crean de a 10. Si una tanda falla (la sesion se vencio, se corto la
   *  conexion), se frena ahi y se dice cuantos alcanzaron a crearse: volver
   *  a apretar no duplica, porque un codigo que ya existe se saltea. */
  function crear() {
    if (elegidos.length === 0) return;
    const lista: AltaElegida[] = elegidos.map((a) => {
      const c = conEdicion(a);
      return {
        itemCode: c.itemCode,
        titulo: c.titulo,
        marca: c.marca,
        categoria: c.categoria,
        subrubro: c.subrubro,
        unPago: c.unPago,
        stock: c.stock,
        descripcionGBP: c.descripcionGBP,
        fotoFV: c.fotoFV,
        descripcion: c.descripcion,
      };
    });
    // Las fotos elegidas en la compu, de los que se van a crear.
    const fotos = fotosPropias;
    const conFotoPropia = lista.filter((it) => fotos[it.itemCode]).length;
    startTransition(async () => {
      const total: AltaResult = {
        ok: true,
        creados: 0,
        fotos: 0,
        fotosFallidas: 0,
        fotosPropias: 0,
        fotosPropiasFallidas: 0,
        omitidos: [],
      };
      let fotosHechas = 0;
      setAvanceAlta({ hechos: 0, total: lista.length });
      for (let i = 0; i < lista.length; i += CREAR_DE_A) {
        const tanda = lista.slice(i, i + CREAR_DE_A);
        const r = await crearArticulos(tanda, { publicar });
        if (!r.ok) {
          total.ok = false;
          total.error =
            (total.creados ?? 0) > 0
              ? `${r.error} Alcanzaron a crearse ${total.creados}; volvé a apretar para seguir con el resto.`
              : r.error;
          break;
        }
        total.creados = (total.creados ?? 0) + (r.creados ?? 0);
        total.fotos = (total.fotos ?? 0) + (r.fotos ?? 0);
        total.fotosFallidas = (total.fotosFallidas ?? 0) + (r.fotosFallidas ?? 0);
        total.omitidos = [...(total.omitidos ?? []), ...(r.omitidos ?? [])];

        // Recien ahora el articulo existe y se le puede subir la foto. Los
        // que quedaron afuera (el codigo ya existia) no: esa foto iria a
        // parar a otro articulo.
        const afuera = new Set((r.omitidos ?? []).map((o) => o.itemCode));
        for (const it of tanda) {
          const foto = fotos[it.itemCode];
          if (!foto) continue;
          fotosHechas++;
          if (afuera.has(it.itemCode)) continue;
          setAvanceFotos({ hechos: fotosHechas, total: conFotoPropia });
          let subio = false;
          try {
            const fd = new FormData();
            fd.append("image", foto.file);
            subio = (await uploadOneImage(it.itemCode, fd)).ok;
          } catch {
            subio = false;
          }
          if (subio) total.fotosPropias = (total.fotosPropias ?? 0) + 1;
          else total.fotosPropiasFallidas = (total.fotosPropiasFallidas ?? 0) + 1;
        }
        setAvanceFotos(null);
        setAvanceAlta({ hechos: Math.min(i + CREAR_DE_A, lista.length), total: lista.length });
      }
      // La tienda y el panel se refrescan una vez, al final de las fotos.
      if ((total.fotosPropias ?? 0) > 0) {
        try {
          await finishImageBulk();
        } catch {
          // Las fotos ya quedaron guardadas; se ven al recargar.
        }
      }
      setAvanceAlta(null);
      setAvanceFotos(null);
      setResultado(total);
      if (total.ok) setStage("listo");
    });
  }

  function empezarDeNuevo() {
    setStage("subir");
    setPrev(null);
    setResultado(null);
    setEdiciones({});
    setExcluidos(new Set());
    setNombreArchivo(null);
    setFv({});
    setAvanceFV(null);
    soltarFotos();
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
              : "Quedaron ocultos: se ven en el panel, el cliente todavía no los ve. Revisalos y publicalos cuando quieras."}
          </p>
          {((resultado.fotos ?? 0) > 0 ||
            (resultado.fotosFallidas ?? 0) > 0 ||
            (resultado.fotosPropias ?? 0) > 0 ||
            (resultado.fotosPropiasFallidas ?? 0) > 0) && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              {(resultado.fotos ?? 0) > 0 &&
                `${resultado.fotos} con la foto de la página del fabricante. `}
              {(resultado.fotosPropias ?? 0) > 0 &&
                `${resultado.fotosPropias} con la foto que elegiste. `}
              {(resultado.fotosFallidas ?? 0) > 0 &&
                `${resultado.fotosFallidas} fotos de la web no se pudieron bajar. `}
              {(resultado.fotosPropiasFallidas ?? 0) > 0 &&
                `${resultado.fotosPropiasFallidas} de tus fotos no se pudieron subir: agregáselas desde la ficha del producto. `}
              {((resultado.fotosFallidas ?? 0) > 0 || (resultado.fotosPropiasFallidas ?? 0) > 0) &&
                "Esos quedaron con la foto genérica del rubro."}
            </p>
          )}

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
  const conFoto = elegidos.filter((a) => fotosPropias[a.itemCode]).length;

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

          {sinMarcaTildados.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3">
              <span className="text-sm">
                <strong>{sinMarcaTildados.length}</strong> sin marca. Ponerles:
              </span>
              <SelectorDeMarca
                value={marcaParaTodos}
                marcas={marcas}
                vacio="Elegí una marca"
                onChange={setMarcaParaTodos}
                onNueva={sumarMarca}
                className="h-9 rounded-lg border border-[var(--border)] bg-white px-2 text-sm"
              />
              <button
                type="button"
                onClick={ponerMarcaATodos}
                disabled={!marcaParaTodos}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] disabled:opacity-40"
              >
                Aplicar a los {sinMarcaTildados.length}
              </button>
              <span className="text-xs text-[var(--muted)]">
                Si no está en la lista, elegí “+ Agregar marca nueva”. Después
                se puede cambiar una por una. Los de otra marca (por ejemplo
                Hydros) corregilos en su ficha.
              </span>
            </div>
          )}

          {deFV.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3">
              <button
                onClick={traerTodoDeFV}
                disabled={pendiente}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] disabled:opacity-40"
              >
                {avanceFV && avanceFV.hechos < avanceFV.total ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                Buscar en la web ({deFV.length})
              </button>
              <span className="text-xs text-[var(--muted)]">
                {avanceFV && avanceFV.hechos < avanceFV.total
                  ? `Buscando en la web… ${avanceFV.hechos} de ${avanceFV.total}`
                  : avanceFV
                    ? `Listo: ${
                        deFV.filter((a) => fv[a.itemCode]?.encontrado).length
                      } encontrados en la página del fabricante (${
                        deFV.filter((a) => fv[a.itemCode]?.discontinuado).length
                      } discontinuados), ${
                        deFV.filter((a) => fv[a.itemCode] && !fv[a.itemCode].encontrado).length
                      } no. Revisá títulos y fotos antes de crear.`
                    : "Busca cada artículo en la página oficial de su marca (la que está cargada en Marcas) y, si ahí no está, en Google. Trae título, foto y descripción, que podés corregir o destildar. Arranca solo al subir el Excel. No se guarda nada hasta que apretás Crear."}
              </span>
            </div>
          )}

          <p className="mt-4 flex items-start gap-2 text-xs text-[var(--muted)]">
            <ImagePlus className="h-4 w-4 shrink-0" />
            <span>
              Fotos: en cada artículo podés elegir una de la compu, arrastrarla
              al cuadrito o pegarla con Ctrl+V (en la web: clic derecho sobre la
              foto → “Copiar imagen”, y después Ctrl+V sobre el artículo). Se
              guardan cuando apretás Crear.
              {conFoto > 0 && ` Van ${conFoto} con foto.`}
            </span>
          </p>

          <div className="mt-3 space-y-3">
            {filtrados.slice(0, visibles).map((a) => (
              <Ficha
                key={a.itemCode}
                a={conEdicion(a)}
                original={a}
                incluido={!excluidos.has(a.itemCode)}
                rubros={rubros}
                marcas={marcas}
                dctoContado={dctoContado}
                deFV={fv[a.itemCode]}
                fotoPropia={fotosPropias[a.itemCode]}
                onAlternar={() => alternar(a.itemCode)}
                onEditar={(c) => editar(a.itemCode, c)}
                onFoto={(f) => ponerFoto(a.itemCode, f)}
                onNuevaMarca={sumarMarca}
                onAgregarMarcaGBP={agregarMarcaDelSistema}
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
                ? "Van a salir ya en la tienda."
                : "Nacen ocultos: los publicás vos cuando quieras."}
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
              {avanceFotos
                ? `Subiendo fotos… ${avanceFotos.hechos} de ${avanceFotos.total}`
                : avanceAlta
                  ? `Creando… ${avanceAlta.hechos} de ${avanceAlta.total}`
                  : `Crear ${elegidos.length} artículo${elegidos.length === 1 ? "" : "s"}`}
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
  deFV,
  fotoPropia,
  onAlternar,
  onEditar,
  onFoto,
  onNuevaMarca,
  onAgregarMarcaGBP,
}: {
  a: ArticuloNuevo & { fotoFV: string | null; descripcion: string | null };
  original: ArticuloNuevo;
  incluido: boolean;
  rubros: { slug: string; name: string }[];
  marcas: MarcaDeLista[];
  dctoContado: number;
  deFV?: RespuestaFV;
  fotoPropia?: FotoPropia;
  onAlternar: () => void;
  onEditar: (c: Edicion) => void;
  /** Devuelve el error para mostrar, o null si la foto quedo. */
  onFoto: (f: File | null) => string | null;
  onNuevaMarca: (m: MarcaDeLista) => void;
  onAgregarMarcaGBP: (nombre: string) => Promise<string | null>;
}) {
  const margenFlojo = a.margenPct !== null && a.margenPct < 10;
  const subrubros = subrubrosDe(a.categoria);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [errorMarcaGBP, setErrorMarcaGBP] = useState<string | null>(null);
  const [agregandoGBP, startAgregarGBP] = useTransition();

  function elegirFoto(f: File | null) {
    setErrorFoto(onFoto(f));
  }

  // La marca del sistema que no esta en la lista: si ya se agrego (desde
  // esta ficha o desde otra), no se ofrece de nuevo.
  const marcaGBPFalta =
    !original.marca &&
    !!original.marcaGBP &&
    !marcas.some((m) => m.name.toLowerCase() === original.marcaGBP!.trim().toLowerCase());

  return (
    <div
      // Se puede pegar una foto (Ctrl+V) con el foco en cualquier parte de
      // la ficha, incluso escribiendo el titulo: si lo pegado es texto, sigue
      // de largo como siempre.
      tabIndex={-1}
      onPaste={(e) => {
        const f = imagenDe(e.clipboardData);
        if (!f) return;
        e.preventDefault();
        elegirFoto(f);
      }}
      // Un archivo soltado sobre la ficha (fuera del cuadrito) tambien vale.
      // Si no se ataja, el navegador abre la imagen y se pierde la carga.
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        const f = imagenDe(e.dataTransfer);
        if (f) elegirFoto(f);
        else setErrorFoto("Eso no es una imagen.");
      }}
      className={`rounded-xl border bg-white p-4 outline-none focus:border-[var(--brand-red)] ${
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
          {/* El SKU es el codigo de GBP: con ese se guarda el articulo y va
              tambien en el titulo de los FV. */}
          <p className="font-mono text-xs text-[var(--muted)]">
            SKU <strong className="text-foreground">{a.itemCode}</strong>
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

          {deFV && !deFV.encontrado && (
            <p className="mt-1 text-xs text-amber-700">
              {deFV.fabricante ?? "FV"}: {deFV.motivo ?? "no se encontró"}. Queda el título de arriba.
            </p>
          )}
          {deFV?.encontrado && (
            <div className="mt-2 flex items-start gap-3 rounded-lg bg-[var(--surface)] p-2">
              {deFV.foto ? (
                // La foto se muestra desde FV tal cual; recien al crear el
                // articulo se baja y se guarda en la tienda.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={deFV.foto}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 shrink-0 rounded-md border border-[var(--border)] bg-white object-contain"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-[var(--border)] text-[10px] text-[var(--muted)]">
                  sin foto
                </div>
              )}
              <div className="min-w-0 text-xs">
                <p className="text-[var(--muted)]">
                  {deFV.fabricante ?? "FV"} lo llama: <span className="text-foreground">{deFV.nombreFV}</span>
                  {deFV.ficha && (
                    <>
                      {" · "}
                      <a
                        href={deFV.ficha}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--brand-red)]"
                      >
                        ver ficha
                      </a>
                    </>
                  )}
                </p>
                {deFV.foto && (
                  <label className="mt-1.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={a.fotoFV === deFV.foto}
                      onChange={(e) =>
                        onEditar({ fotoFV: e.target.checked ? (deFV.foto ?? null) : null })
                      }
                      className="h-4 w-4"
                    />
                    Usar esta foto
                  </label>
                )}
                {deFV.fotoDeOtraTerminacion && (
                  <p className="mt-1 text-amber-700">
                    Ojo: esta foto es de otra terminación. FV no tiene la de
                    este código.
                  </p>
                )}
                {deFV.descripcion && (
                  <div className="mt-1.5">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={a.descripcion === deFV.descripcion}
                        onChange={(e) =>
                          onEditar({
                            descripcion: e.target.checked ? (deFV.descripcion ?? null) : null,
                          })
                        }
                        className="h-4 w-4"
                      />
                      Usar la descripción de {deFV.fabricante ?? "la marca"}
                    </label>
                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-[var(--muted)]">
                      {deFV.descripcion}
                    </p>
                  </div>
                )}
                {deFV.discontinuado && (
                  <p className="mt-1 text-amber-700">
                    FV lo marca como discontinuado: es stock que no se repone.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <CuadroFoto foto={fotoPropia} error={errorFoto} onElegir={elegirFoto} onError={setErrorFoto} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-xs text-[var(--muted)]">Marca</label>
          <div className="mt-1">
            <SelectorDeMarca
              value={a.marca ?? ""}
              marcas={marcas}
              vacio="Sin marca"
              onChange={(id) => onEditar({ marca: id || null })}
              onNueva={onNuevaMarca}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {original.marca ? (
              "de la columna del sistema"
            ) : marcaGBPFalta ? (
              <>
                el sistema dice &quot;{original.marcaGBP}&quot;, que no está en tu lista de marcas
                <button
                  type="button"
                  disabled={agregandoGBP}
                  onClick={() =>
                    startAgregarGBP(async () => {
                      setErrorMarcaGBP(await onAgregarMarcaGBP(original.marcaGBP!));
                    })
                  }
                  className="ml-2 font-medium text-[var(--brand-red)] disabled:opacity-40"
                >
                  {agregandoGBP ? "agregando…" : "agregarla"}
                </button>
              </>
            ) : original.marcaGBP ? (
              `el sistema dice "${original.marcaGBP}"`
            ) : (
              "el archivo no trae marca"
            )}
          </p>
          {errorMarcaGBP && <p className="mt-1 text-xs text-red-700">{errorMarcaGBP}</p>}
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
        <div>
          <label className="text-xs text-[var(--muted)]">Subrubro</label>
          <select
            value={a.subrubro ?? ""}
            onChange={(e) => onEditar({ subrubro: e.target.value || null })}
            disabled={subrubros.length === 0}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm disabled:bg-[var(--surface)] disabled:text-[var(--muted)]"
          >
            <option value="">
              {subrubros.length === 0 ? "Este rubro no tiene" : "Sin subrubro"}
            </option>
            {subrubros.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">
            {a.categoria === original.categoria ? original.motivoSubrubro : ""}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-[var(--border)] pt-3 sm:grid-cols-3">
        <div>
          <label className="text-xs text-[var(--muted)]">LISTA 2 - PRECIO 1 PAGO</label>
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

/** La marca que nombra el archivo ("pagina srl piazza.xlsx" → Piazza), o "". */
function marcaDelArchivo(nombre: string, marcas: MarcaDeLista[]): string {
  const archivo = nombre.toLowerCase();
  const m = marcas.find(
    (x) => archivo.includes(x.id.toLowerCase()) || archivo.includes(x.name.toLowerCase()),
  );
  return m?.id ?? "";
}

/** La imagen que trae un pegado o un arrastre, si trae una. Chrome pone la
 *  copiada ("Copiar imagen") en files; algunos navegadores solo en items. */
function imagenDe(dt: DataTransfer | null): File | null {
  if (!dt) return null;
  for (const f of Array.from(dt.files ?? [])) if (f.type.startsWith("image/")) return f;
  for (const it of Array.from(dt.items ?? [])) {
    if (it.kind === "file" && it.type.startsWith("image/")) {
      const f = it.getAsFile();
      if (f) return f;
    }
  }
  return null;
}

/** El cuadrito de la foto de cada articulo: clic para elegir, arrastrar un
 *  archivo o pegar con Ctrl+V (eso lo escucha la ficha entera). */
function CuadroFoto({
  foto,
  error,
  onElegir,
  onError,
}: {
  foto?: FotoPropia;
  error: string | null;
  onElegir: (f: File | null) => void;
  onError: (e: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);
  return (
    <div className="w-24 shrink-0 text-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => {
          e.preventDefault();
          // La ficha tambien escucha el soltar: que no la ponga dos veces.
          e.stopPropagation();
          setEncima(false);
          const f = imagenDe(e.dataTransfer);
          if (f) onElegir(f);
          // Arrastrada desde otra pagina llega el link, no la imagen: el
          // navegador no deja leerla. Copiar y pegar si funciona.
          else
            onError(
              "Desde otra página no se puede arrastrar. Clic derecho en la foto → “Copiar imagen” y pegala acá con Ctrl+V.",
            );
        }}
        title="Elegí una foto, arrastrala acá o pegala con Ctrl+V"
        className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border transition-colors hover:border-[var(--brand-red)] ${
          encima
            ? "border-[var(--brand-red)] bg-red-50"
            : foto
              ? "border-[var(--border)] bg-white"
              : "border-dashed border-[var(--border)] bg-[var(--surface)]"
        }`}
      >
        {foto ? (
          // Es la foto elegida en la compu, todavia sin subir: el
          // optimizador de imagenes de Next no la puede ver.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto.url} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1 px-1 text-[10px] leading-tight text-[var(--muted)]">
            <ImagePlus className="h-5 w-5" />
            Foto: elegir, arrastrar o pegar
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onElegir(f);
          // Para poder volver a elegir el mismo archivo despues de quitarlo.
          e.target.value = "";
        }}
      />
      {foto && (
        <button
          type="button"
          onClick={() => onElegir(null)}
          className="mt-1 text-[11px] font-medium text-[var(--brand-red)]"
        >
          quitar
        </button>
      )}
      {error && <p className="mt-1 text-left text-[11px] leading-tight text-red-700">{error}</p>}
    </div>
  );
}

const MARCA_NUEVA = "__nueva__";

/** El desplegable de marcas con una opcion mas al final: "+ Agregar marca
 *  nueva…". Al elegirla aparece el campo para escribirla; se guarda en la
 *  lista de marcas de la tienda (la misma de la pantalla Marcas) y queda
 *  elegida. Damian, 17/11/2026: "esa marca no la tengo, deberia poder
 *  agregarse la misma manualmente". */
function SelectorDeMarca({
  value,
  marcas,
  vacio,
  onChange,
  onNueva,
  className,
}: {
  value: string;
  marcas: MarcaDeLista[];
  vacio: string;
  onChange: (id: string) => void;
  onNueva: (m: MarcaDeLista) => void;
  className: string;
}) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, startGuardar] = useTransition();

  function cancelar() {
    setCreando(false);
    setNombre("");
    setError(null);
  }

  function guardar() {
    if (!nombre.trim() || guardando) return;
    setError(null);
    startGuardar(async () => {
      try {
        const r = await agregarMarcaDesdeAlta(nombre);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        onNueva(r.marca);
        onChange(r.marca.id);
        cancelar();
      } catch {
        setError("No se pudo guardar. Probá de nuevo.");
      }
    });
  }

  if (creando)
    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            type="text"
            value={nombre}
            maxLength={40}
            placeholder="Nombre de la marca"
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                guardar();
              } else if (e.key === "Escape") cancelar();
            }}
            className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-2 text-sm"
            aria-label="Nombre de la marca nueva"
          />
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || !nombre.trim()}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-red)] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
          >
            {guardando && <Loader2 className="h-3 w-3 animate-spin" />}
            Agregar
          </button>
          <button
            type="button"
            onClick={cancelar}
            className="text-xs text-[var(--muted)] hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
    );

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === MARCA_NUEVA) setCreando(true);
        else onChange(e.target.value);
      }}
      className={className}
    >
      <option value="">{vacio}</option>
      {marcas.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
      <option value={MARCA_NUEVA}>+ Agregar marca nueva…</option>
    </select>
  );
}
