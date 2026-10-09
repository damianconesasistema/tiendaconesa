// Achica la foto en el navegador ANTES de mandarla al server.
//
// Las fotos de celular pesan 5-10 MB y el request de un Server Action tiene
// tope (ver bodySizeLimit en next.config.ts). Pasarse no da un error lindo:
// el server tira 500 y la pagina muestra "A server error occurred".
//
// No perdemos calidad en lo que se guarda: processProductImage ya reduce a
// 1400px, aplana sobre blanco y recomprime a JPEG 86. Hacemos lo mismo acá,
// un poco mas grande, asi lo que viaja es ~20 veces mas chico.

const LADO_MAX = 1600; // el server igual baja a 1400
const CALIDAD = 0.9;
const NO_VALE_LA_PENA = 900 * 1024; // menos de ~900 KB: se manda tal cual

export async function prepararFotoParaSubir(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= NO_VALE_LA_PENA) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * escala));
    const h = Math.max(1, Math.round(bitmap.height * escala));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Blanco primero: si la foto viene sin fondo (PNG con transparencia),
    // al pasarla a JPEG lo transparente quedaria negro. El server hace lo
    // mismo con flatten({ background: "#ffffff" }).
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", CALIDAD),
    );
    if (!blob || blob.size >= file.size) return file;

    const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg" });
  } catch {
    // Si el navegador no puede decodificarla, que decida el server.
    return file;
  }
}
