"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const photos = [
  {
    src: "/local/local-1.jpg",
    alt: "Frente del local de Sanitarios Conesa en Villa Cura Brochero",
  },
  {
    src: "/local/local-2.jpg",
    alt: "Vista lateral del local con vidrieras de marcas FV, Piazza, Johnson",
  },
] as const;

export function LocalCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-black/5 shadow-xl ring-1 ring-[var(--border)]">
      <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
        {photos.map((photo, i) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 1200px"
            priority={i === 0}
            className={`object-cover transition-opacity duration-1000 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Gradient overlay for caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-8">
          <div>
            <div className="font-display text-xs font-bold uppercase tracking-[0.35em] text-white/90">
              Nuestro local
            </div>
            <div className="mt-1 font-display text-xl font-black uppercase leading-tight text-white sm:text-2xl md:text-3xl">
              Av. Belgrano 758 · Villa Cura Brochero
            </div>
          </div>

          {/* Dots */}
          <div className="pointer-events-auto flex gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                aria-label={`Ver foto ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-8 bg-[var(--surface-raised)]" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
