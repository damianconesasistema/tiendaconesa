"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/order";

type PaywayConfig = {
  publicKey: string;
  apiUrl: string;
  scriptUrl: string;
  env: string;
  configured: boolean;
};

type Item = { title: string; qty: number; price: number };

// Tipo minimo del SDK frontend de Payway (decidir.js)
type DecidirInstance = {
  setPublishableKey: (key: string) => void;
  setTimeout: (ms: number) => void;
  createToken: (
    form: HTMLFormElement,
    cb: (status: number, response: Record<string, unknown>) => void,
  ) => void;
};
declare global {
  interface Window {
    Decidir?: new (url: string) => DecidirInstance;
  }
}

// Detecta el payment_method_id de Payway segun el numero de tarjeta
function detectCard(cardNumber: string): { id: number; brand: string } {
  const n = cardNumber.replace(/\D/g, "");
  if (/^4/.test(n)) return { id: 1, brand: "visa" };
  if (/^(5[1-5]|2[2-7])/.test(n)) return { id: 15, brand: "mastercard" };
  if (/^3[47]/.test(n)) return { id: 65, brand: "amex" };
  if (/^(60|64|65)/.test(n)) return { id: 63, brand: "cabal" };
  return { id: 1, brand: "visa" };
}

export function CheckoutPaywayForm({
  orderNumber,
  total,
  customerName,
  items,
  payway,
}: {
  orderNumber: number;
  total: number;
  customerName: string;
  items: Item[];
  payway: PaywayConfig;
}) {
  const router = useRouter();
  const { clear } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [installments, setInstallments] = useState("1");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar decidir.js
  useEffect(() => {
    if (window.Decidir) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = payway.scriptUrl;
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);
    return () => {
      // dejamos el script cargado; no lo removemos para evitar recargas
    };
  }, [payway.scriptUrl]);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!payway.configured) {
      setError(
        "El pago con tarjeta todavía no está habilitado. Coordiná por WhatsApp.",
      );
      return;
    }
    if (!scriptReady || !window.Decidir || !formRef.current) {
      setError("El formulario de pago aún se está cargando. Esperá un momento.");
      return;
    }

    const form = formRef.current;
    const cardNumberInput = form.querySelector<HTMLInputElement>(
      '[data-decidir="card_number"]',
    );
    const cardNumber = cardNumberInput?.value.replace(/\D/g, "") ?? "";
    if (cardNumber.length < 13) {
      setError("Revisá el número de tarjeta.");
      return;
    }
    const { id: paymentMethodId, brand } = detectCard(cardNumber);
    const bin = cardNumber.slice(0, 6);
    const last4 = cardNumber.slice(-4);

    setProcessing(true);

    const decidir = new window.Decidir(payway.apiUrl);
    decidir.setPublishableKey(payway.publicKey);
    decidir.setTimeout(8000);

    decidir.createToken(form, async (status, response) => {
      if (status !== 200 && status !== 201) {
        setProcessing(false);
        const msg =
          (response?.error as { message?: string } | undefined)?.message ||
          "No pudimos validar la tarjeta. Revisá los datos.";
        setError(String(msg));
        return;
      }

      const token = response?.token as string | undefined;
      if (!token) {
        setProcessing(false);
        setError("No se pudo generar el token de la tarjeta.");
        return;
      }

      try {
        const res = await fetch("/api/payway/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber,
            token,
            bin,
            paymentMethodId,
            installments: Number(installments),
            cardBrand: brand,
            cardLast4: last4,
          }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          status?: string;
          message?: string;
        };

        if (data.ok) {
          clear();
          router.push(`/tienda/checkout/exito?orden=${orderNumber}`);
        } else {
          setProcessing(false);
          router.push(
            `/tienda/checkout/error?orden=${orderNumber}&motivo=${encodeURIComponent(
              data.message || "El pago fue rechazado",
            )}`,
          );
        }
      } catch {
        setProcessing(false);
        setError("Error de conexión al procesar el pago. Probá de nuevo.");
      }
    });
  }

  const cuotas = [1, 3, 6, 12];

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/tienda/carrito"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al carrito
        </Link>

        <h1 className="mt-6 flex items-center gap-3 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
          <CreditCard className="h-8 w-8 text-[var(--brand-red)]" />
          Pago con tarjeta
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pedido #{orderNumber} · {customerName}
        </p>

        {!payway.configured && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <strong>El pago con tarjeta aún no está habilitado.</strong>
              <p className="mt-0.5">
                Faltan configurar las credenciales de Payway en el servidor.
                Mientras tanto podés coordinar el pago por WhatsApp.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* FORM DE TARJETA */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]"
          >
            <div>
              <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Número de tarjeta
              </label>
              <input
                type="text"
                data-decidir="card_number"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                className="input"
              />
            </div>

            <div>
              <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Nombre como figura en la tarjeta
              </label>
              <input
                type="text"
                data-decidir="card_holder_name"
                autoComplete="cc-name"
                placeholder="JUAN PEREZ"
                className="input uppercase"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Mes
                </label>
                <input
                  type="text"
                  data-decidir="card_expiration_month"
                  inputMode="numeric"
                  placeholder="MM"
                  maxLength={2}
                  className="input"
                />
              </div>
              <div>
                <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Año
                </label>
                <input
                  type="text"
                  data-decidir="card_expiration_year"
                  inputMode="numeric"
                  placeholder="AA"
                  maxLength={2}
                  className="input"
                />
              </div>
              <div>
                <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  CVV
                </label>
                <input
                  type="text"
                  data-decidir="security_code"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength={4}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <div>
                <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Tipo doc
                </label>
                <select data-decidir="card_holder_doc_type" className="input">
                  <option value="dni">DNI</option>
                  <option value="cuil">CUIL</option>
                  <option value="cuit">CUIT</option>
                </select>
              </div>
              <div>
                <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                  Nº documento
                </label>
                <input
                  type="text"
                  data-decidir="card_holder_doc_number"
                  inputMode="numeric"
                  placeholder="Sin puntos"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Cuotas
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
                className="input"
              >
                {cuotas.map((c) => (
                  <option key={c} value={c}>
                    {c === 1
                      ? "1 pago"
                      : `${c} cuotas de ${formatPrice(Math.round(total / c))}`}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {scriptError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                No se pudo cargar el procesador de pagos. Recargá la página o
                coordiná por WhatsApp.
              </div>
            )}

            <button
              type="submit"
              disabled={processing || !payway.configured}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando pago…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pagar {formatPrice(total)}
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--muted)]">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              Pago protegido por Payway. Tus datos van cifrados directo al banco.
            </p>
          </form>

          {/* RESUMEN */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">
                Tu pedido
              </h2>
              <div className="mt-4 max-h-60 space-y-3 overflow-y-auto">
                {items.map((it, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] font-display text-xs font-bold">
                      {it.qty}
                    </div>
                    <div className="min-w-0 flex-1 text-xs font-medium leading-snug">
                      {it.title}
                    </div>
                    <div className="shrink-0 font-display text-xs font-bold">
                      {formatPrice(it.price * it.qty)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-[var(--border)] pt-4">
                <span className="font-display text-sm font-bold uppercase">
                  Total
                </span>
                <span className="font-display text-2xl font-black">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .input {
          display: block;
          width: 100%;
          height: 2.75rem;
          margin-top: 0.375rem;
          padding: 0 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: #fff;
          font-size: 0.875rem;
          color: var(--foreground);
          outline: none;
        }
        select.input { height: 2.75rem; }
        .input:focus {
          border-color: var(--brand-red);
          box-shadow: 0 0 0 3px rgb(230 48 32 / 0.18);
        }
      `}</style>
    </main>
  );
}
