import { redirect } from "next/navigation";

// La pantalla de "sync stock" era aparte y escribia el stock del articulo sin
// mirar de que local era el panel, asi que en Buenos Aires tenia que avisar
// "todavia no". El importador hace las dos cosas, elegis cual, y guarda en el
// local del panel. Queda esta redireccion porque el link anda dando vueltas
// en marcadores.
export default function SyncStockPage() {
  redirect("/admin/productos/importar");
}
