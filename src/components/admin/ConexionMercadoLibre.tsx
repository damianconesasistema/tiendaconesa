"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Link2, Unlink } from "lucide-react";
import {
  desconectarMercadoLibre,
  guardarAplicacionML,
} from "@/app/admin/productos/mercadolibre/actions";
import { CampoClave } from "@/components/admin/CampoClave";

// Los tres pasos para conectar la cuenta de MercadoLibre de Sanitarios
// Conesa: crear la aplicacion en MercadoLibre, cargar aca su numero y su
// clave, y dar el permiso. La clave se escribe una vez y no se vuelve a
// mostrar nunca.

export function ConexionMercadoLibre({
  estado,
  redireccion,
  ok,
  error,
}: {
  estado: { appId: string | null; tieneClave: boolean; conectado: boolean; nickname: string | null };
  redireccion: string;
  ok: string | null;
  error: string | null;
}) {
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(
    error ? { ok: false, texto: error } : ok !== null ? { ok: true, texto: `Conectado${ok ? ` como ${ok}` : ""}.` } : null,
  );
  const [copiado, setCopiado] = useState(false);
  const listaApp = !!estado.appId && estado.tieneClave;

  function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setMsg(null);
    iniciar(async () => {
      const r = await guardarAplicacionML(fd);
      if (r.error) setMsg({ ok: false, texto: r.error });
      else {
        setMsg({ ok: true, texto: "Guardado. Ahora tocá Conectar con MercadoLibre." });
        const clave = form.elements.namedItem("clave") as HTMLInputElement | null;
        if (clave) clave.value = "";
      }
    });
  }

  function desconectar() {
    if (!confirm("¿Desconectar MercadoLibre? Se deja de buscar ahí hasta que lo conectes de nuevo.")) return;
    iniciar(async () => {
      const r = await desconectarMercadoLibre();
      setMsg("error" in r ? { ok: false, texto: r.error } : { ok: true, texto: "Desconectado." });
    });
  }

  return (
    <div className="mt-8 max-w-2xl space-y-5">
      {msg && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
          }`}
        >
          {msg.texto}
        </p>
      )}

      <div
        className={`rounded-2xl border p-4 text-sm ${
          estado.conectado ? "border-green-200 bg-green-50 text-green-900" : "border-[var(--border)] bg-white"
        }`}
      >
        {estado.conectado ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              <strong>Conectado</strong>
              {estado.nickname ? ` con la cuenta ${estado.nickname}` : ""}. Ya se
              busca en MercadoLibre cuando la página de la marca no tiene el artículo.
            </span>
            <button
              type="button"
              onClick={desconectar}
              disabled={pendiente}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted)] underline disabled:opacity-50"
            >
              <Unlink className="h-3.5 w-3.5" /> Desconectar
            </button>
          </div>
        ) : (
          <span>
            <strong>Sin conectar.</strong> Seguí los tres pasos de abajo.
          </span>
        )}
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">
          1 · Crear la aplicación en MercadoLibre
        </h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-[var(--muted)]">
          <li>
            Entrá a{" "}
            <a
              href="https://developers.mercadolibre.com.ar/devcenter"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-bold text-[var(--brand-red)] underline"
            >
              developers.mercadolibre.com.ar <ExternalLink className="h-3 w-3" />
            </a>{" "}
            con la cuenta de MercadoLibre de <strong>Sanitarios Conesa</strong>.
          </li>
          <li>Tocá &quot;Crear aplicación&quot;. De nombre poné, por ejemplo, &quot;Tienda Conesa fotos&quot;.</li>
          <li>
            En &quot;URI de redirect&quot; pegá esta dirección, tal cual:
            <div className="mt-1 flex items-center gap-2">
              <code className="rounded bg-[var(--surface)] px-2 py-1 text-xs text-foreground">{redireccion}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(redireccion);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-red)]"
              >
                {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? "Copiada" : "Copiar"}
              </button>
            </div>
          </li>
          <li>En los permisos alcanza con <strong>lectura</strong> (no hace falta publicar ni vender).</li>
          <li>Guardala. MercadoLibre te muestra el <strong>App ID</strong> y la <strong>Clave secreta</strong>.</li>
        </ol>
      </section>

      <form onSubmit={guardar} className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">
          2 · Cargar el número y la clave
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">App ID</label>
            <input
              name="appId"
              defaultValue={estado.appId ?? ""}
              inputMode="numeric"
              autoComplete="off"
              placeholder="1234567890123456"
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Clave secreta</label>
            <CampoClave
              name="clave"
              autoComplete="new-password"
              placeholder={estado.tieneClave ? "Ya está cargada (dejalo vacío)" : "La que muestra MercadoLibre"}
              className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={pendiente}
          className="mt-4 inline-flex h-10 items-center rounded-full bg-[var(--brand-red)] px-5 font-display text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          Guardar
        </button>
        <p className="mt-2 text-[11px] text-[var(--muted)]">
          La clave queda guardada en la tienda y no se vuelve a mostrar.
        </p>
      </form>

      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">3 · Dar el permiso</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Te lleva a MercadoLibre: entrás con la cuenta de Sanitarios Conesa y
          tocás &quot;Permitir&quot;. Después vuelve solo a esta pantalla.
        </p>
        {listaApp ? (
          <a
            href="/api/admin/mercadolibre/conectar"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#FFE600] px-5 font-display text-xs font-bold uppercase tracking-wider text-[#2D3277]"
          >
            <Link2 className="h-4 w-4" />
            {estado.conectado ? "Volver a conectar" : "Conectar con MercadoLibre"}
          </a>
        ) : (
          <p className="mt-3 text-xs text-amber-800">Primero cargá el App ID y la clave (paso 2).</p>
        )}
      </section>
    </div>
  );
}
