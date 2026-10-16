"use client";

import { useState, useTransition } from "react";
import { Pencil, Loader2, X, AlertTriangle } from "lucide-react";
import { actualizarDatosPedido } from "@/app/admin/pedidos/actions";

// Corregir los datos del comprador desde el detalle del pedido.
//
// La gente se equivoca cargando el DNI o el domicilio, y eso va a la factura
// y a la etiqueta. Antes habia que entrar a la base para arreglarlo.

type Datos = {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  locality: string | null;
  street: string | null;
  streetNumber: string | null;
  reference: string | null;
};

export function EditarDatosButton({
  orderId,
  datos,
  facturado,
}: {
  orderId: string;
  datos: Datos;
  facturado: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({
    firstName: datos.firstName,
    lastName: datos.lastName,
    dni: datos.dni ?? "",
    email: datos.email ?? "",
    phone: datos.phone ?? "",
    locality: datos.locality ?? "",
    street: datos.street ?? "",
    streetNumber: datos.streetNumber ?? "",
    reference: datos.reference ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-[var(--brand-black)]"
      >
        <Pencil className="h-4 w-4" />
        Editar datos
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-xl font-black uppercase">
                Editar datos del pedido
              </h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="text-[var(--muted)] hover:text-foreground"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {facturado && (
              <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Este pedido ya está facturado. Corregir acá <strong>no cambia la
                factura emitida</strong>: para eso hay que anularla con una nota
                de crédito y volver a facturar.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Campo label="Nombre" value={form.firstName} onChange={set("firstName")} />
              <Campo label="Apellido" value={form.lastName} onChange={set("lastName")} />
              <Campo label="DNI" value={form.dni} onChange={set("dni")} />
              <Campo label="Teléfono" value={form.phone} onChange={set("phone")} />
              <div className="sm:col-span-2">
                <Campo label="Email" value={form.email} onChange={set("email")} />
              </div>
              <Campo label="Calle" value={form.street} onChange={set("street")} />
              <Campo label="Número" value={form.streetNumber} onChange={set("streetNumber")} />
              <Campo label="Localidad" value={form.locality} onChange={set("locality")} />
              <Campo label="Referencia" value={form.reference} onChange={set("reference")} />
            </div>

            {error && (
              <p className="mt-3 text-sm text-[var(--brand-red)]">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded-full px-4 py-2 text-sm font-bold text-[var(--muted)] hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => {
                  setError(null);
                  startTransition(async () => {
                    const r = await actualizarDatosPedido(orderId, form);
                    if (r.error) setError(r.error);
                    else {
                      setAbierto(false);
                      location.reload();
                    }
                  });
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-black)] px-5 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </span>
      <input
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-black)]"
      />
    </label>
  );
}
