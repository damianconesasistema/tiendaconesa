"use client";

import { rutaAdminProducto } from "@/lib/rutas-producto";
import { useActionState, useEffect, useState, useTransition } from "react";
import { SHIPPING_TYPES } from "@/lib/shipping";
import { subrubrosDe } from "@/lib/subrubros";
import { alfabetico, OPCION_NUEVO, SIN_EXTRAS, todosLosRubros, type RubrosExtra } from "@/lib/rubros";
import { useRubrosAMano } from "@/components/admin/useRubrosAMano";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { MARCAS_BASE, porNombre, type Marca } from "@/lib/marcas";
import { createProduct } from "@/app/admin/productos/actions";

type State = { ok?: true; itemId?: string; error?: string } | null;

export function NewProductForm({
  marcas = MARCAS_BASE,
  rubrosExtra = SIN_EXTRAS,
}: {
  marcas?: readonly Marca[];
  /** Los rubros y subrubros agregados a mano. */
  rubrosExtra?: RubrosExtra;
} = {}) {
  const router = useRouter();
  const [rubro, setRubro] = useState("otros");
  const [sub, setSub] = useState("");
  const { extra, pedirRubro, pedirSubrubro } = useRubrosAMano(rubrosExtra);
  const subrubros = subrubrosDe(rubro, extra);
  const [state, formAction, isPending] = useActionState<State, FormData>(
    createProduct as (prev: State, fd: FormData) => Promise<State>,
    null,
  );

  // Al crear OK, redirigir a la ficha para subir la foto
  useEffect(() => {
    if (state && "ok" in state && state.ok && state.itemId) {
      router.push(rutaAdminProducto(state.itemId));
    }
  }, [state, router]);

  // A mano y no con <form action={...}>: con action, React vacia el
  // formulario al terminar, y si el alta volvia con un error (falta el
  // precio, codigo repetido) se perdia todo lo cargado. Ver ProductForm.
  const [, startCrear] = useTransition();
  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startCrear(() => formAction(fd));
  }

  return (
    <form onSubmit={enviar} className="mt-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <div>
          <Label>Título *</Label>
          <input
            name="title"
            required
            placeholder="Ej: Inodoro Ferrum Bari con mochila"
            className="input"
          />
        </div>
        <div>
          <Label>SKU interno (opcional)</Label>
          <input name="sku" placeholder="Ej: INO-001" className="input" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Categoría</Label>
          <select
            name="category"
            value={rubro}
            onChange={async (e) => {
              const v = e.target.value;
              if (v !== OPCION_NUEVO) {
                setRubro(v);
                setSub("");
                return;
              }
              const nuevo = await pedirRubro();
              if (nuevo) {
                setRubro(nuevo);
                setSub("");
              }
            }}
            className="input"
          >
            {todosLosRubros(extra).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
            <option value={OPCION_NUEVO}>+ Agregar rubro nuevo…</option>
          </select>
          <div className="mt-3">
            <Label>Subrubro</Label>
            <select
              name="subcategory"
              value={sub}
              onChange={async (e) => {
                const v = e.target.value;
                if (v !== OPCION_NUEVO) return setSub(v);
                const nuevo = await pedirSubrubro(rubro);
                if (nuevo) setSub(nuevo);
              }}
              className="input"
            >
              <option value="">
                {subrubros.length === 0 ? "Este rubro no tiene subrubros" : "Sin subrubro"}
              </option>
              {alfabetico(subrubros).map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
              <option value={OPCION_NUEVO}>+ Agregar subrubro nuevo…</option>
            </select>
          </div>
        </div>
        <div>
          <Label>Marca</Label>
          <select name="brand" defaultValue="" className="input">
            <option value="">Detectar del título</option>
            {porNombre(marcas).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Si lo dejás en automático, la saca del título (ej. "Griferia FV
            Arizona" → FV).
          </p>
        </div>
        <div>
          <Label>Tipo de envío (podés elegir más de uno)</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {SHIPPING_TYPES.map((s) => (
              <label
                key={s.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm hover:border-[var(--brand-red)]/40 has-[:checked]:border-[var(--brand-red)] has-[:checked]:bg-[var(--brand-red)]/5"
              >
                <input
                  type="checkbox"
                  name="shippingType"
                  value={s.id}
                  defaultChecked
                  className="h-4 w-4 accent-[var(--brand-red)]"
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <Label>Precio ARS *</Label>
          <input
            name="price"
            type="number"
            min="0"
            step="1"
            required
            placeholder="0"
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
            defaultValue={0}
            className="input"
          />
        </div>
      </div>

      <div>
        <Label>Descripción (opcional)</Label>
        <textarea
          name="description"
          rows={4}
          placeholder="Marca, medidas, color, incluye, etc."
          className="input resize-none"
        />
      </div>

      <div>
        <Label>Ayuda memoria (privada)</Label>
        <textarea
          name="memo"
          rows={2}
          placeholder="Proveedor, cotización, dónde está guardado, etc. Solo lo ve el admin."
          className="input resize-none"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle
          name="active"
          label="Producto activo"
          desc="Aparece en el catálogo público"
          defaultChecked
        />
        <Toggle
          name="featured"
          label="Destacado"
          desc="Aparece en la home"
          defaultChecked={false}
        />
      </div>

      {state && "error" in state && state.error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      {state && "ok" in state && state.ok && (
        <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          ¡Producto creado! Te llevamos a la ficha para subir la foto…
        </div>
      )}

      <div className="flex items-center gap-3 border-t border-[var(--border)] pt-5">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--brand-red-hover)] disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando…
            </>
          ) : (
            "Publicar artículo"
          )}
        </button>
        <p className="text-xs text-[var(--muted)]">
          Después de crearlo vas a poder subir la foto.
        </p>
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
        textarea.input { height: auto; padding: .625rem .75rem; }
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
