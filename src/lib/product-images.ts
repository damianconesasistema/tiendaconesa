// Constantes/tipos de imagenes de producto. En un archivo aparte porque
// los modulos "use server" solo pueden exportar funciones async.

export const MAX_PRODUCT_IMAGES = 10;

export type ProductImageInfo = { id: string; position: number };
