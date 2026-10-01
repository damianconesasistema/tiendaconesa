"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MessageCircle, MapPin, ArrowRight } from "lucide-react";
import { business, whatsappLink } from "@/lib/business";

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

export function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % photos.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="relative h-[75vh] min-h-[520px] w-full sm:h-[82vh]">
        {photos.map((photo, i) => (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="100vw"
            priority={i === 0}
            className={`object-cover transition-opacity duration-1000 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Overlay minimo — solo en la zona del texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/50 via-transparent to-transparent md:w-1/2" />

        {/* Content */}
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-16 text-left">
          <div className="animate-fade-up max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-red)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand-red)]" />
              </span>
              <span className="font-display text-xs font-bold uppercase tracking-[0.3em] text-white">
                Próximamente online
              </span>
            </div>

            <h1 className="animate-fade-up-delay-1 mt-6 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
              Tu baño nuevo,
              <br />
              <span className="text-[var(--brand-red)]">a un clic</span> de
              distancia.
            </h1>

            <p className="animate-fade-up-delay-2 mt-6 max-w-xl text-base text-white/90 drop-shadow sm:text-lg md:text-xl">
              {business.tagline}. Estamos armando nuestra tienda online.
              Mientras tanto, pasá por el local o escribinos por WhatsApp.
            </p>

            <div className="animate-fade-up-delay-3 mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href={whatsappLink("Hola! Vi la web y quería hacer una consulta.")}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-[var(--brand-red)] px-8 py-4 font-display text-base font-bold uppercase tracking-wider text-white shadow-xl shadow-red-900/40 transition-all hover:scale-[1.02] hover:bg-[var(--brand-red-hover)]"
              >
                <MessageCircle className="h-5 w-5" />
                Escribinos por WhatsApp
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#local"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-4 font-display text-base font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white hover:text-[var(--brand-black)]"
              >
                <MapPin className="h-5 w-5" />
                Ver el local
              </a>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-6 right-6 z-10 flex gap-2 sm:bottom-8 sm:right-8">
          {photos.map((_, i) => (
            <button
              key={i}
              aria-label={`Ver foto ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-10 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        {/* Caption */}
        <div className="absolute bottom-6 left-6 z-10 hidden sm:block">
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-white/70">
            Nuestro local
          </div>
          <div className="mt-1 font-display text-base font-bold text-white/90">
            {business.address.street} · {business.address.city}
          </div>
        </div>
      </div>
    </section>
  );
}
