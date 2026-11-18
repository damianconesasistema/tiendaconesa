"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Trash2, UserPlus } from "lucide-react";
import { activarUsuario, borrarUsuario, cambiarClave, crearUsuario } from "@/app/admin/usuarios/actions";

// La pantalla de usuarios del panel. Ver src/lib/usuarios.ts.

export type FilaUsuario = {
  id: string;
  username: string;
  nombre: string;
  activo: boolean;
  /** Ya armado en hora argentina, o null si nunca entro. */
  ultimoIngreso: string | null;
};

const campo =
  "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--brand-red)]";
const etiqueta = "text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]";

/** Lo que ve "admin": la lista, crear, desactivar, borrar y cambiar claves. */
export function UsuariosAdmin({ usuarios }: { usuarios: FilaUsuario[] }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [claveDe, setClaveDe] = useState<string | null>(null);
  const [claveNueva, setClaveNueva] = useState("");

  function hacer(f: () => Promise<{ ok?: true; error?: string }>, bien: string, despues?: () => void) {
    setMsg(null);
    iniciar(async () => {
      const r = await f();
      if (r.error) setMsg({ ok: false, texto: r.error });
      else {
        setMsg({ ok: true, texto: bien });
        despues?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">Usuario nuevo</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Le ponés una contraseña para que entre la primera vez; después la puede cambiar él desde esta misma
          pantalla. Mínimo 8 letras o números.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            hacer(
              () => crearUsuario({ nombre, usuario, clave }),
              `Listo: ${nombre} ya puede entrar con el usuario "${usuario.trim().toLowerCase()}".`,
              () => {
                setNombre("");
                setUsuario("");
                setClave("");
              },
            );
          }}
        >
          <div>
            <label className={etiqueta}>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" className={`${campo} mt-1`} />
          </div>
          <div>
            <label className={etiqueta}>Usuario</label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="juan"
              autoComplete="off"
              className={`${campo} mt-1`}
            />
          </div>
          <div>
            <label className={etiqueta}>Contraseña</label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="new-password"
              className={`${campo} mt-1`}
            />
          </div>
          <button
            type="submit"
            disabled={pendiente || !nombre.trim() || !usuario.trim() || !clave}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {pendiente ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Crear
          </button>
        </form>
      </section>

      {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.texto}</p>}

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Usuarios
        </div>
        <ul className="divide-y divide-[var(--border)]">
          <li className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">admin</div>
              <div className="text-xs text-[var(--muted)]">El principal. Su contraseña está en el servidor.</div>
            </div>
          </li>
          {usuarios.map((u) => (
            <li key={u.id} className="px-5 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {u.nombre} <span className="font-normal text-[var(--muted)]">· {u.username}</span>
                    {!u.activo && (
                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                        desactivado
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {u.ultimoIngreso ? `Último ingreso: ${u.ultimoIngreso}` : "Todavía no entró"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() => {
                    setClaveDe(claveDe === u.id ? null : u.id);
                    setClaveNueva("");
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[var(--border)] px-3 text-xs font-semibold hover:border-[var(--brand-red)]"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Contraseña
                </button>
                <button
                  type="button"
                  disabled={pendiente}
                  onClick={() =>
                    hacer(
                      () => activarUsuario(u.id, !u.activo),
                      u.activo ? `${u.nombre} ya no puede entrar.` : `${u.nombre} puede entrar de nuevo.`,
                    )
                  }
                  className="h-8 rounded-full border border-[var(--border)] px-3 text-xs font-semibold hover:border-[var(--brand-red)]"
                >
                  {u.activo ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  disabled={pendiente}
                  title="Borrar este usuario"
                  onClick={() => {
                    if (window.confirm(`¿Borrar el usuario de ${u.nombre}? No va a poder entrar más.`))
                      hacer(() => borrarUsuario(u.id), `Se borró el usuario de ${u.nombre}.`);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-red-600 hover:border-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {claveDe === u.id && (
                <form
                  className="mt-3 flex flex-wrap items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    hacer(
                      () => cambiarClave({ id: u.id, clave: claveNueva }),
                      `Listo: ${u.nombre} ya entra con la contraseña nueva.`,
                      () => setClaveDe(null),
                    );
                  }}
                >
                  <div className="min-w-[220px] flex-1">
                    <label className={etiqueta}>Contraseña nueva de {u.nombre}</label>
                    <input
                      type="password"
                      value={claveNueva}
                      onChange={(e) => setClaveNueva(e.target.value)}
                      autoComplete="new-password"
                      className={`${campo} mt-1`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pendiente || !claveNueva}
                    className="h-10 rounded-full bg-[var(--brand-red)] px-4 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </form>
              )}
            </li>
          ))}
          {usuarios.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-[var(--muted)]">Todavía no hay otros usuarios.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

/** Lo que ve cada usuario (no admin): cambiar su contraseña. */
export function CambiarMiClave() {
  const [clave, setClave] = useState("");
  const [otraVez, setOtraVez] = useState("");
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  return (
    <form
      className="mt-6 max-w-md space-y-3 rounded-2xl border border-[var(--border)] bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (clave !== otraVez) {
          setMsg({ ok: false, texto: "Las dos contraseñas no son iguales." });
          return;
        }
        setMsg(null);
        iniciar(async () => {
          const r = await cambiarClave({ clave });
          if (r.error) setMsg({ ok: false, texto: r.error });
          else {
            setMsg({ ok: true, texto: "Listo: la próxima vez entrás con la contraseña nueva." });
            setClave("");
            setOtraVez("");
          }
        });
      }}
    >
      <h2 className="font-display text-sm font-bold uppercase tracking-wider">Cambiar mi contraseña</h2>
      <div>
        <label className={etiqueta}>Contraseña nueva</label>
        <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} autoComplete="new-password" className={`${campo} mt-1`} />
      </div>
      <div>
        <label className={etiqueta}>Repetila</label>
        <input type="password" value={otraVez} onChange={(e) => setOtraVez(e.target.value)} autoComplete="new-password" className={`${campo} mt-1`} />
      </div>
      <button
        type="submit"
        disabled={pendiente || !clave || !otraVez}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
      >
        {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar
      </button>
      {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.texto}</p>}
    </form>
  );
}
