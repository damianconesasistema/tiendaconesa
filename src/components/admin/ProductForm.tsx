"use client";

import { useActionState } from "react";
import { Check, AlertCircle } from "lucide-react";

type Product = {
  itemId: string;
  sku: string | null;
  title: string;
  description: string | null;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  memo: string | null;
  shippingType: string | null;
};

type State = { ok?: true } | { error: string } | null;

const CATEGORIES = [
  { id: "sanitarios", label: "Sanitarios" },
  { id: "griferia", label: "Grifería" },
  { id: "banera", label: "Bañeras" },
  { id: "accesorios", label: "Accesorios" },
  { id: "salamandras", label: "Salamandras" },
  { id: "calefones", label: "Calefones" },
  { id: "materiales", label: "Materiales" },
  { id: "piletas", label: "Piletas" },
  { id: "otros", label: "Otros" },
];

export const SHIPPING_OPTIONS = [
  { id: "ambos", label: "Retiro o envío (ambos)" },
  { id: "retiro", label: "Solo retiro en tienda" },
  { id: "envio", label: "Solo envío a Traslasierra" },
  { id: "gratis", label: "Envío gratis" },
];

export function ProductForm({
  product,
  action,
}: {
  product: Product;
  action: (prev: unknown, fd: FormData) => Promise<State>;
}) {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    action as (prev: State, fd: FormData) => Promise<State>,
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="itemId" value={product.itemId} />

      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <div>
          <Label>Título</Label>
          <input
            name="title"
            defaultValue={product.title}
            required
            className="input"
          />
        </div>
        <div>
          <Label>SKU interno (opcional)</Label>
          <input
            name="sku"
            defaultValue={product.sku ?? ""}
            placeholder="Ej: GRI-001"
            className="input"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Categoría</Label>
          <select
            name="category"
            defaultValue={product.category}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Tipo de envío</Label>
          <select
            name="shippingType"
            defaultValue={product.shippingType ?? "ambos"}
            className="input"
          >
            {SHIPPING_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label>Precio ARS</Label>
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            defaultValue={product.price}
            required
            className="input"
          />
        </div>
        <div>
          <Label>Precio oferta (opcional)</Label>
          <input
            name="salePrice"
            type="number"
            min="0"
            step="1"
            defaultValue={product.salePrice ?? ""}
            placeholder="Vacío = sin oferta"
            className="input"
          />
        </div>
        <div>
          <Label>Stock</Label>
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            defaultValue={product.stock}
            required
            className="input"
          />
        </div>
      </div>

      <div>
        <Label>Descripción (opcional)</Label>
        <textarea
          name="description"
          defaultValue={product.description || ""}
          rows={4}
          placeholder="Marca, medidas, color, incluye, etc."
          className="input resize-none"
        />
      </div>

      <div>
        <Label>Ayuda memoria (privada)</Label>
        <textarea
          name="memo"
          defaultValue={product.memo || ""}
          rows={3}
          placeholder="Proveedor, cotización, último remito, dónde está guardado, etc. Solo lo ve el admin."
          className="input resize-none"
        />
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          No se publica. Es para que recuerdes información del artículo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          name="active"
          label="Producto activo"
          desc="Aparece en el catálogo público"
          defaultChecked={product.active}
        />
        <Toggle
          name="featured"
          label="Destacado"
          desc="Aparece en la home"
          defaultChecked={product.featured}
        />
      </div>

      {/* Feedback */}
      {state && "error" in state && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      {state && "ok" in state && state.ok && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          Cambios guardados.
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-[var(--border)] pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--brand-red-hover)] disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <style>{`
        .input {
          display: block;
          width: 100%;
          height: 2.75rem;
          padding: 0 .75rem;
          border: 1px solid var(--border);
          border-radius: .75rem;
          background: #fff;
          font-size: .875rem;
          color: var(--foreground);
          outline: none;
        }
        .input:focus {
          border-color: var(--brand-red);
          box-shadow: 0 0 0 3px rgb(230 48 32 / .18);
        }
        textarea.input {
          height: auto;
          padding: .625rem .75rem;
        }
      `}</style>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-display text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
      {children}
    </label>
  );
}

function Toggle({
  name,
  label,
  desc,
  defaultChecked,
}: {
  name: string;
  label: string;
  desc: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-white p-3 hover:border-[var(--brand-red)]/40">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 accent-[var(--brand-red)]"
      />
      <div>
        <div className="font-display text-sm font-bold">{label}</div>
        <div className="text-xs text-[var(--muted)]">{desc}</div>
      </div>
    </label>
  );
}
