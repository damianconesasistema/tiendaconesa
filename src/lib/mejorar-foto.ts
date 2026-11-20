// Mejorar la foto de un producto al subirla. Damian, 18/11/2026: "podes hacer
// que el subir fotos de la ficha del producto mejore la foto cuando la sube?
// hacelo por ia si es posible".
//
// Todo en el navegador, gratis y sin que la foto salga de la compu:
//   1. Luz: lo mas claro pasa a blanco (el fondo gris o amarillento queda
//      blanco) y lo mas oscuro baja apenas; los medios casi no se tocan.
//   2. Color: si el fondo es casi blanco pero tirando a amarillo o azul, se
//      corrige; y un poquito mas de color.
//   3. Si el fondo es blanco y parejo: se recorta lo que sobra y el producto
//      queda centrado en un cuadrado blanco, con el mismo margen en todas.
//      Asi la tienda se ve pareja. Con otro fondo, la foto queda como vino.
//      Si el producto viene cortado en un borde de la foto, queda pegado a
//      ese borde (ver ubicarProducto).
//   4. Si es chica (las que se bajan de la web), una IA la agranda al doble
//      recuperando detalle (Swin2SR liviano, pocos MB que se bajan una vez).
//      Si la IA no anda en esa compu, se agranda comun. Minimo 800 de lado.
//   5. Nitidez suave (mascara de enfoque).
//
// Si algo falla, devuelve la foto como estaba: mejorar nunca impide subir.

import { CDN, dispositivo } from "@/lib/remove-background";

const MODELO_IA = "Xenova/swin2SR-lightweight-x2-64";
/** Hasta este lado la agranda la IA (mas grande tarda mucho y no hace falta). */
const IA_HASTA = 720;
/** Por debajo de esto vale la pena agrandarla. */
const CHICA = 900;

export type ProgresoMejora = { etapa: "descargando-ia" | "agrandando" | "mejorando"; porcentaje?: number };

// ------------------------------------------------------------- la IA

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let agrandador: Promise<{ correr: (img: any) => Promise<any>; RawImage: any }> | null = null;

async function cargarIA(onProgress?: (p: ProgresoMejora) => void) {
  if (agrandador) return agrandador;
  agrandador = (async () => {
    const lib = await import(/* webpackIgnore: true */ CDN);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { pipeline, RawImage, env } = lib as Record<string, any>;
    env.allowLocalModels = false;
    const reportar = (d: { status?: string; progress?: number }) => {
      if (d?.status === "progress" && typeof d.progress === "number")
        onProgress?.({ etapa: "descargando-ia", porcentaje: Math.round(d.progress) });
    };
    const donde = await dispositivo();
    let correr;
    try {
      correr = await pipeline("image-to-image", MODELO_IA, { ...donde, progress_callback: reportar });
    } catch (e) {
      if (donde.device !== "webgpu") throw e;
      correr = await pipeline("image-to-image", MODELO_IA, { device: "wasm", dtype: "fp32", progress_callback: reportar });
    }
    return { correr, RawImage };
  })();
  try {
    return await agrandador;
  } catch (e) {
    agrandador = null;
    throw e;
  }
}

/** La foto al doble con IA, o null si no se pudo (en 60 segundos). */
async function agrandarConIA(lienzo: HTMLCanvasElement, onProgress?: (p: ProgresoMejora) => void): Promise<HTMLCanvasElement | null> {
  try {
    const trabajo = (async () => {
      const { correr, RawImage } = await cargarIA(onProgress);
      onProgress?.({ etapa: "agrandando" });
      const entrada = await RawImage.fromCanvas(lienzo);
      const salida = await correr(entrada);
      const img = Array.isArray(salida) ? salida[0] : salida;
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      // RawImage -> ImageData (RGB o RGBA).
      const datos = ctx.createImageData(img.width, img.height);
      const canales = img.channels;
      for (let i = 0, j = 0; i < img.width * img.height; i++, j += canales) {
        datos.data[i * 4] = img.data[j];
        datos.data[i * 4 + 1] = img.data[j + 1];
        datos.data[i * 4 + 2] = img.data[j + 2];
        datos.data[i * 4 + 3] = canales === 4 ? img.data[j + 3] : 255;
      }
      ctx.putImageData(datos, 0, 0);
      return c;
    })();
    const tope = new Promise<null>((r) => setTimeout(() => r(null), 60_000));
    return await Promise.race([trabajo, tope]);
  } catch {
    return null;
  }
}

