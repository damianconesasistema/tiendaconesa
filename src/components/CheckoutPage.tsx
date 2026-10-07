"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Store,
  Truck,
  Check,
  AlertCircle,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { useCustomer, emptyCustomer } from "@/lib/customer";
import { localidadesTraslasierra } from "@/lib/traslasierra";
import { formatPrice, cartTotal, buildOrderMessage, whatsappOrderLink } from "@/lib/order";
import { business } from "@/lib/business";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { createOrder } from "@/app/tienda/checkout/actions";

export function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const { customer, setCustomer, hydrated } = useCustomer();
  const { total: subtotal, hasUnpriced } = cartTotal(items);
  // Costos de envio aun no definidos: el admin confirma por WhatsApp
  const shippingCost = 0;
  const total = subtotal;
  const [sent, setSent] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payMethod, setPayMethod] = useState<"whatsapp" | "mercadopago">(
    "whatsapp",
  );

  useEffect(() => {
    if (hydrated && items.length === 0 && !sent) {
      router.replace("/tienda/carrito");
    }
  }, [hydrated, items.length, sent, router]);

  if (hydrated && items.length === 0 && !sent) {
    return null;
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!customer.firstName.trim()) e.firstName = "Requerido";
    if (!customer.lastName.trim()) e.lastName = "Requerido";
    if (!customer.dni.trim()) e.dni = "Requerido";
    if (!/^\d{7,8}$/.test(customer.dni.replace(/\D/g, "")))
      e.dni = "DNI inválido (7 u 8 dígitos)";
    if (!customer.email.trim()) e.email = "Requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email))
      e.email = "Email inválido";
    if (!customer.phone.trim()) e.phone = "Requerido";
    if (customer.shipping === "envio") {
      if (!customer.locality) e.locality = "Elegí una localidad";
      if (!customer.street.trim()) e.street = "Requerido";
      if (!customer.streetNumber.trim()) e.streetNumber = "Requerido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) {
      const first = document.querySelector("[data-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    const result = await createOrder(items, customer, payMethod);
    if (!result.ok) {
      setSubmitting(false);
      setServerError(result.error);
      return;
    }

    // Camino MercadoPago: pedimos el link de pago y mandamos al cliente a
    // Checkout Pro. NO limpiamos el carrito todavia: si el pago falla o lo
    // abandona, tiene que poder volver y reintentar.
    if (payMethod === "mercadopago") {
      try {
        const res = await fetch("/api/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: result.orderNumber }),
        });
        const data = (await res.json()) as { ok?: boolean; initPoint?: string; error?: string };
        if (data.ok && data.initPoint) {
          window.location.href = data.initPoint;
          return;
        }
        setSubmitting(false);
        setServerError(
          `${data.error ?? "No se pudo iniciar el pago"}. Tu pedido quedó guardado con el número ${result.orderNumber}: podés coordinarlo por WhatsApp.`,
        );
      } catch (err) {
        setSubmitting(false);
        setServerError(
          `No pudimos conectar con MercadoPago (${(err as Error).message}). Tu pedido quedó guardado con el número ${result.orderNumber}.`,
        );
      }
      return;
    }

    // Camino WhatsApp (default): abrimos el chat con el pedido cargado.
    setSubmitting(false);
    const msg = buildOrderMessage(items, customer, result.orderNumber);
    const url = whatsappOrderLink(msg, business.whatsapp.number);
    setOrderNumber(result.orderNumber);
    setSent(true);
    clear();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-[var(--surface)] px-4 py-20">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
            <Check className="h-10 w-10" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">
            ¡Pedido #{orderNumber} enviado!
          </h1>
          <p className="mt-3 text-balance text-[var(--muted)]">
            Guardamos tu pedido y te abrimos WhatsApp para coordinar pago y
            entrega.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white"
            >
              Seguir comprando
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/tienda/carrito"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al carrito
        </Link>

        <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Finalizá tu compra
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Dejanos tus datos y confirmamos tu pedido por WhatsApp.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            {/* DATOS DEL COMPRADOR */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">
                1. Tus datos
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nombre"
                  value={customer.firstName}
                  onChange={(v) => setCustomer({ ...customer, firstName: v })}
                  error={errors.firstName}
                  autoComplete="given-name"
                />
                <Field
                  label="Apellido"
                  value={customer.lastName}
                  onChange={(v) => setCustomer({ ...customer, lastName: v })}
                  error={errors.lastName}
                  autoComplete="family-name"
                />
                <Field
                  label="DNI"
                  value={customer.dni}
                  onChange={(v) => setCustomer({ ...customer, dni: v })}
                  error={errors.dni}
                  inputMode="numeric"
                  placeholder="Sin puntos ni espacios"
                />
                <Field
                  label="Teléfono"
                  value={customer.phone}
                  onChange={(v) => setCustomer({ ...customer, phone: v })}
                  error={errors.phone}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Ej: 3544 55 1234"
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Email"
                    value={customer.email}
                    onChange={(v) => setCustomer({ ...customer, email: v })}
                    error={errors.email}
                    inputMode="email"
                    autoComplete="email"
                    type="email"
                  />
                </div>
              </div>
            </section>

            {/* ENVIO */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">
                2. Entrega
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ShippingOption
                  active={customer.shipping === "retiro"}
                  onClick={() =>
                    setCustomer({ ...customer, shipping: "retiro" })
                  }
                  icon={Store}
                  title="Retiro en tienda"
                  desc="Villa Cura Brochero · sin costo"
                  badge="Gratis"
                />
                <ShippingOption
                  active={customer.shipping === "envio"}
                  onClick={() =>
                    setCustomer({ ...customer, shipping: "envio" })
                  }
                  icon={Truck}
                  title="Envío a Traslasierra"
                  desc="Mina Clavero, Nono, Villa Dolores y más"
                  badge="A coordinar"
                />
              </div>

              {customer.shipping === "envio" && (
                <div className="mt-5 space-y-4 border-t border-[var(--border)] pt-5">
                  <div>
                    <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Localidad
                    </label>
                    <select
                      value={customer.locality}
                      onChange={(e) =>
                        setCustomer({ ...customer, locality: e.target.value })
                      }
                      data-error={!!errors.locality}
                      className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-sm text-foreground outline-none ring-[var(--brand-red)]/20 focus:border-[var(--brand-red)] focus:ring-2 ${
                        errors.locality
                          ? "border-red-400"
                          : "border-[var(--border)]"
                      }`}
                    >
                      <option value="">— Elegí una localidad —</option>
                      {localidadesTraslasierra.map((l) => (
                        <option key={l.name} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    {errors.locality && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.locality}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <Field
                      label="Calle"
                      value={customer.street}
                      onChange={(v) =>
                        setCustomer({ ...customer, street: v })
                      }
                      error={errors.street}
                      autoComplete="address-line1"
                    />
                    <Field
                      label="Número"
                      value={customer.streetNumber}
                      onChange={(v) =>
                        setCustomer({ ...customer, streetNumber: v })
                      }
                      error={errors.streetNumber}
                      inputMode="numeric"
                    />
                  </div>
                  <Field
                    label="Referencia (opcional)"
                    value={customer.reference}
                    onChange={(v) =>
                      setCustomer({ ...customer, reference: v })
                    }
                    placeholder="Entre tal y tal, casa amarilla, etc."
                  />
                </div>
              )}
            </section>

            {/* NOTAS */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">
                3. Notas (opcional)
              </h2>
              <textarea
                value={customer.notes}
                onChange={(e) =>
                  setCustomer({ ...customer, notes: e.target.value })
                }
                rows={3}
                placeholder="Horario preferido, aclaraciones del pedido, etc."
                className="mt-3 w-full resize-none rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20"
              />
            </section>

            {/* METODO DE PAGO */}
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">
                4. Método de pago
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <PayOption
                  active={payMethod === "whatsapp"}
                  onClick={() => setPayMethod("whatsapp")}
                  icon={MessageCircle}
                  title="Coordinar por WhatsApp"
                  desc="Transferencia o efectivo. Confirmás con nosotros."
                  badge="Sin recargo"
                />
                <PayOption
                  active={payMethod === "mercadopago"}
                  onClick={() => setPayMethod("mercadopago")}
                  icon={CreditCard}
                  title="Pagar con MercadoPago"
                  desc="Tarjeta, débito, dinero en cuenta o efectivo. Al instante."
                  badge="Online"
                />
              </div>
            </section>
          </div>

          {/* RESUMEN */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">
                Tu pedido
              </h2>
              <div className="mt-4 max-h-60 space-y-3 overflow-y-auto">
                {items.map((it) => (
                  <div key={it.itemId} className="flex gap-3 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] font-display text-xs font-bold">
                      {it.qty}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium leading-snug">
                        {it.title}
                      </div>
                    </div>
                    <div className="shrink-0 font-display text-xs font-bold">
                      {it.price === null
                        ? "—"
                        : formatPrice(it.price * it.qty)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Subtotal</span>
                  <span className="font-semibold">
                    {hasUnpriced ? "a consultar" : formatPrice(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Envío</span>
                  <span className="font-semibold">
                    {customer.shipping === "retiro" ? "Gratis" : "A consultar"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-[var(--border)] pt-4">
                <span className="font-display text-sm font-bold uppercase">
                  Total
                </span>
                <span className="font-display text-2xl font-black">
                  {hasUnpriced ? "A consultar" : formatPrice(total)}
                </span>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Revisá los campos marcados.
                </div>
              )}
              {serverError && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {serverError}
                </div>
              )}

              {payMethod === "mercadopago" ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#009EE3] px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard className="h-5 w-5" />
                  {submitting ? "Preparando pago…" : "Pagar con MercadoPago"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  {submitting ? "Enviando pedido…" : "Confirmar por WhatsApp"}
                </button>
              )}
              <p className="mt-3 text-balance text-center text-xs text-[var(--muted)]">
                {payMethod === "mercadopago"
                  ? "Te llevamos al sitio seguro de MercadoPago para pagar. Tus datos de tarjeta no pasan por nuestra tienda."
                  : "Te abrimos WhatsApp con el pedido ya cargado para coordinar pago y entrega."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCustomer(emptyCustomer)}
              className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--brand-red)]"
            >
              <MessageCircle className="h-3 w-3" />
              Limpiar datos
            </button>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "search" | "url";
}) {
  return (
    <div>
      <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        data-error={!!error}
        className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[var(--brand-red)]/20 ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-[var(--border)] focus:border-[var(--brand-red)]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ShippingOption({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Store;
  title: string;
  desc: string;
  badge: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
        active
          ? "border-[var(--brand-red)] bg-[var(--brand-red)]/5"
          : "border-[var(--border)] bg-white hover:border-[var(--brand-red)]/40"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          active
            ? "bg-[var(--brand-red)] text-white"
            : "bg-[var(--surface)] text-[var(--brand-red)]"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-bold">{title}</span>
          <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--muted)]">
            {badge}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-[var(--muted)]">{desc}</p>
      </div>
    </button>
  );
}

// Mismo diseño que ShippingOption, usado para el selector de método de pago.
const PayOption = ShippingOption;
