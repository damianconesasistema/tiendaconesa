import { getAdminSession, inicioDeSesion } from "@/lib/admin-auth";
import CierreInactividad from "./cierre-inactividad";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La propia /admin/login tiene su propio chequeo que no requiere sesion.
  // Para cualquier otra pagina bajo /admin exigimos sesion.
  // V.0.11.259: despues de 2 horas sin usarlo se cierra la sesion (el mismo
  // reloj que Punto: ./cierre-inactividad.tsx).
  const s = await getAdminSession();
  return (
    <>
      {s ? <CierreInactividad desde={inicioDeSesion(s)} /> : null}
      {children}
    </>
  );
}