// --------------------------------------------------------- sin IA

function lienzoDe(fuente: CanvasImageSource, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(fuente, 0, 0, w, h);
  return c;
}

const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Niveles, balance de blanco y un poco mas de color. */
function luzYColor(d: Uint8ClampedArray) {
  const n = d.length / 4;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) hist[Math.round(lum(d[i], d[i + 1], d[i + 2]))]++;
  let acum = 0;
  let bajo = 0;
  let alto = 255;
  for (let v = 0; v < 256; v++) {
    acum += hist[v];
    if (acum >= n * 0.005) {
      bajo = v;
      break;
    }
  }
  acum = 0;
  for (let v = 255; v >= 0; v--) {
    acum += hist[v];
    if (acum >= n * 0.005) {
      alto = v;
      break;
    }
  }
  // Suave: lo mas claro pasa a blanco y lo mas oscuro baja un poco, sin
  // tocar casi los medios. Un estiramiento completo (lo mas oscuro a negro)
  // dejaba casi negro un producto gris en una foto sin negros.
  const o = bajo > 12 ? Math.min(bajo * 0.6, 20) : 0;
  const k = alto < 248 ? Math.min(1.3, 252 / Math.max(1, alto - o)) : 252 / Math.max(1, 252 - o);

  // Balance de blanco con lo mas claro (el fondo, si es blanco).
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let cuantos = 0;
  const umbral = Math.max(200, alto - 12);
  for (let i = 0; i < d.length; i += 4)
    if (lum(d[i], d[i + 1], d[i + 2]) >= umbral) {
      sr += d[i];
      sg += d[i + 1];
      sb += d[i + 2];
      cuantos++;
    }
  let gr = 1;
  let gg = 1;
  let gb = 1;
  if (cuantos > n * 0.03) {
    const mr = sr / cuantos;
    const mg = sg / cuantos;
    const mb = sb / cuantos;
    const gris = (mr + mg + mb) / 3;
    const tope = (x: number) => Math.min(1.12, Math.max(0.9, x));
    if (Math.max(mr, mg, mb) - Math.min(mr, mg, mb) > 5) {
      gr = tope(gris / mr);
      gg = tope(gris / mg);
      gb = tope(gris / mb);
    }
  }

  const SAT = 1.06;
  for (let i = 0; i < d.length; i += 4) {
    let r = (d[i] * gr - o) * k;
    let g = (d[i + 1] * gg - o) * k;
    let b = (d[i + 2] * gb - o) * k;
    const y = lum(r, g, b);
    r = y + (r - y) * SAT;
    g = y + (g - y) * SAT;
    b = y + (b - y) * SAT;
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }
}

/** Mascara de enfoque suave: original + 0,6 x (original - borroneada). */
function nitidez(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!;
  const borrosa = document.createElement("canvas");
  borrosa.width = c.width;
  borrosa.height = c.height;
  const bctx = borrosa.getContext("2d")!;
  bctx.filter = "blur(1px)";
  bctx.drawImage(c, 0, 0);
  const a = ctx.getImageData(0, 0, c.width, c.height);
  const b = bctx.getImageData(0, 0, c.width, c.height).data;
  const d = a.data;
  for (let i = 0; i < d.length; i += 4)
    for (let j = 0; j < 3; j++) d[i + j] = d[i + j] + 0.6 * (d[i + j] - b[i + j]);
  ctx.putImageData(a, 0, 0);
}

/** Donde va el producto (x0..x1, y0..y1 de una foto de w x h) en el cuadrado
 *  blanco: ocupa el 86% del lado, centrado.
 *
 *  Pero si toca un borde de la foto (y el de enfrente no), en la foto original
 *  el producto sigue mas alla: viene cortado. Centrado, el corte quedaba en el
 *  aire, con blanco abajo. Damian, 20/11/2026, con un Sikadur cortado abajo en
 *  la foto de donde la saco: "porque se corta al final la foto?". Ahora queda
 *  pegado a ese borde: el corte coincide con el borde de la foto, como en la
 *  original. Si toca los dos bordes de enfrente (un recorte justo, como un PNG
 *  sin fondo), se centra como siempre. */
