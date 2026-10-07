// Quitar fondo con IA, 100% en el navegador del admin.
//
// Por que en el navegador y no en el server:
//   - No agrega NINGUNA dependencia al deploy (transformers.js se baja de un
//     CDN recien cuando se usa), asi que no puede romper el build de Railway
//     ni comerse su memoria.
//   - Es gratis y sin limite de fotos.
//   - La foto no sale de la maquina.
//
// Modelo: BiRefNet_lite (licencia MIT, de proposito general, sirve para
// objetos y no solo para personas). Son ~109 MB que el navegador baja UNA
// vez y despues quedan cacheados.

const CDN =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js";
const MODELO = "onnx-community/BiRefNet_lite-ONNX";

export type ProgresoFondo = {
  etapa: "descargando-modelo" | "procesando" | "listo";
  // 0..100 mientras baja el modelo; undefined cuando no aplica
  porcentaje?: number;
  detalle?: string;
};

// Cache en memoria: el modelo se arma una sola vez por pestaña.
let cargando: Promise<{
  model: unknown;
  processor: unknown;
  RawImage: unknown;
}> | null = null;

/** ¿El navegador puede correr esto? */
export function soportaQuitarFondo(): boolean {
  if (typeof window === "undefined") return false;
  // Necesitamos WebAssembly si o si; WebGPU es opcional (solo acelera).
  return typeof WebAssembly === "object";
}

async function cargarModelo(onProgress?: (p: ProgresoFondo) => void) {
  if (cargando) return cargando;

  cargando = (async () => {
    // webpackIgnore: que Next NO intente empaquetar esto. Se resuelve en el
    // navegador como un modulo ESM del CDN.
    const lib = await import(/* webpackIgnore: true */ CDN);
    const { AutoModel, AutoProcessor, RawImage, env } = lib as Record<
      string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >;

    // Que no busque modelos locales: los baja del hub.
    env.allowLocalModels = false;

    const reportar = (data: { status?: string; progress?: number; file?: string }) => {
      if (data?.status === "progress" && typeof data.progress === "number") {
        onProgress?.({
          etapa: "descargando-modelo",
          porcentaje: Math.round(data.progress),
          detalle: data.file,
        });
      }
    };

    // fp16 para que pese la mitad (109 MB en vez de 213 MB).
    const model = await AutoModel.from_pretrained(MODELO, {
      dtype: "fp16",
      progress_callback: reportar,
    });
    const processor = await AutoProcessor.from_pretrained(MODELO, {
      progress_callback: reportar,
    });

    return { model, processor, RawImage };
  })();

  try {
    return await cargando;
  } catch (e) {
    cargando = null; // permitir reintentar si fallo la descarga
    throw e;
  }
}

/**
 * Toma un File de imagen y devuelve un JPEG nuevo con el fondo reemplazado
 * por blanco. Si algo falla, lanza error y el llamador sube la original.
 */
export async function quitarFondo(
  file: File,
  onProgress?: (p: ProgresoFondo) => void,
): Promise<File> {
  const { model, processor, RawImage } = await cargarModelo(onProgress);

  onProgress?.({ etapa: "procesando" });

  const url = URL.createObjectURL(file);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RI = RawImage as any;
    const imagen = await RI.fromURL(url);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { pixel_values } = await (processor as any)(imagen);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const salida = await (model as any)({ input_image: pixel_values });

    // El nombre del tensor de salida cambia segun el export del modelo,
    // asi que agarramos el primero que venga.
    const tensor = Object.values(salida)[0] as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sigmoid: () => any;
    };
    const mascara = await RI.fromTensor(
      tensor.sigmoid().mul(255).to("uint8")[0],
    ).resize(imagen.width, imagen.height);

    // Componer: original sobre fondo blanco, usando la mascara como alfa.
    const canvas = document.createElement("canvas");
    canvas.width = imagen.width;
    canvas.height = imagen.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el canvas");

    // Fondo blanco primero
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar la foto y recortarla con la mascara
    const bitmap = await createImageBitmap(file);
    const recorte = document.createElement("canvas");
    recorte.width = imagen.width;
    recorte.height = imagen.height;
    const rctx = recorte.getContext("2d");
    if (!rctx) throw new Error("No se pudo crear el canvas");
    rctx.drawImage(bitmap, 0, 0, recorte.width, recorte.height);

    const datos = rctx.getImageData(0, 0, recorte.width, recorte.height);
    const alfa = mascara.data as Uint8Array;
    for (let i = 0; i < alfa.length; i++) {
      datos.data[i * 4 + 3] = alfa[i];
    }
    rctx.putImageData(datos, 0, 0);

    ctx.drawImage(recorte, 0, 0);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.92),
    );
    if (!blob) throw new Error("No se pudo generar la imagen");

    onProgress?.({ etapa: "listo" });

    const nombre = file.name.replace(/\.[^.]+$/, "") + "-sin-fondo.jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
