"use client";

import { useState, useTransition } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { guardarSucursal } from "@/app/admin/sucursales/actions";

export type Sucursal = {
  id: string;
  slug: string;
  subdominio: string | null;
  name: string;
  active: boolean;
  razonSocial: string | null;
  cuit: string | null;
  iibb: string | null;
  inicioAct: string | null;
  afipQr: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: string | null;
  codigosPostales: string | null;
  cubreTodoElPais: boolean;
  zonaEnvio: string | null;
  productos: number;
};

function Campo({
  etiqueta,
  nombre,
  valor,
  ayuda,
  ancho = "",
  area = false,
  tipo = "text",
}: {
  etiqueta: string;
  nombre: string;
  valor: string | null;
  ayuda?: string;
  ancho?: string;
  area?: boolean;
  tipo?: string;
}) {
  const clases =
    "mt-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm";
  return (
    <label className={`block ${ancho}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        {etiqueta}
      </span>
      {area ? (
        <textarea
          name={nombre}
          defaultValue={valor ?? ""}
          rows={2}
          className={clases}
        />
      ) : (
        <input
          type={tipo}
          name={nombre}
          defaultValue={valor ?? ""}
          className={clases}
        />
      )}
      {ayuda && <span className="mt-1 block text-xs text-[var(--muted)]">{ayuda}</span>}
    </label>
  );
}

export function SucursalFicha({ sucursal }: { sucursal: Sucursal }) {
  const [estado, setEstado] = useState<{ ok?: true; error?: string } | null>(null);
  const [pendiente, empezar] = useTransition();

  return (
    <form
      action={(fd) =>
        empezar(async () => {
          setEstado(null);
          setEstado(await guardarSucursal(fd));
        })
      }
      className="rounded-2xl border border-[var(--border)] bg-white p-6"
    >
      <input type="hidden" name="id" value={sucursal.id} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-black uppercase tracking-wider">
          {sucursal.name}
        </h2>
        <span className="text-xs text-[var(--muted)]">
          {sucursal.productos} {sucursal.productos === 1 ? "producto" : "productos"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" nombre="name" valor={sucursal.name} />
        <Campo
          etiqueta="Subdominio"
          nombre="subdominio"
          valor={sucursal.subdominio}
          ayuda={
            sucursal.subdominio
              ? `La tienda vive en ${sucursal.subdominio}.conesa.com.ar`
              : "Sin esto la sucursal no tiene tienda propia."
          }
        />
      </div>

      <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        Datos del titular · van en la factura y en el pie de la tienda
      </h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Razón social" nombre="razonSocial" valor={sucursal.razonSocial} />
        <Campo etiqueta="CUIT" nombre="cuit" valor={sucursal.cuit} ayuda="11 dígitos" />
        <Campo etiqueta="Ingresos Brutos" nombre="iibb" valor={sucursal.iibb} />
        <Campo
          etiqueta="Inicio de actividades"
          nombre="inicioAct"
          valor={sucursal.inicioAct}
        />
        <Campo
          etiqueta="Código del QR de Data Fiscal"
          nombre="afipQr"
          valor={sucursal.afipQr}
          ancho="sm:col-span-2"
          ayuda="Se saca de ARCA, servicio Formulario 960/D. Es obligatorio mostrarlo en la tienda."
        />
      </div>

      <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        El local
      </h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Dirección" nombre="address" valor={sucursal.address} />
        <Campo etiqueta="Localidad" nombre="city" valor={sucursal.city} />
        <Campo etiqueta="Provincia" nombre="province" valor={sucursal.province} />
        <Campo etiqueta="Código postal" nombre="postalCode" valor={sucursal.postalCode} />
        <Campo
          etiqueta="Coordenadas del local"
          nombre="coordenadas"
          valor={
            sucursal.lat != null && sucursal.lng != null
              ? `${sucursal.lat}, ${sucursal.lng}`
              : null
          }
          ancho="sm:col-span-2"
          ayuda="Para el punto en el mapa de Google. Se sacan de Google Maps: botón derecho sobre el local y copiar coordenadas. Se pegan tal cual, separadas por coma. Si no las sabés, dejá vacío: un punto mal puesto manda al cliente a otra cuadra."
        />
        <Campo etiqueta="Teléfono" nombre="phone" valor={sucursal.phone} />
        <Campo
          etiqueta="WhatsApp"
          nombre="whatsapp"
          valor={sucursal.whatsapp}
          ayuda="Con característica, sin el 15"
        />
        <Campo etiqueta="Mail" nombre="email" valor={sucursal.email} tipo="email" />
        <Campo
          etiqueta="Horarios"
          nombre="hours"
          valor={sucursal.hours}
          area
          ayuda="Como lo quieras mostrar"
        />
      </div>

      <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        A quién atiende
      </h3>
      <div className="mt-3 space-y-4">
        <Campo
          etiqueta="Códigos postales que cubre"
          nombre="codigosPostales"
          valor={sucursal.codigosPostales}
          area
          ayuda="Separados por coma. Por ejemplo: 5111, 5113, 5887"
        />
        <Campo
          etiqueta="Qué envía esta sucursal"
          nombre="zonaEnvio"
          valor={sucursal.zonaEnvio}
          area
          ayuda="Es lo que lee el cliente en la tarjeta de la sucursal. Escribí lo que de verdad se cumple: prometer un envío que no llega es un reclamo."
        />
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="cubreTodoElPais"
            defaultChecked={sucursal.cubreTodoElPais}
            className="mt-1"
          />
          <span>
            <strong>Atiende el resto del país.</strong>{" "}
            <span className="text-[var(--muted)]">
              La que recibe los pedidos de cualquier código postal que no esté
              en ninguna lista. Tiene que estar marcada en una sola sucursal.
            </span>
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={sucursal.active} />
          <strong>Sucursal activa</strong>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pendiente}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar
        </button>
        {estado?.ok && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        {estado?.error && (
          <span className="inline-flex items-start gap-1.5 text-sm font-semibold text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {estado.error}
          </span>
        )}
      </div>
    </form>
  );
}
