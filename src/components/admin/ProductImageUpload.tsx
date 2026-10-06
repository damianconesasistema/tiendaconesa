"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Upload, Trash2, Loader2, AlertCircle, Star, Check } from "lucide-react";
import {
  uploadProductImage,
  deleteProductImageById,
  setMainProductImage,
  listProductImages,
} from "@/app/admin/productos/actions";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-images";

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
  const [status, setStatus] = useState<"idle" | "working">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // cache-bust para que el thumbnail se refresque al reordenar/cambiar
  const [bust, setBust] = useState(Date.now());

  async function refresh() {
    const r = await listProductImages(itemId);
    if (r.ok && r.images) setImages(r.images);
    setBust(Date.now());
  }

  function onFiles(files: FileList) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    startTransition(async () => {
      setStatus("working");
      setError(null);
      const fd = new FormData();
      arr.forEach((f) => fd.append("images", f));
      const r = await uploadProductImage(itemId, fd);
      if (r.ok) {
        await refresh();
      } else {
        setError(r.error ?? "Error al subir");
      }
      setStatus("idle");
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      setStatus("working");
      const r = await deleteProductImageById(id, itemId);
      if (r.ok) await refresh();
      else setError(r.error ?? "Error al eliminar");
      setStatus("idle");
    });
  }

  function onSetMain(id: string) {
    startTransition(async () => {
      setStatus("working");
      const r = await setMainProductImage(id, itemId);
      if (r.ok) await refresh();
      else setError(r.error ?? "Error");
      setStatus("idle");
    });
  }

  const mainId = images[0]?.id;
  const full = images.length >= MAX_PRODUCT_IMAGES;

  return (
    <div>
      {/* Imagen principal (grande) */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--surface)]">
        {mainId ? (
          <Image
            key={`${mainId}-${bust}`}
            src={`/api/productos/img/${mainId}?v=${bust}`}
            alt=""
            fill
            sizes="400px"
            unoptimized
            className="object-cover"
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
        {status === "working" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      {/* Miniaturas de la galeria */}
      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <div
              key={img.id}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 ${
                i === 0
                  ? "border-[var(--brand-red)]"
                  : "border-[var(--border)]"
              }`}
            >
              <Image
                src={`/api/productos/img/${img.id}?v=${bust}`}
                alt=""
                fill
                sizes="80px"
                unoptimized
                className="object-cover"
              />
              {i === 0 && (
                <span className="absolute left-0.5 top-0.5 inline-flex items-center rounded bg-[var(--brand-red)] px-1 py-0.5 text-[8px] font-black uppercase text-white">
                  Principal
                </span>
              )}
              {/* acciones al hover */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => onSetMain(img.id)}
                    title="Poner como principal"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[var(--brand-red)] hover:scale-110"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(img.id)}
                  title="Eliminar foto"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-red-500 hover:scale-110"
                >
                  <Trash2 className="h-3 w-3" />
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
        disabled={status === "working" || full}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5" />
        {full
          ? `Máximo ${MAX_PRODUCT_IMAGES} fotos`
          : images.length === 0
            ? "Subir fotos"
            : "Agregar más fotos"}
      </button>

      {error && (
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      <p className="mt-2 text-[11px] text-[var(--muted)]">
        JPG, PNG o WebP · máx. 10 MB c/u · hasta {MAX_PRODUCT_IMAGES} fotos.
        {images.length > 0 && (
          <>
            {" "}
            <strong>{images.length}</strong> cargada
            {images.length === 1 ? "" : "s"}. La primera es la principal (podés
            cambiarla con <Star className="inline h-3 w-3" />
            ).
          </>
        )}
      </p>
    </div>
  );
}
