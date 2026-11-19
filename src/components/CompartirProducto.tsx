"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { rutaProducto } from "@/lib/rutas-producto";
import { gaCompartir } from "@/lib/ga";
import { copiarTexto } from "@/lib/copiar";

// Compartir un producto con un amigo o un familiar. Damian, 19/11/2026: "EL
// COMPARTIR POR WHATSAPP HACELO MAS FACIL PARA PODER ENVIAR A UN AMIGO O
// FAMILIAR EL LINK DEL PRODUCTO" / "QUE TE COPIE EL LINK Y YA VOS LO PUEDAS
// PEGAR EN WHATSAPP".
//
// Dos botones a la vista, sin menues: "Enviar por WhatsApp" abre WhatsApp con
// el mensaje y el link ya escritos (solo hay que elegir a quien), y "Copiar
// link" lo deja copiado y avisa que hay que pegarlo. En el celular aparece
// ademas "Otras apps", el menu de compartir del telefono.
//
// El link es el de la ficha, sin nada atras (?filtros...): el que lo recibe
// cae en el producto. WhatsApp le muestra la foto, el nombre y el precio.

export function CompartirProducto({ itemId, titulo }: { itemId: string; titulo: string }) {
  const [copiado, setCopiado] = useState(false);
  // Si el navegador no deja copiar, el link queda a la vista para copiarlo a mano.
  const [aMano, setAMano] = useState<string | null>(null);
  // El menu de compartir del telefono: el servidor no sabe si existe, asi que
  // arranca en false y el navegador lo prende si lo tiene.
  const puedeCompartir = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

  const link = () => `${window.location.origin}${rutaProducto(itemId)}`;
  const mensaje = () => `Mirá este producto en Sanitarios Conesa: ${titulo}\n${link()}`;

  async function copiar() {
    gaCompartir("copiar", itemId);
    if (await copiarTexto(link())) {
      setAMano(null);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 4000);
    } else setAMano(link());
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center">
      <p className="font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
        ¿Se lo querés mostrar a alguien?
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            gaCompartir("whatsapp", itemId);
            window.open(`https://wa.me/?text=${encodeURIComponent(mensaje())}`, "_blank", "noopener");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.03]"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar por WhatsApp
        </a>
        <button
          type="button"
          onClick={copiar}
          className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
            copiado
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-[var(--border)] bg-white text-foreground hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
          }`}
        >
          {copiado ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {copiado ? "Link copiado" : "Copiar link"}
        </button>
        {puedeCompartir && (
          <button
            type="button"
            onClick={() => {
              gaCompartir("otras-apps", itemId);
              navigator.share({ title: titulo, text: `Mirá este producto en Sanitarios Conesa: ${titulo}`, url: link() }).catch(() => {});
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground hover:border-[var(--brand-red)]"
          >
            <Share2 className="h-4 w-4" />
            Otras apps
          </button>
        )}
      </div>
      {copiado && (
        <p className="mt-2 text-xs font-semibold text-green-700">
          ¡Listo! Ahora abrí WhatsApp, elegí a quién y pegalo en el mensaje.
        </p>
      )}
      {aMano && (
        <div className="mt-3 text-left">
          <p className="text-xs text-[var(--muted)]">Copiá este link y pegalo en WhatsApp:</p>
          <input
            readOnly
            value={aMano}
            onFocus={(e) => e.currentTarget.select()}
            autoFocus
            className="mt-1 h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm"
          />
        </div>
      )}
    </div>
  );
}
