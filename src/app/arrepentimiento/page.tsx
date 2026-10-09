import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Undo2 } from "lucide-react";
import { business } from "@/lib/business";
import { legales } from "@/lib/legales";
import { FormArrepentimiento } from "@/components/FormArrepentimiento";

export const metadata: Metadata = {
  title: "Botón de arrepentimiento",
  description:
    "Arrepentite de tu compra dentro de los 10 días corridos, sin costo y sin dar explicaciones. Ley 24.240, artículo 34.",
};

export default function ArrepentimientoPage() {
  const dias = legales.diasArrepentimiento;

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-red)] text-white">
            <Undo2 className="h-6 w-6" />
          </span>
          <h1 className="font-display text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
            Botón de
            <br />
            arrepentimiento
          </h1>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-[var(--brand-red)]/30 bg-white p-5 text-[15px] leading-relaxed">
          <p>
            Si compraste por esta web, por teléfono o por WhatsApp, tenés derecho
            a <strong>arrepentirte dentro de los {dias} días corridos</strong>{" "}
            desde que recibiste el producto o desde que hiciste la compra, lo que
            haya pasado último.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-[var(--brand-red)]">✓</span>
              No tenés que dar explicaciones.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand-red)]">✓</span>
              No tiene ningún costo para vos: los gastos de devolución los
              pagamos nosotros.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand-red)]">✓</span>
              Te devolvemos el importe total por el mismo medio de pago.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand-red)]">✓</span>
              Te confirmamos la solicitud dentro de las 24 horas hábiles.
            </li>
          </ul>
          <p className="mt-4 text-sm text-[var(--muted)]">
            El producto tiene que estar sin uso y en su embalaje original.
            Derecho reconocido por el artículo 34 de la Ley 24.240 de Defensa del
            Consumidor.
          </p>
        </div>

        <FormArrepentimiento />

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          También podés escribirnos directo a {business.email} o al WhatsApp{" "}
          {business.whatsapp.display}.{" "}
          <Link href="/legales" className="underline">
            Ver términos y condiciones
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