export function ubicarProducto(
  w: number,
  h: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { lado: number; dx: number; dy: number } {
  const pw = x1 - x0 + 1;
  const ph = y1 - y0 + 1;
  const lado = Math.round(Math.max(pw, ph) / 0.86);
  // Tocar el borde: a 1 o 2 pixeles (el JPEG ensucia el borde).
  const tol = Math.max(1, Math.round(Math.min(w, h) * 0.003));
  const pegado = (desde: number, hasta: number, total: number, libre: number) => {
    const alPrincipio = desde <= tol;
    const alFinal = hasta >= total - 1 - tol;
    if (alPrincipio && !alFinal) return 0;
    if (alFinal && !alPrincipio) return libre;
    return Math.round(libre / 2);
  };
  return { lado, dx: pegado(x0, x1, w, lado - pw), dy: pegado(y0, y1, h, lado - ph) };
}

/** Si el fondo es blanco parejo, el producto en un cuadrado blanco con margen
 *  (ubicarProducto). Si no, null (la foto queda con su forma). */
function encuadrar(c: HTMLCanvasElement): HTMLCanvasElement | null {
  const { width: w, height: h } = c;
  const d = c.getContext("2d")!.getImageData(0, 0, w, h).data;
  const blanco = (i: number) => d[i] > 236 && d[i + 1] > 236 && d[i + 2] > 236;
  // El borde: tiene que ser casi todo blanco.
  let borde = 0;
  let blancos = 0;
  const paso = Math.max(1, Math.floor(Math.min(w, h) / 200));
  for (let x = 0; x < w; x += paso)
    for (const y of [0, h - 1]) {
      borde++;
      if (blanco((y * w + x) * 4)) blancos++;
    }
  for (let y = 0; y < h; y += paso)
    for (const x of [0, w - 1]) {
      borde++;
      if (blanco((y * w + x) * 4)) blancos++;
    }
  if (blancos < borde * 0.92) return null;

  // Donde esta el producto: lo que se aparta del blanco.
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (255 * 3 - d[i] - d[i + 1] - d[i + 2] > 45) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  if (x1 < x0 || y1 < y0) return null;
  const pw = x1 - x0 + 1;
  const ph = y1 - y0 + 1;
  // Algo muy chico (una mancha) no es el producto.
  if (pw * ph < w * h * 0.02) return null;
  // El producto ocupa el 86% del lado del cuadrado; si viene cortado, pegado
  // al borde del corte.
  const { lado, dx, dy } = ubicarProducto(w, h, x0, y0, x1, y1);
  const q = document.createElement("canvas");
  q.width = lado;
  q.height = lado;
  const qctx = q.getContext("2d")!;
  qctx.fillStyle = "#ffffff";
  qctx.fillRect(0, 0, lado, lado);
  qctx.drawImage(c, x0, y0, pw, ph, dx, dy, pw, ph);
  return q;
}

// ------------------------------------------------------------ todo junto

/** Devuelve la foto mejorada (JPEG), o la misma si no se pudo. */
export async function mejorarFoto(file: File, onProgress?: (p: ProgresoMejora) => void): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    let c = lienzoDe(bmp, bmp.width, bmp.height);
    bmp.close?.();

    // Luz y color.
    onProgress?.({ etapa: "mejorando" });
    const ctx = c.getContext("2d")!;
    const img = ctx.getImageData(0, 0, c.width, c.height);
    luzYColor(img.data);
    ctx.putImageData(img, 0, 0);
    // Encuadre, si el fondo es blanco. Antes de agrandar: asi la IA trabaja
    // solo sobre el producto (mas rapido y la foto final sale mas grande).
    c = encuadrar(c) ?? c;

    // Chica: al doble, con IA si se puede.
    const mayor = Math.max(c.width, c.height);
    if (mayor < CHICA) {
      const conIA = mayor <= IA_HASTA ? await agrandarConIA(c, onProgress) : null;
      c = conIA ?? lienzoDe(c, c.width * 2, c.height * 2);
      onProgress?.({ etapa: "mejorando" });
    }
    // Que no quede menos de 800 de lado (se ve chiquita en la ficha).
    const lado = Math.max(c.width, c.height);
    if (lado < 800) c = lienzoDe(c, Math.round((c.width * 800) / lado), Math.round((c.height * 800) / lado));

    // Nitidez, al final (despues de agrandar).
    nitidez(c);

    // No mas grande de lo que guarda el server (1400): el resto lo achica el.
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.92));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
