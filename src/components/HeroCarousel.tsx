"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Store, Truck, CreditCard } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { whatsappLink } from "@/lib/business";

// Fotos del hero — carrusel con crossfade + Ken Burns.
// Mezcla baños y cocinas (renders estilo de los que podemos armar con nuestros productos).
const photos: readonly { src: string; alt: string }[] = [
  { src: "/local/bano-1.jpg", alt: "Baño spa con bañera, doble lavatorio y ducha de lluvia" },
  { src: "/local/cocina-1.jpg", alt: "Cocina moderna con isla de mármol y bacha de acero" },
  { src: "/local/bano-2.jpg", alt: "Baño moderno con grifería negra y lavatorio ovalado" },
  { src: "/local/cocina-2.jpg", alt: "Cocina industrial oscura con mesa de madera" },
  { src: "/local/bano-3.jpg", alt: "Baño clásico con bañera protagonista" },
  { src: "/local/cocina-3.jpg", alt: "Cocina con isla de mármol y taburetes de mimbre" },
] as const;

const ROTATION_MS = 5500; // crossfade cada 5.5s

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
    <section className="relative isolate -mt-20 overflow-hidden bg-black text-white sm:-mt-24">
      {/* Fotos de fondo con crossfade + Ken Burns individual */}
      <div className="absolute inset-0">
        {photos.map((photo, i) => (
          <div
            key={photo.src}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-[1800ms] ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden="true"
          >
            <Image
              src={photo.src}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Overlay para legibilidad del texto (lado izq fuerte + borde inferior) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent md:via-black/35 md:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-6 pb-24 pt-28 sm:pb-28 sm:pt-40">
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

          {/* Headline con juego de tamaños y rojo/blanco */}
          <h1
            className="animate-fade-up-delay-1 mt-6 font-display uppercase leading-[0.9] tracking-tight text-white"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.6)" }}
          >
            <span className="block text-lg font-bold sm:text-3xl md:text-4xl">
              Todo para tu
            </span>
            <span className="mt-1 block text-6xl font-black sm:whitespace-nowrap sm:text-7xl md:text-8xl lg:text-[108px]">
              <span className="text-white">baño</span>
              <span className="block sm:inline">
                <span className="font-display text-[var(--brand-red)] italic">&nbsp;&amp;&nbsp;</span>
                <span className="text-white">cocina</span>
              </span>
            </span>
          </h1>

          <p
            className="animate-fade-up-delay-2 mt-8 max-w-lg text-balance text-base text-white/90 sm:text-lg"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
          >
            <strong className="text-white">Ofertas vigentes</strong> en las
            mejores marcas, listas para comprar o retirar en Villa Cura Brochero.
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

        {/* Beneficios laterales (desktop) */}
        <aside className="pointer-events-none absolute bottom-16 right-10 hidden flex-col gap-3 lg:flex">
          <BenefitChip
            icon={Store}
            title="Retiro en tienda"
            desc="Villa Cura Brochero · gratis"
          />
          <BenefitChip
            icon={Truck}
            title="Envíos a Traslasierra"
            desc="Mina Clavero, Nono, Villa Dolores y más"
          />
          <BenefitChip
            icon={CreditCard}
            title="Pagá en cuotas"
            desc="Tarjeta de crédito o débito"
          />
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

function BenefitChip({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Store;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex max-w-xs items-start gap-3 rounded-xl border border-white/15 bg-black/50 px-4 py-3 backdrop-blur-md">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-red)] text-white">
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div>
        <div className="font-display text-xs font-black uppercase tracking-wider text-white">
          {title}
        </div>
        <div className="mt-0.5 text-[11px] leading-snug text-white/70">
          {desc}
        </div>
      </div>
    </div>
  );
}
