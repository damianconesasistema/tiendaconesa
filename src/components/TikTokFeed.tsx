import { business } from "@/lib/business";

type Video = {
  id: string;
  views: string;
};

// Top videos by views (actualizado 2026-10-01 desde el perfil publico de TikTok).
// Para refrescar: ir al perfil, tab Popular, y actualizar esta lista con los IDs y vistas.
const topVideos: readonly Video[] = [
  { id: "7642401319138905351", views: "1.5M" },
  { id: "7641748237560335623", views: "285K" },
  { id: "7644024623402634504", views: "237K" },
] as const;

export function TikTokFeed() {
  return (
    <section className="border-b border-[var(--border)] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col items-center justify-center text-center">
          <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
            Nuestro TikTok
          </span>
          <h2 className="mt-3 font-display text-4xl font-black uppercase leading-tight sm:text-5xl">
            Lo más visto en{" "}
            <a
              href={business.social.tiktok.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--brand-red)] decoration-4 underline-offset-4 hover:text-[var(--brand-red)]"
            >
              {business.social.tiktok.handle}
            </a>
          </h2>
          <p className="mt-3 max-w-xl text-base text-[var(--muted)]">
            17.000+ seguidores y más de 46.800 me gusta. Mirá los videos que
            más vieron en nuestra tienda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {topVideos.map((v) => (
            <div
              key={v.id}
              className="group relative overflow-hidden rounded-2xl bg-black shadow-sm ring-1 ring-[var(--border)] transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[9/16] w-full">
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${v.id}?lang=es&autoplay=1&loop=1&mute=1&music_info=0&description=0`}
                  title={`Video de TikTok con ${v.views} vistas`}
                  loading="lazy"
                  allow="encrypted-media; autoplay; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
              <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/80 px-3 py-1 font-display text-xs font-bold text-white backdrop-blur-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-3 w-3"
                  aria-hidden="true"
                >
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                </svg>
                {v.views}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href={business.social.tiktok.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-background transition-transform hover:scale-[1.02]"
          >
            Ver todos los videos en TikTok →
          </a>
        </div>
      </div>
    </section>
  );
}
