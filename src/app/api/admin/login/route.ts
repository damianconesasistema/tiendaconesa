import { NextResponse } from "next/server";
import { checkPassword, createAdminSession, getAdminPassword } from "@/lib/admin-auth";
import { entrarComo, PRINCIPAL } from "@/lib/usuarios";
import { registrar } from "@/lib/actividad";
import { conexionDe, FRENO_INGRESO, minutosTxt } from "@/lib/freno-ingreso";

// "admin" con la contrasena de /etc/conesa.env, o cada uno con su usuario
// (src/lib/usuarios.ts). Lo usan el ingreso al panel y el de Punto.
//
// V.0.11.243: el que prueba contraseñas se frena 15 minutos
// (src/lib/freno-ingreso.ts). El frenado no llega a comparar la contraseña:
// asi no puede seguir probando aunque acierte. Se libera antes desde Punto →
// Usuarios → Liberar.

export async function POST(request: Request) {
  const expected = getAdminPassword();
  if (!expected) {
    return NextResponse.json(
      { error: "Login no configurado. Falta ADMIN_PASSWORD en variables de entorno." },
      { status: 500 }
    );
  }

  let body: { username?: string; password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const username = (body.username || "").trim();
  const password = body.password || "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son obligatorios" },
      { status: 400 }
    );
  }

  const conexion = conexionDe(request);
  const usuario = username.slice(0, 40).toLowerCase();
  const espera = FRENO_INGRESO.espera(conexion, usuario);
  if (espera > 0) {
    return NextResponse.json(
      {
        error: `Demasiadas contraseñas equivocadas. Probá de nuevo en ${minutosTxt(espera)}, o pedí que te liberen en Punto → Usuarios.`,
      },
      { status: 429 }
    );
  }

  const quien =
    username.toLowerCase() === PRINCIPAL
      ? checkPassword(password)
        ? PRINCIPAL
        : null
      : await entrarComo(username, password);
  if (!quien) {
    const frenado = FRENO_INGRESO.fallo(conexion, usuario);
    // Queda anotado (sin la contrasena, claro): sirve para ver si alguien
    // anda probando. Ver src/lib/actividad.ts.
    await registrar(
      frenado ? "Frenado 15 minutos por contraseñas equivocadas" : "Intentó entrar con una contraseña equivocada",
      `Desde la conexión ${conexion}`,
      usuario,
    );
    // Pequeña demora para dificultar fuerza bruta
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      {
        error: frenado
          ? "Demasiadas contraseñas equivocadas. Probá de nuevo en 15 minutos, o pedí que te liberen en Punto → Usuarios."
          : "Usuario o contraseña incorrectos",
      },
      { status: frenado ? 429 : 401 }
    );
  }

  FRENO_INGRESO.entro(conexion, usuario);
  await createAdminSession(quien);
  await registrar("Entró al panel", null, quien);
  return NextResponse.json({ ok: true });
}
