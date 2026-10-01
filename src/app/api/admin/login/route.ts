import { NextResponse } from "next/server";
import { checkPassword, createAdminSession, getAdminPassword } from "@/lib/admin-auth";

const ADMIN_USERNAME = "admin";

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

  if (username !== ADMIN_USERNAME || !checkPassword(password)) {
    // Pequeña demora para dificultar fuerza bruta
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      { error: "Usuario o contraseña incorrectos" },
      { status: 401 }
    );
  }

  await createAdminSession(username);
  return NextResponse.json({ ok: true });
}
