"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import {
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  Star,
  GripVertical,
} from "lucide-react";
import {
  uploadProductImage,
  deleteProductImageById,
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

type Img = { id: string; position: number };

export function ProductImageUpload({
  itemId,
  category,
  initialImages,
}: {
  itemId: string;
  category: string;
  initialImages: Img[];
}) {
  const [images, setImages] = useState<Img[]>(initialImages);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();
  const [bust, setBust] = useState(Date.now());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // Quitar fondo con IA (corre en este navegador, no en el servidor)
  const [sacarFondo, setSacarFondo] = useState(false);
  const [fondoProg, setFondoProg] = useState<ProgresoFondo | null>(null);
  const puedeSacarFondo = soportaQuitarFondo();

  async function refresh() {
    const r = await listProductImages(itemId);
    if (r.ok && r.images) setImages(r.images);
    setBust(Date.now());
  }

  // Subimos de a UNA foto: así mostramos progreso real y evitamos superar
  // el límite de tamaño del request (varias fotos juntas lo rompían).
  function onFiles(fileList: FileList) {
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

    startTransition(async () => {
      setBusy(true);
      setError(null);
      setProgress({ done: 0, total: toUpload.length });
      let failed = 0;
      for (let i = 0; i < toUpload.length; i++) {
        let archivo = toUpload[i];

        // Quitar fondo ANTES de subir. Si falla, subimos la original: no
        // queremos que un problema de la IA te impida cargar la foto.
        if (sacarFondo) {
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
    startTransition(async () => {
      setBusy(true);
      const r = await deleteProductImageById(id, itemId);
      if (r.ok) await refresh();
      else setError(r.error ?? "Error al eliminar");
      setBusy(false);
    });
  }

  function onSetMain(id: string) {
    startTransition(async () => {
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
    startTransition(async () => {
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

  const mainId = images[0]?.id;
  const full = images.length >= MAX_PRODUCT_IMAGES;

  return (
    <div>
      {/* Imagen principal (grande) */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white">
        {mainId ? (
          <Image
            key={`${mainId}-${bust}`}
            src={`/api/productos/img/${mainId}?v=${bust}`}
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
              className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border-2 active:cursor-grabbing ${
                i === 0
                  ? "border-[var(--brand-red)]"
                  : "border-[var(--border)]"
              } ${dragIdx === i ? "opacity-40" : ""}`}
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
