"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  Star,
  GripVertical,
  Download,
  ExternalLink,
  Camera,
  Eraser,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { traerFotoFV, traerDeUnLink } from "@/app/admin/productos/fotos-fv/actions";
import {
  uploadProductImage,
  deleteProductImageById,
  reemplazarImagen,
  setMainProductImage,
  reorderProductImages,
  listProductImages,
} from "@/app/admin/productos/actions";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-images";
import { prepararFotoParaSubir } from "@/lib/image-client";
import {
  quitarFondo,
  soportaQuitarFondo,
  type ProgresoFondo,
} from "@/lib/remove-background";
import { mejorarFoto, type ProgresoMejora } from "@/lib/mejorar-foto";
import { esPorVersionNueva, recargar, sePuedeRecargar } from "@/lib/desfasaje";
import { anotarErrorDePantalla } from "@/lib/errores-de-pantalla";

type Img = { id: string; position: number };

export function ProductImageUpload({
  itemId,
  category,
  initialImages,
  fabricante = null,
  marcaConWeb = false,
  modoCelular = false,
}: {
  itemId: string;
  category: string;
  initialImages: Img[];
  /** Si la marca tiene pagina oficial que se sabe leer ("FV", "Piazza"):
   *  muestra "Traer foto de FV/Piazza", que la busca por el codigo
   *  (src/lib/fv.ts, fichaDelFabricante). */
  fabricante?: string | null;
  /** Si la marca tiene su pagina web cargada en Marcas. Sin pagina, el boton
   *  avisa que hay que cargarla en vez de buscar. */
  marcaConWeb?: boolean;
  /** Se abrio desde el QR "Sacale la foto con el celular": la camara va
   *  primero y grande. */
  modoCelular?: boolean;
}) {
  const [images, setImages] = useState<Img[]>(initialImages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  // La camara del celular (Damian, 17/11/2026: "subir foto desde el celular
  // ... sacarle foto al producto, me elimine el fondo y arme la
  // publicacion"). capture="environment" abre la camara de atras; en una
  // compu abre el elegir archivo de siempre.
  const camaraRef = useRef<HTMLInputElement>(null);
  const bloqueCamaraRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (modoCelular) bloqueCamaraRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [modoCelular]);
  const [, startTransition] = useTransition();
  const [bust, setBust] = useState(Date.now());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [enFoco, setEnFoco] = useState<string | null>(null);
  // Quitar fondo con IA (corre en este navegador, no en el servidor)
  const [sacarFondo, setSacarFondo] = useState(false);
  const [fondoProg, setFondoProg] = useState<ProgresoFondo | null>(null);
  // Mejorar la foto al subirla (luz, color, nitidez y, si es chica, agrandarla
  // con IA). Prendido de entrada: Damian, 18/11/2026, "podes hacer que el
  // subir fotos de la ficha del producto mejore la foto cuando la sube?".
  const [mejorar, setMejorar] = useState(true);
  const [mejoraProg, setMejoraProg] = useState<ProgresoMejora | null>(null);

  /** Como startTransition, pero si algo falla (el servidor no contesta, da
   *  error, se publico una version nueva) la pantalla NO se cae: el error se
   *  muestra aca, queda anotado en el Registro y se puede seguir. Damian,
   *  20/11/2026: "no me deja subir fotos", con la pantalla "No se pudo
   *  mostrar esta pantalla": la subida y "Traer" no atajaban los errores del
   *  servidor y se caia toda la pantalla. */
  function enSegundoPlano(tarea: () => Promise<void>) {
    startTransition(async () => {
      try {
        await tarea();
      } catch (e) {
        const x = (e ?? {}) as { message?: unknown; digest?: unknown };
        const mensaje = String(x.message ?? e);
        const codigo = typeof x.digest === "string" ? x.digest : null;
        setProgress(null);
        setFondoProg(null);
        setMejoraProg(null);
        setBusy(false);
        if (esPorVersionNueva(e) && sePuedeRecargar()) {
          setError("Hay una versión nueva del panel: se recarga sola. Después probá de nuevo.");
          recargar();
          return;
        }
        setError(
          /omitted in production/i.test(mensaje)
            ? `El servidor dio un error${codigo ? ` (código ${codigo})` : ""}. Quedó anotado en Registro. Probá de nuevo.`
            : `Algo falló: ${mensaje.slice(0, 200)}. Quedó anotado en Registro. Probá de nuevo.`,
        );
        void anotarErrorDePantalla(window.location.pathname, mensaje, codigo, "fotos del producto").catch(() => {});
      }
    });
  }
  const puedeSacarFondo = soportaQuitarFondo();
  // Lo que contesto la busqueda en FV, para mostrarlo abajo del boton.
  const [fv, setFv] = useState<{
    ok: boolean;
    texto: string;
    ficha?: string;
    otraTerminacion?: boolean;
  } | null>(null);

  async function refresh() {
    const r = await listProductImages(itemId);
    if (r.ok && r.images) setImages(r.images);
    setBust(Date.now());
  }

  // Subimos de a UNA foto: así mostramos progreso real y evitamos superar
  // el límite de tamaño del request (varias fotos juntas lo rompían).
  function onFiles(
    fileList: FileList,
    opciones: { fondo?: boolean; principal?: boolean } = {},
  ) {
    const conFondo = opciones.fondo ?? sacarFondo;
    const conMejora = mejorar;
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;

    const room = MAX_PRODUCT_IMAGES - images.length;
    if (room <= 0) {
      setError(`Ya tenés el máximo de ${MAX_PRODUCT_IMAGES} fotos.`);
      return;
    }
    const toUpload = files.slice(0, room);

    enSegundoPlano(async () => {
      setBusy(true);
      setError(null);
      setProgress({ done: 0, total: toUpload.length });
      let failed = 0;
      for (let i = 0; i < toUpload.length; i++) {
        let archivo = toUpload[i];

        // Quitar fondo ANTES de subir. Si falla, subimos la original: no
        // queremos que un problema de la IA te impida cargar la foto.
        if (conFondo) {
          try {
            archivo = await quitarFondo(archivo, setFondoProg);
          } catch (e) {
            setError(
              `No se pudo quitar el fondo (${(e as Error).message}). Se sube la foto original.`,
            );
          } finally {
            setFondoProg(null);
          }
        }

        // Mejorar (despues de sacar el fondo: con fondo blanco tambien la
        // centra). Si falla, sube la que habia.
        if (conMejora) {
          try {
            archivo = await mejorarFoto(archivo, setMejoraProg);
          } finally {
            setMejoraProg(null);
          }
        }

        // Achicar antes de mandar: una foto de celular de 8 MB se pasa del
        // tope del request y el server contesta 500.
        archivo = await prepararFotoParaSubir(archivo);
        if (archivo.size > 11 * 1024 * 1024) {
          failed++;
          setError(
            `"${archivo.name}" pesa demasiado y no se pudo achicar. Probá con otra foto.`,
          );
          setProgress({ done: i + 1, total: toUpload.length });
          continue;
        }

        const fd = new FormData();
        fd.append("image", archivo);
        const r = await uploadProductImage(itemId, fd);
        if (!r.ok) {
          failed++;
          setError(r.error ?? "Error al subir una foto");
        }
        setProgress({ done: i + 1, total: toUpload.length });
      }
      await refresh();
      // La foto de la camara es la del producto de verdad: va de principal.
      if (opciones.principal && failed < toUpload.length) {
        const l = await listProductImages(itemId);
        const ultima = l.ok && l.images?.length ? [...l.images].sort((a, b) => b.position - a.position)[0] : null;
        if (ultima && ultima.position > 0) {
          await setMainProductImage(ultima.id, itemId);
          await refresh();
        }
      }
      setProgress(null);
      setFondoProg(null);
      setBusy(false);
      if (files.length > room)
        setError(
          `Se subieron ${room}. El resto supera el máximo de ${MAX_PRODUCT_IMAGES} fotos.`,
        );
      else if (failed > 0)
        setError(`${failed} foto(s) no se pudieron subir. Probá de nuevo.`);
    });
  }

  function onDelete(id: string) {
    enSegundoPlano(async () => {
      setBusy(true);
      const r = await deleteProductImageById(id, itemId);
      if (r.ok) await refresh();
      else setError(r.error ?? "Error al eliminar");
      setBusy(false);
    });
  }

  /** Le saca el fondo a una foto que ya esta cargada y la deja en su lugar. */
  function onSacarFondo(id: string) {
    if (!puedeSacarFondo || busy) return;
    enSegundoPlano(async () => {
      setBusy(true);
      setError(null);
      try {
        const r = await fetch(`/api/productos/img/${id}?v=${bust}`);
        if (!r.ok) throw new Error("no se pudo leer la foto");
        const blob = await r.blob();
        const original = new File([blob], "foto.jpg", { type: blob.type || "image/jpeg" });
        const sinFondo = await prepararFotoParaSubir(await quitarFondo(original, setFondoProg));
        const fd = new FormData();
        fd.append("image", sinFondo);
        const g = await reemplazarImagen(id, itemId, fd);
        if (!g.ok) throw new Error(g.error ?? "no se pudo guardar");
        await refresh();
      } catch (e) {
        setError(`No se pudo quitar el fondo: ${(e as Error).message}. La foto quedó como estaba.`);
      } finally {
        setFondoProg(null);
        setBusy(false);
      }
    });
  }

  /** Mejora una foto que ya esta cargada y la deja en su lugar. */
  function onMejorar(id: string) {
    if (busy) return;
    enSegundoPlano(async () => {
      setBusy(true);
      setError(null);
      try {
        const r = await fetch(`/api/productos/img/${id}?v=${bust}`);
        if (!r.ok) throw new Error("no se pudo leer la foto");
        const blob = await r.blob();
        const original = new File([blob], "foto.jpg", { type: blob.type || "image/jpeg" });
        const mejor = await prepararFotoParaSubir(await mejorarFoto(original, setMejoraProg));
        const fd = new FormData();
        fd.append("image", mejor);
        const g = await reemplazarImagen(id, itemId, fd);
        if (!g.ok) throw new Error(g.error ?? "no se pudo guardar");
        await refresh();
      } catch (e) {
        setError(`No se pudo mejorar la foto: ${(e as Error).message}. Quedó como estaba.`);
      } finally {
        setMejoraProg(null);
        setBusy(false);
      }
    });
  }

  function onSetMain(id: string) {
    enSegundoPlano(async () => {
      setBusy(true);
      const r = await setMainProductImage(id, itemId);
      if (r.ok) await refresh();
      else setError(r.error ?? "Error");
      setBusy(false);
    });
  }

  // --- Drag & drop para reordenar ---
  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    setImages(next); // optimista
    setDragIdx(null);
    enSegundoPlano(async () => {
      setBusy(true);
      const r = await reorderProductImages(
        itemId,
        next.map((n) => n.id),
      );
      if (r.ok) await refresh();
      else {
        setError(r.error ?? "No se pudo reordenar");
        await refresh();
      }
      setBusy(false);
    });
  }

  // Busca el articulo en la pagina de FV por su codigo y agrega la foto a
  // la galeria (principal si no tenia ninguna). Ver src/lib/fv.ts.
  // --- Traer desde un link ---
  // Damian, 17/11/2026: "agregame que pueda poner una url para que saque
  // informacion, foto y descripcion", "abajo del boton de traer fotos desde
  // la web de la marca". Las fotos se suman a la galeria; la descripcion va
  // al cuadro de la derecha (ProductForm la recibe por un evento) para
  // revisarla y guardarla con el boton de siempre.
  const [link, setLink] = useState("");
  const [linkMsg, setLinkMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  function onTraerDeLink() {
    const url = link.trim();
    if (!url) return;
    setLinkMsg(null);
    enSegundoPlano(async () => {
      setBusy(true);
      try {
        const r = await traerDeUnLink(itemId, url);
        if (!r.ok) {
          setLinkMsg({ ok: false, texto: `No se pudo: ${r.motivo}.` });
          return;
        }
        if (r.agregadas > 0) await refresh();
        // Link directo a una foto: solo la foto.
        if (r.soloFoto) {
          setLinkMsg(
            r.agregadas > 0
              ? { ok: true, texto: `Listo: la foto quedó agregada${r.principal ? " como principal" : " al final"}.` }
              : { ok: false, texto: "No se agregó: esa foto no se pudo bajar o ya estaba cargada." },
          );
          setLink("");
          return;
        }
        if (r.descripcion)
          window.dispatchEvent(
            new CustomEvent("conesa:descripcion-de-link", { detail: { itemId, texto: r.descripcion } }),
          );
        const partes = [
          r.agregadas > 0
            ? `${r.agregadas} foto${r.agregadas === 1 ? "" : "s"} agregada${r.agregadas === 1 ? "" : "s"}${
                r.principal ? " (la primera quedó como principal)" : ""
              }`
            : "ninguna foto nueva",
          r.descripcion ? "la descripción quedó en el cuadro de la derecha para revisar y Guardar" : "sin descripción",
        ];
        setLinkMsg({ ok: true, texto: `Listo, de "${r.nombre}": ${partes.join("; ")}.` });
        setLink("");
      } finally {
        setBusy(false);
      }
    });
  }

  function onTraerDeFV(aunqueSeaDeOtraTerminacion = false, reemplazar = false) {
    if (!marcaConWeb) {
      setFv({
        ok: false,
        texto: `${fabricante} no tiene cargada su página web. Cargala en Panel → Marcas ("Página web") y volvé a tocar el botón.`,
      });
      return;
    }
    if (
      reemplazar &&
      !window.confirm(
        `Se busca de nuevo en la web de ${fabricante} con el código completo. Si encuentra el producto exacto, se sacan las ${images.length} fotos que tiene ahora y se ponen las de ahí, y la descripción va al cuadro para revisar. Si no lo encuentra, no se toca nada. ¿Seguimos?`,
      )
    )
      return;
    enSegundoPlano(async () => {
      setBusy(true);
      setError(null);
      setFv(null);
      const r = await traerFotoFV(itemId, aunqueSeaDeOtraTerminacion, reemplazar);
      if (r.ok && reemplazar) {
        await refresh();
        if (r.descripcion)
          window.dispatchEvent(
            new CustomEvent("conesa:descripcion-de-link", { detail: { itemId, texto: r.descripcion } }),
          );
        setFv({
          ok: true,
          texto: `Listo: se sacaron las ${r.reemplazadas ?? 0} fotos de antes y quedaron ${r.agregadas} de ${fabricante}.${
            r.descripcion ? " La descripción quedó en el cuadro de la derecha: revisala y tocá Guardar." : ""
          }`,
          ficha: r.ficha,
        });
      } else if (r.ok) {
        await refresh();
        setFv({
          ok: true,
          texto:
            r.agregadas > 1
              ? `Listo: se agregaron ${r.agregadas} fotos de ${fabricante}${
                  r.principal ? "; la primera quedó como principal" : ", al final de la galería"
                }.`
              : r.principal
                ? `Listo: la foto de ${fabricante} quedó como principal.`
                : `Listo: la foto de ${fabricante} se agregó al final. Si la querés de principal, tocá la estrellita.`,
          ficha: r.ficha,
        });
      } else {
        setFv({
          ok: false,
          texto: `No se agregó: ${r.motivo}.`,
          ficha: r.ficha,
          otraTerminacion: r.deOtraTerminacion,
        });
      }
      setBusy(false);
    });
  }

  // La que se ve grande: la miniatura que se toco (Damian, 19/11/2026:
  // "cuando cambio de foto deberia cargar la que hago foco"). Si no se toco
  // ninguna, o la tocada se borro, la principal.
  const verIdx = Math.max(0, images.findIndex((x) => x.id === enFoco));
  const verId = images[verIdx]?.id;
  const verEsPrincipal = verIdx === 0;
  const full = images.length >= MAX_PRODUCT_IMAGES;

  return (
    <div>
      {/* Imagen principal (grande) */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
        {verId ? (
          <Image
            key={`${verId}-${bust}`}
            src={`/api/productos/img/${verId}?v=${bust}`}
            alt=""
            fill
            sizes="400px"
            unoptimized
            className="object-contain p-3"
          />
        ) : (
          <Image
            src={`/categories/${category}.jpg`}
            alt=""
            fill
            sizes="400px"
            className="object-cover"
          />
        )}
        {/* Cual es, y pasar de una a otra sin bajar a las miniaturas. */}
        {images.length > 1 && (
          <>
            <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {verEsPrincipal ? "Principal" : `Foto ${verIdx + 1} de ${images.length}`}
            </span>
            <button
              type="button"
              onClick={() => setEnFoco(images[(verIdx - 1 + images.length) % images.length].id)}
              aria-label="Foto anterior"
              className="absolute left-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setEnFoco(images[(verIdx + 1) % images.length].id)}
              aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {!verEsPrincipal && verId && (
              <button
                type="button"
                onClick={() => onSetMain(verId)}
                disabled={busy}
                className="absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-[var(--brand-red)] px-3 py-1 text-[11px] font-bold text-white shadow disabled:opacity-50"
              >
                <Star className="h-3 w-3" /> Poner como principal
              </button>
            )}
          </>
        )}
        {images.length === 0 && (
          <div className="pointer-events-none absolute inset-x-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Foto genérica de categoría
          </div>
        )}
        {busy && !progress && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      {/* Barra de progreso de subida */}
      {progress && (
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-white p-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-[var(--brand-red)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Subiendo fotos…
            </span>
            <span className="text-[var(--muted)]">
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
            <div
              className="h-full rounded-full bg-[var(--brand-red)] transition-all duration-300"
              style={{
                width: `${Math.round((progress.done / progress.total) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Volver a editar la foto ya cargada: sacarle el fondo. Tambien esta
          en cada miniatura (la goma), pero ahi solo aparece al pasar el
          mouse. */}
      {verId && (
        <button
          type="button"
          onClick={() => onMejorar(verId)}
          disabled={busy}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-bold text-[var(--brand-red)] underline disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" />
          {verEsPrincipal ? "Mejorar la foto principal" : "Mejorar esta foto"}
        </button>
      )}
      {verId && puedeSacarFondo && (
        <button
          type="button"
          onClick={() => onSacarFondo(verId)}
          disabled={busy}
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-[11px] font-bold text-[var(--brand-red)] underline disabled:opacity-50"
        >
          <Eraser className="h-3 w-3" />
          {verEsPrincipal ? "Quitar el fondo de la foto principal" : "Quitar el fondo de esta foto"}
        </button>
      )}

      {/* Miniaturas de la galeria (arrastrables) */}
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <div
              key={img.id}
              draggable={!busy}
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => setDragIdx(null)}
              // Tocarla la muestra grande arriba.
              onClick={() => setEnFoco(img.id)}
              title="Ver grande"
              className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 ${
                i === 0
                  ? "border-[var(--brand-red)]"
                  : "border-[var(--border)]"
              } ${i === verIdx ? "ring-2 ring-[var(--brand-black)] ring-offset-2" : ""} ${dragIdx === i ? "opacity-40" : ""}`}
            >
              <Image
                src={`/api/productos/img/${img.id}?v=${bust}`}
                alt=""
                fill
                sizes="80px"
                unoptimized
                className="bg-white object-contain"
              />
              {i === 0 && (
                <span className="absolute left-0.5 top-0.5 z-10 inline-flex items-center rounded bg-[var(--brand-red)] px-1 py-0.5 text-[8px] font-black uppercase text-white">
                  Principal
                </span>
              )}
              {/* mango de arrastre */}
              <span className="absolute right-0.5 top-0.5 z-10 rounded bg-black/40 p-0.5 text-white opacity-0 group-hover:opacity-100">
                <GripVertical className="h-3 w-3" />
              </span>
              {/* acciones */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => onSetMain(img.id)}
                    title="Poner como principal"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--brand-red)] hover:scale-110"
                  >
                    <Star className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onMejorar(img.id)}
                  title="Mejorar esta foto"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--brand-red)] hover:scale-110"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                </button>
                {puedeSacarFondo && (
                  <button
                    type="button"
                    onClick={() => onSacarFondo(img.id)}
                    title="Quitar el fondo de esta foto"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--brand-red)] hover:scale-110"
                  >
                    <Eraser className="h-2.5 w-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(img.id)}
                  title="Eliminar foto"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-red-500 hover:scale-110"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={camaraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files, { fondo: puedeSacarFondo, principal: true });
          e.target.value = "";
        }}
      />
      <div ref={bloqueCamaraRef} className={modoCelular ? "mt-3 rounded-xl bg-[var(--surface)] p-3" : "mt-3"}>
        <button
          type="button"
          onClick={() => camaraRef.current?.click()}
          disabled={busy || full}
          className={`flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] font-display font-bold uppercase tracking-wider text-white disabled:opacity-60 ${
            modoCelular ? "px-4 py-4 text-sm" : "px-3 py-2 text-xs"
          }`}
        >
          <Camera className={modoCelular ? "h-5 w-5" : "h-3.5 w-3.5"} />
          Sacar foto con la cámara
        </button>
        <p className="mt-1 text-center text-[11px] text-[var(--muted)]">
          {puedeSacarFondo
            ? "Le saca el fondo (queda sobre blanco) y la deja de principal. La primera vez baja ~110 MB: mejor con Wi-Fi."
            : "La deja de principal. Este navegador no puede sacar el fondo."}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy || full}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5" />
        {full
          ? `Máximo ${MAX_PRODUCT_IMAGES} fotos`
          : images.length === 0
            ? "Subir fotos"
            : "Agregar más fotos"}
      </button>

      {fabricante && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => onTraerDeFV(false)}
            disabled={busy || full}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--brand-red)] bg-white px-3 py-2 font-display text-xs font-bold uppercase tracking-wider text-[var(--brand-red)] hover:bg-[var(--brand-red)] hover:text-white disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" />
            Traer fotos desde la web de la marca
          </button>
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => onTraerDeFV(false, true)}
              disabled={busy}
              className="mt-1 w-full text-center text-[11px] font-bold text-[var(--brand-red)] underline disabled:opacity-60"
            >
              ¿Es otro producto? Buscar de nuevo y reemplazar fotos y descripción
            </button>
          )}
          {fv && (
            <div
              className={`mt-2 rounded-lg p-2.5 text-[11px] leading-snug ${
                fv.ok
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-amber-50 text-amber-900"
              }`}
            >
              <p className="font-bold">{fv.texto}</p>
              {fv.otraTerminacion && (
                <p className="mt-1">
                  Es el mismo modelo en otra terminación (por ejemplo, cromo en
                  vez de negro). Mirala en {fabricante} antes de usarla.
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-3">
                {fv.ficha && (
                  <a
                    href={fv.ficha}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold underline"
                  >
                    Ver en {fabricante} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {fv.otraTerminacion && (
                  <button
                    type="button"
                    onClick={() => onTraerDeFV(true)}
                    disabled={busy}
                    className="font-bold underline disabled:opacity-60"
                  >
                    Usarla igual
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 rounded-lg border border-[var(--border)] p-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Traer desde un link
        </label>
        <div className="mt-1.5 flex gap-1.5">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onTraerDeLink();
              }
            }}
            placeholder="Pegá el link de la página del producto"
            className="h-9 w-full min-w-0 rounded-lg border border-[var(--border)] px-2.5 text-xs outline-none focus:border-[var(--brand-red)]"
          />
          <button
            type="button"
            onClick={onTraerDeLink}
            disabled={busy || full || !link.trim()}
            className="h-9 shrink-0 rounded-full bg-[var(--brand-red)] px-4 font-display text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            Traer
          </button>
        </div>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          De la marca, de MercadoLibre o de un distribuidor: trae las fotos y la descripción.
        </p>
        {linkMsg && (
          <p
            className={`mt-1.5 rounded-md p-2 text-[11px] font-bold leading-snug ${
              linkMsg.ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
            }`}
          >
            {linkMsg.texto}
            {!linkMsg.ok && /conect/i.test(linkMsg.texto) && (
              <Link href="/admin/productos/mercadolibre" className="ml-1 underline">Conectar MercadoLibre</Link>
            )}
          </p>
        )}
      </div>

      {/* Mejorar la foto al subirla. */}
      <label
        className={`mt-2 flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors ${
          mejorar
            ? "border-[var(--brand-red)] bg-[var(--brand-red)]/5"
            : "border-[var(--border)] bg-white hover:border-[var(--brand-red)]/50"
        }`}
      >
        <input
          type="checkbox"
          checked={mejorar}
          onChange={(e) => setMejorar(e.target.checked)}
          disabled={busy}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-red)]"
        />
        <span className="text-[11px] leading-snug">
          <span className="font-bold uppercase tracking-wider">Mejorar la foto</span>
          <span className="block text-[var(--muted)]">
            Corrige luz y color, le da nitidez y, si tiene fondo blanco, centra el producto. Si es chica, la
            agranda con IA (en tu computadora, gratis). Para una que ya está cargada: la estrellita mágica de
            cada foto.
          </span>
        </span>
      </label>

      {/* Progreso del mejorar */}
      {mejoraProg && (
        <div className="mt-2 rounded-lg border border-[var(--border)] bg-white p-3 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 text-[var(--brand-red)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {mejoraProg.etapa === "descargando-ia"
              ? `Bajando la IA para agrandar fotos (solo esta vez)…${mejoraProg.porcentaje != null ? ` ${mejoraProg.porcentaje}%` : ""}`
              : mejoraProg.etapa === "agrandando"
                ? "Agrandando la foto con IA…"
                : "Mejorando la foto…"}
          </span>
        </div>
      )}

      {/* Quitar fondo con IA: corre en ESTE navegador, no en el servidor */}
      {puedeSacarFondo && (
        <label
          className={`mt-2 flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors ${
            sacarFondo
              ? "border-[var(--brand-red)] bg-[var(--brand-red)]/5"
              : "border-[var(--border)] bg-white hover:border-[var(--brand-red)]/50"
          }`}
        >
          <input
            type="checkbox"
            checked={sacarFondo}
            onChange={(e) => setSacarFondo(e.target.checked)}
            disabled={busy}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-red)]"
          />
          <span className="text-[11px] leading-snug">
            <span className="font-bold uppercase tracking-wider">
              Quitar fondo con IA
            </span>
            <span className="block text-[var(--muted)]">
              Deja el producto recortado sobre fondo blanco. Corre en tu
              computadora (gratis, la foto no se envía a ningún lado). La
              primera vez baja el modelo, ~109 MB, y después queda guardado.
            </span>
          </span>
        </label>
      )}

      {/* Progreso del quitar-fondo */}
      {fondoProg && (
        <div className="mt-2 rounded-lg border border-[var(--border)] bg-white p-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-[var(--brand-red)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {fondoProg.etapa === "descargando-modelo"
                ? "Bajando el modelo de IA (solo esta vez)…"
                : "Quitando el fondo…"}
            </span>
            {fondoProg.porcentaje != null && (
              <span className="text-[var(--muted)]">
                {fondoProg.porcentaje}%
              </span>
            )}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
            <div
              className="h-full rounded-full bg-[var(--brand-red)] transition-all"
              style={{
                width:
                  fondoProg.porcentaje != null
                    ? `${fondoProg.porcentaje}%`
                    : "100%",
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 inline-flex items-start gap-1.5 text-xs font-bold text-red-500">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </div>
      )}

      <p className="mt-2 text-[11px] text-[var(--muted)]">
        JPG, PNG o WebP · hasta {MAX_PRODUCT_IMAGES} fotos. Se achican solas
        antes de subirse.
        {images.length > 0 && (
          <>
            {" "}
            Arrastrá las miniaturas para reordenar. La primera es la principal.
          </>
        )}
      </p>
    </div>
  );
}
