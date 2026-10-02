"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { whatsappLink } from "@/lib/business";

// Fotos del hero. Cuando subas mas, agregalas aca y el crossfade las rota auto.
const photos: readonly { src: string; alt: string }[] = [
  {
    src: "/local/local-1.jpg",
    alt: "Frente de Sanitarios Conesa en Villa Cura Brochero",
  },
  // { src: "/local/bano-1.jpg", alt: "Diseño de baño con griferia Piazza" },
  // { src: "/local/cocina-1.jpg", alt: "Diseño de cocina con bacha de acero inox" },
] as const;

const ROTATION_MS = 6000; // crossfade cada 6s cuando hay mas de una foto

// Hero "Dark Luxe" — fondo oscuro + glow rojo + stats laterales
export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, ROTATION_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-[#0a0a0a] text-white">
      {/* Fotos de fondo con crossfade + Ken Burns individual */}
      <div className="absolute inset-0">
        {photos.map((photo, i) => (
          <div
            key={photo.src}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-[1800ms] ease-in-out ${
              i === index ? "opacity-30" : "opacity-0"
            }`}
            aria-hidden="true"
          >
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              className="animate-ken-burns object-cover"
            />
          </div>
        ))}
      </div>

      {/* Glows radiales rojos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 72% 28%, rgba(230,48,32,0.42) 0%, transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(230,48,32,0.22) 0%, transparent 55%)",
        }}
      />

      {/* Grid de líneas sutiles tipo blueprint */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Overlay vertical para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div className="relative mx-auto flex min-h-[88svh] max-w-6xl flex-col justify-center px-6 py-20 sm:py-28">
        <div className="animate-fade-up max-w-3xl">
          {/* Pill "Tienda online activa" */}
          <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-red)] opacity-75" />
              <span
                className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand-red)]"
                style={{ boxShadow: "0 0 12px rgba(230,48,32,0.9)" }}
              />
            </span>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white">
              Tienda online activa
            </span>
          </div>

          {/* Headline con gradiente en la frase clave */}
          <h1 className="animate-fade-up-delay-1 mt-6 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight drop-shadow-xl sm:text-6xl md:text-7xl lg:text-[88px]">
            Tu baño nuevo,
            <br />
            <span
              className="bg-gradient-to-br from-[var(--brand-red)] via-[#ff6b55] to-[var(--brand-red)] bg-clip-text text-transparent"
              style={{ WebkitTextFillColor: "transparent" }}
            >
              a un click
            </span>
            .
          </h1>

          <p className="animate-fade-up-delay-2 mt-6 max-w-lg text-balance text-base text-white/70 drop-shadow sm:text-lg">
            Más de <strong className="text-white">790 productos</strong> de las
            mejores marcas, listos para comprar o retirar en Villa Cura Brochero.
          </p>

          <div className="animate-fade-up-delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tienda"
              className="animate-titilate-delay group inline-flex items-center justify-center gap-3 rounded-full bg-[var(--brand-red)] px-8 py-4 font-display text-sm font-bold uppercase tracking-[0.12em] text-white transition-all hover:bg-[var(--brand-red-hover)]"
              style={{ boxShadow: "0 10px 32px -8px rgba(230,48,32,0.55)" }}
            >
              Entrá a la tienda
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href={whatsappLink("Hola! Vi la web y quería hacer una consulta.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-7 py-4 font-display text-sm font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-[#25D366]/90"
            >
              <WhatsAppIcon className="h-5 w-5" />
              WhatsApp
            </Link>
          </div>
        </div>

        {/* Stats laterales (desktop) */}
        <aside className="pointer-events-none absolute bottom-16 right-10 hidden flex-col gap-6 text-right lg:flex">
          <StatMini value="790+" label="Productos" />
          <StatMini value="17" label="Localidades" />
          <StatMini value="14k+" label="En Instagram" />
        </aside>

        {/* Indicadores de slide (solo si hay > 1 foto) */}
        {photos.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ver foto ${i + 1}`}
                className={`h-1 rounded-full transition-all ${
                  i === index ? "w-8 bg-[var(--brand-red)]" : "w-4 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StatMini({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div
        className="font-display text-3xl font-black leading-none text-[var(--brand-red)] sm:text-4xl"
        style={{ textShadow: "0 0 24px rgba(230,48,32,0.4)" }}
      >
        {value}
      </div>
      <div className="mt-1 font-display text-[10px] font-bold uppercase tracking-[0.25em] text-white/55">
        {label}
      </div>
    </div>
  );
}
