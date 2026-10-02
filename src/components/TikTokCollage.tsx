"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { business } from "@/lib/business";
import thumbnails from "@/data/tiktok-thumbnails.json";

type Thumb = { id: string; views: string };

const thumbs = thumbnails as Thumb[];

// Dos filas que se mueven en direcciones opuestas (marquee).
const rowA = thumbs.slice(0, 10);
const rowB = thumbs.slice(10, 20);

export function TikTokCollage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--brand-black)] px-6 py-20 text-white">
      {/* bg glow */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-[var(--brand-red)] blur-[120px]" />
        <div className="absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-[#25D366] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl text-center">
        <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-white/70">
          En nuestras redes
        </span>
        <h2 className="mt-3 font-display text-4xl font-black uppercase leading-tight sm:text-5xl md:text-6xl">
          <span className="text-[var(--brand-red)]">14.000+</span> nos siguen
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-base text-white/70">
          Instalaciones, novedades y consejos de @sanitarios.conesa.
        </p>
      </div>

      {/* Collage con 2 filas tipo marquee */}
      <div
        className={`relative mt-14 space-y-4 ${mounted ? "" : "opacity-0"} transition-opacity duration-500`}
      >
        {/* fade bordes */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--brand-black)] to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--brand-black)] to-transparent sm:w-32" />

        <MarqueeRow items={rowA} direction="left" duration={60} />
        <MarqueeRow items={rowB} direction="right" duration={75} />
      </div>

      <div className="relative mt-12 flex justify-center">
        <Link
          href={business.social.tiktok.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-raised)] px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-black transition-transform hover:scale-[1.03]"
        >
          Ver todos los videos en TikTok
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: Thumb[];
  direction: "left" | "right";
  duration: number;
}) {
  // Duplicamos la lista para loop sin corte
  const list = [...items, ...items];
  return (
    <div className="group relative overflow-hidden">
      <div
        className="flex gap-4 whitespace-nowrap"
        style={{
          animation: `marquee-${direction} ${duration}s linear infinite`,
          width: "max-content",
        }}
      >
        {list.map((t, i) => (
          <Link
            key={`${t.id}-${i}`}
            href={`https://www.tiktok.com/@sanitarios.conesa/video/${t.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group/card relative block aspect-[9/16] w-40 flex-shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform hover:scale-105 sm:w-48"
          >
            <Image
              src={`/tiktok/${t.id}.jpg`}
              alt={`Video TikTok ${t.views} vistas`}
              fill
              sizes="(max-width: 640px) 160px, 192px"
              className="object-cover"
            />
            {/* overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            {/* views badge */}
            <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 font-display text-[10px] font-bold text-white backdrop-blur-sm">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3 w-3"
                aria-hidden="true"
              >
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
              {t.views}
            </div>
            {/* play icon */}
            <div className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-red)] opacity-90 transition group-hover/card:opacity-100">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 translate-x-0.5 text-white"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
