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

  // El enlace va por http a proposito. https://qr.afip.gob.ar no existe:
  // no contesta TLS. La direccion con http es la que da el propio script
  // del F960/D de ARCA, y redirige sola a serviciosweb.afip.gob.ar, que si
  // es https. La imagen, en cambio, tiene que ir por https: por http el
  // navegador la bloquearia por contenido mixto y el logo no se veria.
  return (
    <a
      href={`http://qr.afip.gob.ar/?qr=${legales.afipQr}`}
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
