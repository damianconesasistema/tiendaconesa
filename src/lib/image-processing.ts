import sharp from "sharp";

// Normaliza una foto de producto para que se vea nítida y pese poco:
// - auto-orienta según EXIF (fotos de celular)
// - redimensiona a máx 1400px (sin agrandar las chicas)
// - aplana sobre fondo blanco (los productos van sobre blanco) y
//   recomprime a JPEG de buena calidad.
export async function processProductImage(
  input: Buffer,
): Promise<{ data: Buffer; contentType: string }> {
  try {
    const out = await sharp(input)
      .rotate()
      .resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    return { data: out, contentType: "image/jpeg" };
  } catch {
    // Si sharp falla por cualquier motivo, guardamos el original.
    return { data: input, contentType: "image/jpeg" };
  }
}
