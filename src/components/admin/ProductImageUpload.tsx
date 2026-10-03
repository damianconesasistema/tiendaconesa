"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Upload, Trash2, Check, Loader2, AlertCircle } from "lucide-react";
import { uploadProductImage, removeProductImage } from "@/app/admin/productos/actions";

export function ProductImageUpload({
  itemId,
  category,
  currentUrl,
}: {
  itemId: string;
  category: string;
  currentUrl: string | null;
}) {
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [status, setStatus] = useState<"idle" | "uploading" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const displayUrl = url || `/categories/${category}.jpg`;

  function onPick() {
    inputRef.current?.click();
  }

  function onFile(file: File) {
    startTransition(async () => {
      setStatus("uploading");
      setError(null);
      const fd = new FormData();
      fd.append("image", file);
      const r = await uploadProductImage(itemId, fd);
      if (r.ok && r.imageUrl) {
        setUrl(r.imageUrl);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setError(r.error ?? "Error al subir");
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  }

  function onRemove() {
    if (!url) return;
    if (!confirm("¿Quitar la foto personalizada? Vuelve a mostrar la foto genérica de la categoría.")) {
      return;
    }
    startTransition(async () => {
      setStatus("uploading");
      const r = await removeProductImage(itemId);
      if (r.ok) {
        setUrl(null);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("error");
        setError(r.error ?? "Error al eliminar");
        setTimeout(() => setStatus("idle"), 3000);
      }
    });
  }

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--surface)]">
        <Image
          key={displayUrl}
          src={displayUrl}
          alt=""
          fill
          sizes="400px"
          unoptimized={!!url && url.includes("?v=")}
          className="object-cover"
        />
        {!url && (
          <div className="pointer-events-none absolute inset-x-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            Foto genérica de categoría
          </div>
        )}
        {status === "uploading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onPick}
          disabled={status === "uploading"}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-2 font-display text-xs font-bold uppercase tracking-wider hover:border-[var(--brand-red)] disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
          {url ? "Cambiar foto" : "Subir foto"}
        </button>
        {url && (
          <button
            type="button"
            onClick={onRemove}
            disabled={status === "uploading"}
            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-white px-3 py-2 text-[var(--muted)] hover:border-red-400 hover:text-red-500 disabled:opacity-60"
            aria-label="Quitar foto"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {status === "saved" && (
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-green-600">
          <Check className="h-3 w-3" />
          Guardado
        </div>
      )}
      {status === "error" && error && (
        <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
      <p className="mt-2 text-[11px] text-[var(--muted)]">
        JPG, PNG o WebP · máx. 8 MB. Si no subís nada, se usa la foto genérica
        de la categoría.
      </p>
    </div>
  );
}
