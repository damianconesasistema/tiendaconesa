import Link from "next/link";
import { MapPin } from "lucide-react";
import { ConesaLogo } from "@/components/ConesaLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { business, whatsappLink } from "@/lib/business";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-white shadow-sm">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:h-24 sm:px-6">
        <Link
          href="/"
          aria-label={business.name}
          className="flex items-center"
        >
          <ConesaLogo
            variant="horizontal"
            className="h-10 w-auto mix-blend-multiply sm:h-14"
            priority
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/tienda"
            className="animate-titilate inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-red)] px-3 py-2 font-display text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/40 transition-all hover:scale-[1.03] hover:bg-[var(--brand-red-hover)] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            ¡COMPRA AHORA!
          </Link>
          <a
            href={`tel:${business.phone.international.replace(/\s/g, "")}`}
            className="hidden items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] lg:inline-flex"
          >
            <MapPin className="h-4 w-4" />
            {business.phone.display}
          </a>
          <Link
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-[#1DA851] sm:px-5"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
