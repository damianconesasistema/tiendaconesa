"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Mail, X } from "lucide-react";
import { TRANSPORTES, NOMBRE_AVISO, type Aviso } from "@/lib/transportes";
import { updateOrderStatus } from "@/app/admin/pedidos/actions";
import { Ayuda } from "@/components/admin/Ayuda";

// El estado del pedido, en su ficha. Igual que antes, salvo dos estados que
// le avisan al cliente por mail (Damian, 18/11/2026: "cuando hay un
// seguimiento del envio que esta en camino, le podemos avisar tambien por
// mail"):
//   - "En entrega": si va con envio, se elige el transporte y se carga el
//     seguimiento, y le llega "tu pedido esta en camino". Si lo retira, le
//     llega "esta listo para retirar".
//   - "Entregado": le llega "gracias por tu compra".
// Antes de guardar esos dos se muestra que se le va a mandar, con una
// casilla para no mandarlo.

const ESTADOS = [
  { id: "pendiente", label: "Pendiente", color: "bg-amber-100 text-amber-800" },
  { id: "confirmado", label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  { id: "en_preparacion", label: "En preparación", color: "bg-indigo-100 text-indigo-800" },
  { id: "en_entrega", label: "En entrega", color: "bg-purple-100 text-purple-800" },
  { id: "entregado", label: "Entregado", color: "bg-green-100 text-green-800" },
  { id: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-700" },
];

const CON_AVISO = new Set(["en_entrega", "entregado"]);

function fechaCorta(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.toLocaleDateString("es-AR", { day: "numeric", month: "numeric" })} ${d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function EstadoDelPedido({
  orderId,
  actual,
  retira,
  emailCliente,
  transporte: transporteGuardado,
  seguimiento: seguimientoGuardado,
  link: linkGuardado,
  avisos,
}: {
  orderId: string;
  actual: string;
  retira: boolean;
  emailCliente: string | null;
  transporte: string | null;
  seguimiento: string | null;
  link: string | null;
  avisos: Aviso[];
}) {
  const [estado, setEstado] = useState(actual);
  // El estado elegido que espera confirmar (los que mandan mail).
  const [porGuardar, setPorGuardar] = useState<string | null>(null);
  // De entrada, la agencia con la que se manda hoy (src/lib/transportes.ts).
  const [transporte, setTransporte] = useState(transporteGuardado ?? (retira ? "" : "jym"));
  const [seguimiento, setSeguimiento] = useState(seguimientoGuardado ?? "");
  const [link, setLink] = useState(linkGuardado ?? "");
  const [avisar, setAvisar] = useState(true);
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const etiqueta = (id: string) =>
    id === "en_entrega" && retira ? "Listo para retirar" : (ESTADOS.find((e) => e.id === id)?.label ?? id);
  const meta = ESTADOS.find((e) => e.id === estado) ?? ESTADOS[0];
  const puedeAvisar = !!emailCliente?.includes("@");

  function guardar(nuevo: string, conAviso: boolean) {
    setMsg(null);
    iniciar(async () => {
      const r = await updateOrderStatus(
        orderId,
        nuevo,
        CON_AVISO.has(nuevo) ? { avisar: conAviso && puedeAvisar, transporte, seguimiento, link } : undefined,
      );
      if (r.error) {
        setMsg({ ok: false, texto: r.error });
        return;
      }
      setEstado(nuevo);
      setPorGuardar(null);
      if (r.aviso)
        setMsg(
          r.aviso.ok
            ? { ok: true, texto: `Guardado. Le llegó el mail a ${r.aviso.a}.` }
            : { ok: false, texto: `Guardado, pero el mail no salió: ${r.aviso.error ?? "no se sabe por qué"}.` },
        );
      else setMsg({ ok: true, texto: "Guardado." });
    });
  }

  function elegir(nuevo: string) {
    if (nuevo === estado) {
      setPorGuardar(null);
      return;
    }
    if (CON_AVISO.has(nuevo)) {
      setAvisar(puedeAvisar);
      setPorGuardar(nuevo);
      setMsg(null);
    } else guardar(nuevo, false);
  }

  const campo =
    "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--brand-red)]";

  return (
    <div className="w-full sm:w-[420px]">
      <div className="flex items-center justify-end gap-3">
        {pendiente && <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />}
        <Ayuda texto="Pendiente: entró y falta confirmarlo. Confirmado: el pago está y se va a preparar. En preparación: lo están armando. En entrega (o Listo para retirar): salió o ya se puede buscar; se le puede avisar por mail con el seguimiento. Entregado: lo recibió. Cancelado: no sigue." />
        <label className="relative inline-flex items-center">
          <span
            className={`pointer-events-none absolute left-3 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${meta.color}`}
          >
            {etiqueta(estado)}
          </span>
          <select
            value={porGuardar ?? estado}
            onChange={(e) => elegir(e.target.value)}
            disabled={pendiente}
            className="h-11 min-w-[220px] rounded-full border border-[var(--border)] bg-white pl-[150px] pr-4 text-sm outline-none focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red)]/20 disabled:opacity-60"
          >
            {ESTADOS.map((e) => (
              <option key={e.id} value={e.id}>
                {etiqueta(e.id)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {porGuardar && (
        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white p-4 text-left shadow-sm">
          <div className="font-display text-xs font-bold uppercase tracking-wider">
            Pasar a «{etiqueta(porGuardar)}»
          </div>

          {porGuardar === "en_entrega" && !retira && (
            <div className="mt-3 space-y-2.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Cómo va</label>
                <select value={transporte} onChange={(e) => setTransporte(e.target.value)} className={`${campo} mt-1`}>
                  {TRANSPORTES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {transporte !== "flete" && (
                <>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Número de seguimiento
                    </label>
                    <input
                      value={seguimiento}
                      onChange={(e) => setSeguimiento(e.target.value)}
                      maxLength={80}
                      placeholder="El que figura en el comprobante del envío"
                      className={`${campo} mt-1`}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      Link de seguimiento (si el transporte te dio uno)
                    </label>
                    <input
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      maxLength={500}
                      placeholder="https://…"
                      className={`${campo} mt-1`}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <label className={`mt-3 flex items-start gap-2 text-sm ${puedeAvisar ? "cursor-pointer" : "opacity-60"}`}>
            <input
              type="checkbox"
              checked={avisar && puedeAvisar}
              disabled={!puedeAvisar}
              onChange={(e) => setAvisar(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--brand-red)]"
            />
            <span>
              {puedeAvisar ? (
                <>
                  Mandarle a <strong>{emailCliente}</strong> el mail «
                  {porGuardar === "entregado"
                    ? NOMBRE_AVISO.entregado
                    : retira
                      ? NOMBRE_AVISO.listo_retirar
                      : NOMBRE_AVISO.en_camino}
                  »
                </>
              ) : (
                "El cliente no dejó mail: no se le puede avisar."
              )}
            </span>
          </label>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPorGuardar(null)}
              disabled={pendiente}
              className="h-9 rounded-full border border-[var(--border)] px-4 text-xs font-bold uppercase tracking-wider"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => guardar(porGuardar, avisar)}
              disabled={pendiente}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--brand-red)] px-4 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
            >
              {pendiente && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {avisar && puedeAvisar ? "Guardar y avisar" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`mt-2 text-right text-xs font-semibold ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.texto}</p>
      )}

      {avisos.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-right text-[11px] text-[var(--muted)]">
          {avisos.map((a, i) => (
            <li key={i} className="inline-flex w-full items-center justify-end gap-1">
              <Mail className="h-3 w-3" />
              «{NOMBRE_AVISO[a.tipo] ?? a.tipo}» a {a.a} · {fechaCorta(a.fecha)}
              {a.ok ? (
                <Check className="h-3 w-3 text-green-700" />
              ) : (
                <span className="inline-flex items-center gap-0.5 text-red-700">
                  <X className="h-3 w-3" /> no salió{a.error ? `: ${a.error}` : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
