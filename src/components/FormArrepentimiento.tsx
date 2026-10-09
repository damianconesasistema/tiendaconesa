"use client";

import { useState } from "react";
import { MessageCircle, Mail } from "lucide-react";
import { business } from "@/lib/business";

// Formulario del boton de arrepentimiento.
//
// No manda el mail desde el server porque todavia no hay proveedor de correo
// configurado: en vez de simular que se envio, arma el mensaje y lo abre en
// WhatsApp o en el cliente de correo del visitante. Asi el pedido llega de
// verdad y queda registrado del lado de la persona.

export function FormArrepentimiento() {
  const [pedido, setPedido] = useState("");
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [contacto, setContacto] = useState("");
  const [motivo, setMotivo] = useState("");

  const faltan = nombre.trim() === "" || contacto.trim() === "";

  function mensaje() {
    const hoy = new Date().toLocaleDateString("es-AR");
    return [
      "SOLICITUD DE ARREPENTIMIENTO DE COMPRA",
      `Fecha: ${hoy}`,
      "",
      `Nombre: ${nombre.trim()}`,
      dni.trim() ? `DNI: ${dni.trim()}` : null,
      pedido.trim() ? `Pedido N°: ${pedido.trim()}` : null,
      `Contacto: ${contacto.trim()}`,
      motivo.trim() ? `Comentario: ${motivo.trim()}` : null,
      "",
      "Solicito el arrepentimiento de la compra dentro del plazo de 10 dias",
      "corridos previsto en el art. 34 de la Ley 24.240.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const wa = `https://api.whatsapp.com/send?phone=${business.whatsapp.number}&text=${encodeURIComponent(mensaje())}`;
  const mail = `mailto:${business.email}?subject=${encodeURIComponent("Solicitud de arrepentimiento de compra")}&body=${encodeURIComponent(mensaje())}`;

  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-lg font-black uppercase tracking-tight">
        Pedir la cancelación
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Completá los datos y elegí por dónde mandarlo. El mensaje se arma solo.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Campo
          label="Nombre y apellido *"
          value={nombre}
          onChange={setNombre}
          placeholder="Juan Pérez"
        />
        <Campo label="DNI" value={dni} onChange={setDni} placeholder="30123456" />
        <Campo
          label="N° de pedido"
          value={pedido}
          onChange={setPedido}
          placeholder="12"
        />
        <Campo
          label="Teléfono o mail *"
          value={contacto}
          onChange={setContacto}
          placeholder="3544 43-0522"
        />
      </div>

      <div className="mt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Comentario (opcional)
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          placeholder="No hace falta que expliques el motivo, pero si querés contarnos algo, acá podés."
          className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-red)]"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href={faltan ? undefined : wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={faltan}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-colors ${
            faltan
              ? "pointer-events-none bg-gray-300"
              : "bg-[#25D366] hover:bg-[#1DA851]"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Enviar por WhatsApp
        </a>
        <a
          href={faltan ? undefined : mail}
          aria-disabled={faltan}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-5 py-3 font-display text-sm font-bold uppercase tracking-wider transition-colors ${
            faltan
              ? "pointer-events-none border-[var(--border)] text-gray-300"
              : "border-[var(--brand-red)] text-[var(--brand-red)] hover:bg-[var(--brand-red)] hover:text-white"
          }`}
        >
          <Mail className="h-4 w-4" />
          Enviar por mail
        </a>
      </div>

      {faltan && (
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          Completá tu nombre y un contacto para poder enviarlo.
        </p>
      )}
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
      />
    </div>
  );
}
