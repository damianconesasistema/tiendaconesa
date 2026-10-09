// Iconos de redes. Los comparten el pie del sitio y la seccion de redes
// de la home, por eso viven aca y no dentro de uno de los dos.

export function SocialIcon({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised,white)] text-[var(--muted)] transition-all hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.6 6.3c-1.7-.3-3-1.6-3.3-3.3h-3v12.4c0 1.5-1.2 2.6-2.6 2.6s-2.7-1.2-2.7-2.6c0-1.5 1.2-2.7 2.7-2.7.3 0 .5 0 .8.1V9.7c-.3 0-.5-.1-.8-.1-3.1 0-5.6 2.5-5.6 5.6s2.5 5.6 5.6 5.6 5.6-2.5 5.6-5.6V9.3c1.2.9 2.7 1.4 4.3 1.4V7.7c-.3 0-.7 0-1-.1z"/>
    </svg>
  );
}
