// GET /api/admin/productos/plantilla
// Genera una plantilla .xlsx lista para llenar y re-importar.
import * as XLSX from "xlsx";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  // Fila de ejemplo para guiar al usuario
  const rows = [
    {
      codigo: "MAN-EJEMPLO-01",
      sku: "GRI-001",
      titulo: "Grifería monocomando cocina (EJEMPLO - borrar esta fila)",
      categoria: "griferia",
      marca: "fv",
      precio: 85000,
      oferta: 72000,
      stock: 10,
      activo: "SI",
      destacado: "NO",
      descripcion: "Monocomando con pico alto, cromado.",
      memo: "Proveedor FV - remito 1234",
      imagen_url: "https://ejemplo.com/foto.jpg",
    },
  ];

  const headers = [
    "codigo",
    "sku",
    "titulo",
    "categoria",
    "marca",
    "precio",
    "oferta",
    "stock",
    "activo",
    "destacado",
    "descripcion",
    "memo",
    "imagen_url",
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  ws["!cols"] = [
    { wch: 18 }, // codigo
    { wch: 14 }, // sku
    { wch: 44 }, // titulo
    { wch: 14 }, // categoria
    { wch: 12 }, // marca
    { wch: 12 }, // precio
    { wch: 12 }, // oferta
    { wch: 8 }, // stock
    { wch: 8 }, // activo
    { wch: 10 }, // destacado
    { wch: 40 }, // descripcion
    { wch: 30 }, // memo
    { wch: 40 }, // imagen_url
  ];

  // Segunda hoja con instrucciones / categorías válidas
  const guia = [
    { campo: "codigo", detalle: "OBLIGATORIO. Código único del producto, no puede quedar vacío. Si el código ya existe en la tienda, se ACTUALIZA ese producto; si no existe, se CREA uno nuevo. Podés inventarlo (ej: GRI-001)." },
    { campo: "sku", detalle: "Opcional. Código interno tuyo. Sirve para sincronizar stock y matchear fotos por nombre de archivo." },
    { campo: "titulo", detalle: "OBLIGATORIO. Nombre del producto." },
    { campo: "categoria", detalle: "Una de: sanitarios, griferia, banera, accesorios, salamandras, calefones, materiales, piletas, otros." },
    { campo: "marca", detalle: "Opcional. Slug o nombre de la marca (fv, ferrum, piazza, pringles...). Si lo dejás vacío se intenta sacar del título." },
    { campo: "precio", detalle: "OBLIGATORIO. Número sin puntos ni símbolos. Ej: 85000." },
    { campo: "oferta", detalle: "Opcional. Precio con descuento (menor al precio). Vacío = sin oferta." },
    { campo: "stock", detalle: "Cantidad disponible. Ej: 10." },
    { campo: "activo", detalle: "SI o NO. SI = visible en la tienda." },
    { campo: "destacado", detalle: "SI o NO. SI = aparece en la home." },
    { campo: "descripcion", detalle: "Opcional. Texto para la ficha." },
    { campo: "memo", detalle: "Opcional. Nota privada (solo la ve el admin)." },
    { campo: "imagen_url", detalle: "Opcional. Link a la foto (http...). Se descarga sola. Si cargás las fotos por carpeta, dejá esto vacío." },
  ];
  const wsGuia = XLSX.utils.json_to_sheet(guia, { header: ["campo", "detalle"] });
  wsGuia["!cols"] = [{ wch: 16 }, { wch: 90 }];

  XLSX.utils.book_append_sheet(wb, ws, "Productos");
  XLSX.utils.book_append_sheet(wb, wsGuia, "Instrucciones");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const u8 = new Uint8Array(buf);

  return new Response(u8, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-productos-conesa.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
