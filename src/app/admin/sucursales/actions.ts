"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

type Resultado = { ok?: true; error?: string };

const texto = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};

// Guarda los datos de una sucursal.
//
// Casi todo es texto libre y va directo. Lo que se valida es lo que, si
// queda mal, rompe algo en otro lado:
//
//   - el subdominio, porque es lo que decide de quien es cada venta
//   - el CUIT, porque va en la factura
//   - que haya exactamente una sucursal que cubra el resto del pais, porque
//     si no un cliente de una provincia sin zona asignada no lo atiende nadie
export async function guardarSucursal(formData: FormData): Promise<Resultado> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta la sucursal" };

  const nombre = String(formData.get("name") ?? "").trim();
  if (!nombre) return { error: "El nombre no puede quedar vacío." };

  const subdominio = texto(formData, "subdominio");
  if (subdominio && !/^[a-z0-9-]+$/.test(subdominio))
    return {
      error:
        "El subdominio va sin puntos y en minúsculas: solo letras, números y guiones (por ejemplo: balvanera).",
    };

  const cuit = texto(formData, "cuit");
  if (cuit && (cuit.replace(/\D/g, "") || "").length !== 11)
    return { error: "El CUIT tiene que tener 11 dígitos." };

  const cubreTodoElPais = formData.get("cubreTodoElPais") === "on";
  if (cubreTodoElPais) {
    // Solo una puede cubrir el resto del pais: si quedan dos, el pedido de
    // una zona sin asignar caeria en cualquiera de las dos.
    await prisma.branch.updateMany({
      where: { id: { not: id } },
      data: { cubreTodoElPais: false },
    });
  } else {
    const otras = await prisma.branch.count({
      where: { id: { not: id }, cubreTodoElPais: true },
    });
    if (otras === 0)
      return {
        error:
          "Tiene que haber una sucursal que cubra el resto del país. Marcá primero la otra.",
      };
  }

  try {
    await prisma.branch.update({
      where: { id },
      data: {
        name: nombre,
        subdominio,
        active: formData.get("active") === "on",
        razonSocial: texto(formData, "razonSocial"),
        cuit,
        iibb: texto(formData, "iibb"),
        inicioAct: texto(formData, "inicioAct"),
        afipQr: texto(formData, "afipQr"),
        address: texto(formData, "address"),
        city: texto(formData, "city"),
        province: texto(formData, "province"),
        postalCode: texto(formData, "postalCode"),
        phone: texto(formData, "phone"),
        whatsapp: texto(formData, "whatsapp"),
        email: texto(formData, "email"),
        hours: texto(formData, "hours"),
        codigosPostales: texto(formData, "codigosPostales"),
        cubreTodoElPais,
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("subdominio"))
      return { error: "Ese subdominio ya lo usa la otra sucursal." };
    return { error: `No se pudo guardar: ${msg}` };
  }

  revalidatePath("/admin/sucursales");
  revalidatePath("/");
  revalidatePath("/tienda");
  return { ok: true };
}
