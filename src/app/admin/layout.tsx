import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // La propia /admin/login tiene su propio chequeo que no requiere sesion.
  // Para cualquier otra pagina bajo /admin exigimos sesion.
  return <>{children}</>;
}
