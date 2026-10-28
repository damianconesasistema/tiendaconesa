/* eslint-disable @next/next/no-img-element */
import { getLegales } from "@/lib/legales";

// QR de Data Fiscal (Formulario 960/D de ARCA, ex AFIP).
//
// La imagen se sirve desde afip.gob.ar a proposito: es la oficial y tiene
// que venir de ahi. Por eso va con <img> y no con next/image, que querria
// optimizarla y servir una copia nuestra.
//
// Si todavia no esta cargado el codigo, no mostramos nada: un QR roto o
// apuntando a otro contribuyente es peor que no tenerlo.
//
// El codigo sale de la sucursal del subdominio, no de una variable de
// entorno: cada tienda tiene el suyo porque son dos CUIT distintos, y una
// misma compilacion no puede llevar dos valores adentro.

export async function DataFiscal({ className = "" }: { className?: string }) {
  const legales = await getLegales();
  if (!legales.afipQr) return null;

  return (
    <a
      href={`https://qr.afip.gob.ar/?qr=${legales.afipQr}`}
      target="_F960AFIPInfo"
      rel="noopener noreferrer"
      title="Data Fiscal · ARCA"
      className={className}
    >
      <img
        src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg"
        alt="Data Fiscal · ARCA"
        width={60}
        height={80}
        loading="lazy"
        className="h-20 w-auto"
      />
    </a>
  );
}
