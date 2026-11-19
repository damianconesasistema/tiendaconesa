import { TIENDA_URL } from "@/lib/dominio";
import { rutaProducto } from "@/lib/rutas-producto";
import type { Metadata } from "next";
import { contactoDeLaVenta } from "@/lib/sucursal";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { articuloEnVenta, articulosEnVenta } from "@/lib/catalogo";
import { nombreMarca } from "@/lib/marcas";
import { getMarcas } from "@/lib/marcas-server";
import { ProductDetail } from "@/components/ProductDetail";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";
import { entregaDelLocal } from "@/lib/entrega";
import { precioVitrina } from "@/lib/precios";
import { formatPrice } from "@/lib/order";
import { codigoDeAhora, codigoDeLaUrl } from "@/lib/codigo-viejo";
import { getRubrosExtra } from "@/lib/rubros-server";
import { nombreRubro } from "@/lib/rubros";
import { jsonLd, ldMigas, ldProducto, migasDeProducto, resumen } from "@/lib/seo";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ itemId: string }>;
};

// Open Graph: es lo que lee WhatsApp, Instagram y Facebook al pegar el link.
// Sin esto mostraban el titulo y la foto genericos del sitio, y el que lo
// recibia no sabia de que producto se trataba.
export async function generateMetadata(
  { params }: RouteProps,
): Promise<Metadata> {
  const { itemId } = await params;
  // El precio que se comparte por WhatsApp tiene que ser el de ESTE local:
  // es el que va a pagar el que toque el link.
  const p = await articuloEnVenta(codigoDeLaUrl(itemId));
  if (!p) return { title: "Producto no encontrado · Sanitarios Conesa" };

  // La direccion oficial (src/lib/dominio.ts): la del link que se comparte.
  const base = TIENDA_URL;
  const recargos = await getRecargosMp();
  const contado = p.salePrice ?? p.price;
  const vitrina = precioVitrina(contado, recargos.unPago);

  // La URL TIENE que ser absoluta: WhatsApp no resuelve rutas relativas.
  // Si el producto no tiene foto propia, va la generica de la categoria.
  const img = p.imageUrl
    ? `${base}${p.imageUrl}`
    : `${base}/categories/${p.category}.jpg`;

  const titulo = `${p.title} · Sanitarios Conesa`;
  const desc = `${formatPrice(vitrina)} · ${formatPrice(contado)} por transferencia. Retiralo en el local o te lo enviamos a tu domicilio.`;
  // Para Google: la marca adelante y un pedacito de la descripcion al final.
  // WhatsApp sigue mostrando el precio primero (openGraph, abajo).
  const marca = nombreMarca(p.brand, await getMarcas());
  const extra = resumen(p.description, 110);
  const descGoogle = `${marca ? `${marca} · ` : ""}${desc}${extra ? ` ${extra}` : ""}`;

  return {
    title: p.title,
    description: descGoogle,
    // La direccion oficial es la del codigo de ahora: un link viejo (MARCA-
    // numero) redirige, y Google tiene que quedarse con la nueva. Ver
    // src/lib/seo.ts: antes heredaba la de la portada.
    alternates: { canonical: rutaProducto(p.itemId) },
    openGraph: {
      title: titulo,
      description: desc,
      url: `${base}${rutaProducto(p.itemId)}`,
      siteName: "Sanitarios Conesa",
      type: "website",
      locale: "es_AR",
      images: [{ url: img, width: 1200, height: 1200, alt: p.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: desc,
      images: [img],
    },
  };
}

export default async function ProductoPage({ params }: RouteProps) {
  const { itemId } = await params;
  const product = await articuloEnVenta(codigoDeLaUrl(itemId));
  if (!product || !product.active || product.itemId === "__RESET_PRICES_MARKER__") {
    // Los codigos eran MARCA-numero y ahora son el numero solo. Los links
    // viejos siguen circulando por WhatsApp y estan en Google: antes de
    // contestar que no existe, se prueba con el numero.
    const nuevo = product ? null : codigoDeAhora(itemId);
    if (nuevo) {
      const otro = await articuloEnVenta([nuevo]);
      if (otro?.active) redirect(rutaProducto(nuevo));
    }
    notFound();
  }

  const galleryImages = await prisma.productImage.findMany({
    where: { productId: product.id },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  const imageIds = galleryImages.map((g) => g.id);

  const EXCLUIR = [product.itemId, "__RESET_PRICES_MARKER__"];
  const CUANTOS = 4;

  // 1) Misma categoria, con stock primero (son los que realmente puede comprar)
  const mismaCategoria = await articulosEnVenta({
    articulo: { category: product.category, itemId: { notIn: EXCLUIR } },
    orden: ["stock", "oferta"],
    cuantos: CUANTOS,
  });

  // 2) Si no alcanza, completamos con otros productos publicados, asi la
  //    seccion "Tambien te puede interesar" nunca queda vacia si hay catalogo.
  let related = mismaCategoria;
  if (related.length < CUANTOS) {
    const relleno = await articulosEnVenta({
      articulo: { itemId: { notIn: [...EXCLUIR, ...related.map((r) => r.itemId)] } },
      orden: ["destacado", "stock"],
      cuantos: CUANTOS - related.length,
    });
    related = [...related, ...relleno];
  }

  // MAS VENDIDOS: se calcula con las unidades realmente vendidas (OrderItem).
  const masVendidosRaw = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 12,
  });
  let masVendidos: typeof related = [];
  if (masVendidosRaw.length) {
    const encontrados = await articulosEnVenta({
      articulo: {
        id: { in: masVendidosRaw.map((m) => m.productId) },
        itemId: { notIn: EXCLUIR },
      },
    });
    // Respetar el orden de ventas que devolvio el groupBy
    const orden = new Map(masVendidosRaw.map((m, i) => [m.productId, i]));
    masVendidos = encontrados
      .sort((a, b) => (orden.get(a.id) ?? 0) - (orden.get(b.id) ?? 0))
      .slice(0, CUANTOS);
  }

  // Shape compat con ProductDetail (que esperaba Product del JSON)
  const compat = {
    itemId: product.itemId,
    title: product.title,
    description: product.description,
    price: product.price,
    salePrice: product.salePrice,
    stock: product.stock,
    condition: "Nuevo" as string | null,
    status: product.active ? "Activa" : "Inactiva",
    category: product.category,
    brand: product.brand,
    brandName: nombreMarca(product.brand, await getMarcas()),
    imageUrl: product.imageUrl,
    imageIds,
    shippingType: product.shippingType,
  };
  const toCompat = (p: (typeof related)[number]) => ({
    itemId: p.itemId,
    title: p.title,
    price: p.price,
    salePrice: p.salePrice,
    stock: p.stock,
    condition: "Nuevo" as string | null,
    status: p.active ? "Activa" : "Inactiva",
    category: p.category,
    imageUrl: p.imageUrl,
  });

  const [recargos, planes, entrega] = await Promise.all([
    getRecargosMp(),
    getPlanesCuotas(),
    entregaDelLocal(),
  ]);

  const contacto = await contactoDeLaVenta();

  // La ficha para Google (src/lib/seo.ts): el producto con su precio y stock,
  // y el camino Inicio > Tienda > Rubro > Producto.
  const rubrosExtra = await getRubrosExtra();
  const contado = product.salePrice ?? product.price;
  const fotos = imageIds.length
    ? imageIds.map((id) => `${TIENDA_URL}/api/productos/img/${id}`)
    : [
        product.imageUrl
          ? product.imageUrl.startsWith("http")
            ? product.imageUrl
            : `${TIENDA_URL}${product.imageUrl}`
          : `${TIENDA_URL}/categories/${product.category}.jpg`,
      ];
  const ldFicha = ldProducto({
    itemId: product.itemId,
    title: product.title,
    description: product.description,
    marca: compat.brandName || null,
    codigoFabricante: product.codigoFabricante,
    rubro: nombreRubro(product.category, rubrosExtra),
    fotos,
    precio: contado > 0 ? precioVitrina(contado, recargos.unPago) : null,
    stock: product.stock,
  });
  const ldCamino = ldMigas(migasDeProducto(product, rubrosExtra));

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ldFicha) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ldCamino) }} />
    <ProductDetail
      whatsappSucursal={contacto.whatsapp}
      product={compat}
      related={related.map(toCompat)}
      bestSellers={masVendidos.map(toCompat)}
      comisionUnPago={recargos.unPago}
      planes={planes}
      entrega={entrega}
    />
    </>
  );
}
