"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShoppingBag, X, BellRing } from "lucide-react";
import { formatPrice } from "@/lib/order";

// Avisa en el panel cuando entra una venta nueva, sin recargar la página.
//
// Guarda en localStorage la fecha del último pedido ya visto, así al volver
// más tarde no te avisa de pedidos que ya conocías.
//
// LÍMITE IMPORTANTE: esto solo funciona con el panel ABIERTO. Para enterarte
// con el panel cerrado hace falta mail o Telegram (ver README del proyecto).

const CLAVE = "conesa:ultimoPedidoVisto";
const CADA_MS = 30_000;

type Nuevo = {
  number: number;
  total: number;
  cliente: string;
  pago: string;
  fecha: string;
};

export function AlertaVentas() {
  const [nuevos, setNuevos] = useState<Nuevo[]>([]);
  const permisoPedido = useRef(false);

  useEffect(() => {
    let vivo = true;

    // Un bip corto generado con WebAudio: evita tener que subir un archivo
    // de sonido y que el navegador lo bloquee por tamaño.
    function bip() {
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const vol = ctx.createGain();
        osc.connect(vol);
        vol.connect(ctx.destination);
        osc.frequency.value = 880;
        vol.gain.setValueAtTime(0.0001, ctx.currentTime);
        vol.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch {
        /* sin audio: el aviso visual alcanza */
      }
    }

    function notificar(n: Nuevo) {
      bip();
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        new Notification(`Venta nueva · Pedido #${n.number}`, {
          body: `${n.cliente} — ${formatPrice(n.total)}`,
          icon: "/icon.png",
        });
      }
    }

    async function revisar() {
      const visto = localStorage.getItem(CLAVE);
      const url = visto
        ? `/api/admin/pedidos/nuevos?desde=${encodeURIComponent(visto)}`
        : "/api/admin/pedidos/nuevos";
      try {
        const r = await fetch(url, { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as {
          ok?: boolean;
          nuevos?: Nuevo[];
          ultimaFecha?: string | null;
        };
        if (!vivo || !d.ok) return;

        // Primera vez: solo fijamos el punto de partida, sin avisar.
        if (!visto) {
          if (d.ultimaFecha) localStorage.setItem(CLAVE, d.ultimaFecha);
          else localStorage.setItem(CLAVE, new Date().toISOString());
          return;
        }

        if (d.nuevos && d.nuevos.length) {
          setNuevos(d.nuevos);
          notificar(d.nuevos[0]);
        }
      } catch {
        /* sin conexión: reintenta en el próximo ciclo */
      }
    }

    // Pedir permiso de notificación una sola vez
    if (
      !permisoPedido.current &&
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      permisoPedido.current = true;
      Notification.requestPermission().catch(() => {});
    }

    revisar();
    const id = setInterval(revisar, CADA_MS);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  function marcarVisto() {
    if (nuevos.length) localStorage.setItem(CLAVE, nuevos[0].fecha);
    setNuevos([]);
  }

  if (!nuevos.length) return null;

  const total = nuevos.reduce((s, n) => s + n.total, 0);

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(92vw,22rem)] animate-banner-in rounded-2xl border-2 border-green-500 bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 animate-banner-beat items-center justify-center rounded-full bg-green-500 text-white">
          <BellRing className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-black uppercase tracking-wider text-green-700">
            {nuevos.length === 1
              ? "¡Venta nueva!"
              : `¡${nuevos.length} ventas nuevas!`}
          </div>
          <div className="mt-1 space-y-0.5 text-xs text-foreground">
            {nuevos.slice(0, 3).map((n) => (
              <div key={n.number} className="flex justify-between gap-2">
                <span className="truncate">
                  #{n.number} · {n.cliente}
                </span>
                <strong className="whitespace-nowrap">
                  {formatPrice(n.total)}
                </strong>
              </div>
            ))}
            {nuevos.length > 3 && (
              <div className="text-[var(--muted)]">
                y {nuevos.length - 3} más · total {formatPrice(total)}
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/admin/pedidos"
              onClick={marcarVisto}
              className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-white hover:bg-green-700"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Ver pedidos
            </Link>
            <button
              type="button"
              onClick={marcarVisto}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] hover:text-foreground"
            >
              Listo
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={marcarVisto}
          aria-label="Cerrar aviso"
          className="shrink-0 text-[var(--muted)] hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
