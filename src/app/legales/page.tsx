import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { business } from "@/lib/business";
import { legales } from "@/lib/legales";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos y condiciones de venta, política de devoluciones, garantía legal y protección de datos de Sanitarios Conesa Traslasierra.",
};

const DIAS = legales.diasArrepentimiento;

export default function LegalesPage() {
  const domicilio = `${business.address.street}, ${business.address.city}, ${business.address.province} (${business.address.postalCode})`;

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Términos y condiciones
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Última actualización: octubre de 2026.
        </p>

        <div className="mt-8 space-y-8 rounded-3xl border border-[var(--border)] bg-white p-6 text-[15px] leading-relaxed text-foreground/90 shadow-sm sm:p-10">
          <Seccion titulo="1. Quiénes somos">
            <p>
              Este sitio es operado por <strong>{legales.razonSocial || business.name}</strong>
              {legales.cuit && <> , CUIT {legales.cuit}</>}, con domicilio comercial en{" "}
              {domicilio}.
            </p>
            <p>
              Contacto: {business.email} · {business.phone.display} · WhatsApp{" "}
              {business.whatsapp.display}. Atención{" "}
              {business.hours.weekdays.toLowerCase()} y{" "}
              {business.hours.saturday.toLowerCase()}.
            </p>
          </Seccion>

          <Seccion titulo="2. Precios y formas de pago">
            <p>
              Los precios están expresados en <strong>pesos argentinos</strong> e
              incluyen IVA. El precio destacado de cada publicación corresponde al
              pago con tarjeta de débito o crédito en un pago. El precio de
              efectivo o transferencia, menor, figura aclarado en la misma
              publicación.
            </p>
            <p>
              Los pagos con tarjeta se procesan a través de MercadoPago. Nosotros
              no almacenamos ni tenemos acceso a los datos de tu tarjeta.
            </p>
            <p>
              Los precios pueden variar sin previo aviso. El precio que rige es el
              vigente al momento de confirmar la compra.
            </p>
          </Seccion>

          <Seccion titulo="3. Disponibilidad y entrega">
            <p>
              El stock publicado es informativo y puede diferir del disponible al
              momento de la compra. Si un producto no estuviera disponible, te
              contactamos para ofrecerte una alternativa o devolverte el importe
              abonado en su totalidad.
            </p>
            <p>
              Podés retirar tu compra en nuestro local de {business.address.city} o
              coordinar el envío a localidades del Valle de Traslasierra. El costo
              del envío se informa y acuerda antes de despachar.
            </p>
            <p>
              Las imágenes de las publicaciones son a modo ilustrativo. El producto
              puede presentar diferencias de color, terminación o accesorios según
              el lote del fabricante.
            </p>
          </Seccion>

          <Seccion titulo={`4. Botón de arrepentimiento (${DIAS} días)`}>
            <p>
              Conforme al <strong>artículo 34 de la Ley 24.240</strong> de Defensa
              del Consumidor, si comprás a distancia (por esta web, teléfono o
              WhatsApp) tenés derecho a <strong>arrepentirte de la compra dentro
              de los {DIAS} días corridos</strong> contados desde la entrega del
              producto o desde la celebración del contrato, lo que ocurra último.
            </p>
            <p>
              No necesitás dar explicaciones y <strong>no tiene costo para
              vos</strong>: los gastos de devolución corren por nuestra cuenta. El
              producto debe estar sin uso y en su embalaje original.
            </p>
            <p>
              Para ejercerlo, entrá al{" "}
              <Link
                href="/arrepentimiento"
                className="font-bold text-[var(--brand-red)] underline"
              >
                botón de arrepentimiento
              </Link>
              . Te respondemos dentro de las 24 horas hábiles con la constancia de
              tu solicitud.
            </p>
          </Seccion>

          <Seccion titulo="5. Garantía legal">
            <p>
              Todos los productos nuevos tienen una{" "}
              <strong>garantía legal de 6 meses</strong> (artículo 11 de la Ley
              24.240) por defectos de fabricación, además de la garantía que
              otorgue el fabricante, que puede ser mayor.
            </p>
            <p>
              La garantía no cubre daños por mal uso, instalación incorrecta,
              golpes, desgaste normal ni modificaciones hechas al producto.
              Guardá tu comprobante de compra: es el respaldo de la garantía.
            </p>
          </Seccion>

          <Seccion titulo="6. Cambios y devoluciones por falla">
            <p>
              Si el producto llega fallado o no corresponde con lo que pediste,
              avisanos dentro de las 48 horas de recibido y lo cambiamos o te
              devolvemos el importe, sin cargo.
            </p>
          </Seccion>

          <Seccion titulo="7. Datos personales">
            <p>
              Los datos que nos dejás al comprar (nombre, DNI, correo, teléfono y
              domicilio) se usan únicamente para procesar tu pedido, emitir la
              factura y contactarte por esa compra. No los vendemos ni los cedemos
              a terceros con fines comerciales.
            </p>
            <p>
              Usamos Google Analytics para entender cómo se navega el sitio. Esa
              herramienta utiliza cookies y recoge datos de uso de forma agregada.
            </p>
            <p>
              Conforme a la <strong>Ley 25.326</strong> de Protección de Datos
              Personales, podés pedirnos en cualquier momento acceder, rectificar o
              suprimir tus datos escribiéndonos a {business.email}. La Agencia de
              Acceso a la Información Pública es el órgano de control.
            </p>
          </Seccion>

          <Seccion titulo="8. Defensa del consumidor">
            <p>
              Ante cualquier reclamo podés contactarnos directamente y también
              acudir a los organismos oficiales:
            </p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <a
                  href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--brand-red)] underline"
                >
                  Ventanilla Única Federal de Defensa del Consumidor
                </a>
              </li>
              <li>
                Dirección de Defensa del Consumidor de la Provincia de Córdoba.
              </li>
            </ul>
          </Seccion>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          ¿Dudas con alguno de estos puntos? Escribinos a {business.email} y te
          respondemos.
        </p>
      </div>
    </main>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-black uppercase tracking-tight text-foreground sm:text-xl">
        {titulo}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
