import { NextResponse } from "next/server";
import { checkPassword, createAdminSession, getAdminPassword } from "@/lib/admin-auth";
import { entrarComo, PRINCIPAL } from "@/lib/usuarios";
import { registrar } from "@/lib/actividad";

// "admin" con la contrasena de /etc/conesa.env, o cada uno con su usuario
// (src/lib/usuarios.ts).

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

  const quien =
    username.toLowerCase() === PRINCIPAL
      ? checkPassword(password)
        ? PRINCIPAL
        : null
      : await entrarComo(username, password);
  if (!quien) {
    // Queda anotado (sin la contrasena, claro): sirve para ver si alguien
    // anda probando. Ver src/lib/actividad.ts.
    await registrar("Intentó entrar con una contraseña equivocada", null, username.slice(0, 40).toLowerCase());
    // Pequeña demora para dificultar fuerza bruta
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  await createAdminSession(quien);
  await registrar("Entró al panel", null, quien);
  return NextResponse.json({ ok: true });
}
