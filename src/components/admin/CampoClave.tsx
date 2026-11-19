"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

// Un campo de contraseña con el ojito para verla. Damian, 19/11/2026: "PONELE
// EL OJITO PARA VER LA PASSWORD SIEMPRE EN TODOS LOS LUGARES DONDE TENGA
// CONTRASEÑA". Va en todos: entrar al panel, usuarios, cambiar la propia, y
// las claves de MercadoLibre y de Google.
//
// Se usa igual que un <input>: lo que se le pasa va al campo. Las clases de
// ubicacion (margen, ancho, flex) van a la caja de afuera, asi el ojito queda
// centrado sobre el campo y no sobre el margen.

const DE_AFUERA = /^(m[trblxy]?-|flex-|min-w-|max-w-|basis-|w-)/;

export function CampoClave({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [ver, setVer] = useState(false);
  const clases = className.split(/\s+/).filter(Boolean);
  const afuera = clases.filter((c) => DE_AFUERA.test(c)).join(" ");
  const adentro = clases.filter((c) => !DE_AFUERA.test(c)).join(" ");
  return (
    <div className={`relative ${afuera}`}>
      <input {...props} type={ver ? "text" : "password"} className={`${adentro} w-full pr-11`} />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        aria-label={ver ? "Ocultar la contraseña" : "Ver la contraseña"}
        title={ver ? "Ocultar" : "Ver lo que escribiste"}
        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface)] hover:text-foreground"
      >
        {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
