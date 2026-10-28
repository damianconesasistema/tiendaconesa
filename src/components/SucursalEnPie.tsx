import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

// Los datos de un local en el pie: direccion, telefono, WhatsApp, mail,
// horarios y el mapa.
//
// Esta aparte y se repite una vez por sucursal porque en conesa.com.ar van
// las dos. El pie decia el telefono, el horario y el mapa de Traslasierra
// nada mas: alguien que entraba desde Capital veia un telefono de Cordoba y
// un mapa de un pueblo a 800 km, y pensaba que no le vendian.

export type SucursalPie = {
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: string | null;
  zonaEnvio: string | null;
};

export function SucursalEnPie({
  sucursal: s,
  conTitulo,
}: {
  sucursal: SucursalPie;
  /** El nombre del local arriba. Se muestra cuando hay mas de uno. */
  conTitulo: boolean;
}) {
  // La busqueda del mapa se arma con lo que haya cargado, no con una
  // direccion escrita en el codigo: si se corrige en el panel, el mapa tiene
  // que moverse tambien.
  const paraElMapa = [s.address, s.city, s.province]
    .filter(Boolean)
    .join(", ");
  const busqueda = encodeURIComponent(paraElMapa);

  return (
    <div>
      {conTitulo && (
        <div className="font-display text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-red)]">
          {s.name}
        </div>
      )}

      <ul className={`${conTitulo ? "mt-4" : ""} space-y-3 text-sm`}>
        {s.address && (
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
            <div>
              <div className="font-semibold text-foreground">{s.address}</div>
              <div className="text-xs text-[var(--muted)]">
                {[s.city, s.province].filter(Boolean).join(", ")}
                {s.postalCode && (
                  <>
                    <br />
                    CP {s.postalCode}
                  </>
                )}
              </div>
            </div>
          </li>
        )}

        {s.phone && (
          <li className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
            <a
              href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}
              className="text-foreground hover:text-[var(--brand-red)]"
            >
              {s.phone}
            </a>
          </li>
        )}

        {s.whatsapp && (
          <li className="flex items-start gap-2">
            <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
            <a
              href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-[var(--brand-red)]"
            >
              WhatsApp
            </a>
          </li>
        )}

        {s.email && (
          <li className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
            <a
              href={`mailto:${s.email}`}
              className="break-all text-foreground hover:text-[var(--brand-red)]"
            >
              {s.email}
            </a>
          </li>
        )}

        {s.hours && (
          <li className="flex items-start gap-2 pt-1">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
            <div className="text-xs text-[var(--muted)]">{s.hours}</div>
          </li>
        )}
      </ul>

      {paraElMapa && (
        <>
          <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <iframe
              src={`https://maps.google.com/maps?q=${busqueda}&hl=es&z=15&output=embed`}
              width="100%"
              height="160"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Ubicación de ${s.name}`}
              className="block"
            />
          </div>
          <a
            href={`https://maps.google.com/?q=${busqueda}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-red)] hover:gap-2"
          >
            Cómo llegar <ArrowRight className="h-3 w-3" />
          </a>
        </>
      )}
    </div>
  );
}
