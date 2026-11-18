// Sacar un fondo LISO sin IA: las fotos de catalogo con fondo de un color
// parejo (Daccord: los asientos blancos sobre azul marino). Damian,
// 18/11/2026: "estas fotos le quise eliminar el fondo y no me dejo".
//
// Para esas fotos la IA es un cañon para matar una mosca: pesa 110 MB, en
// algunas compus no entra en la memoria del navegador, y tarda. Aca alcanza
// con mirar el color del borde y sacar ese color, al toque y sin bajar nada.
// Si el borde no es parejo (una foto en un baño, sobre una mesada), no es un
// fondo liso y esto devuelve null: ahi trabaja la IA.
//
// Funcion pura sobre los pixeles (RGBA): la usa el navegador con un canvas y
// se puede probar fuera de el.

export type ResultadoFondoLiso =
  /** Se saco el fondo: los pixeles nuevos, sobre blanco. */
  | { tipo: "sacado"; rgba: Uint8ClampedArray; fondo: [number, number, number] }
  /** El fondo ya es blanco: no hay nada que sacar. */
  | { tipo: "ya-blanco" };

/** Que tan distintos son dos colores (0 = iguales, ~441 = negro y blanco). */
function distancia(d: Uint8ClampedArray, i: number, c: [number, number, number]): number {
  const r = d[i] - c[0];
  const g = d[i + 1] - c[1];
  const b = d[i + 2] - c[2];
  return Math.sqrt(r * r + g * g + b * b);
}

const mediana = (l: number[]) => {
  const s = [...l].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** El color del fondo, si el borde de la foto es parejo. */
function colorDelBorde(d: Uint8ClampedArray, w: number, h: number): [number, number, number] | null {
  const puntos: number[] = [];
  const paso = Math.max(1, Math.floor((w + h) / 600));
  for (let x = 0; x < w; x += paso) puntos.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += paso) puntos.push(y * w, y * w + w - 1);
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  for (const p of puntos) {
    rs.push(d[p * 4]);
    gs.push(d[p * 4 + 1]);
    bs.push(d[p * 4 + 2]);
  }
  const fondo: [number, number, number] = [mediana(rs), mediana(gs), mediana(bs)];
  // Parejo: casi todo el borde es de ese color. Lo que asoma del producto
  // por algun costado no lo arruina.
  const parecidos = puntos.filter((p) => distancia(d, p * 4, fondo) < 40).length;
  return parecidos / puntos.length >= 0.85 ? fondo : null;
}

export function sacarFondoLiso(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
): ResultadoFondoLiso | null {
  const fondo = colorDelBorde(rgba, w, h);
  if (!fondo) return null;
  if (Math.min(...fondo) >= 235) return { tipo: "ya-blanco" };
  // Solo fondos oscuros o de color, bien distintos del blanco (el azul de
  // Daccord). Sobre un gris claro, las partes blancas del producto (tarugos,
  // la caja) se parecen demasiado al fondo y se borrarian: eso lo hace la IA.
  const lejosDelBlanco = Math.sqrt(
    (255 - fondo[0]) ** 2 + (255 - fondo[1]) ** 2 + (255 - fondo[2]) ** 2,
  );
  if (lejosDelBlanco < 150) return null;

  const n = w * h;
  // 1. Los pixeles del color del fondo (con margen para las sombras suaves y
  //    la compresion del JPEG).
  const delColor = new Uint8Array(n);
  for (let p = 0; p < n; p++) if (distancia(rgba, p * 4, fondo) < 70) delColor[p] = 1;

  // 2. Las manchas de ese color. Es fondo la que toca el borde, y tambien la
  //    grande encerrada (el agujero del asiento, que se ve azul). Una manchita
  //    chica adentro del producto queda: puede ser un detalle de ese color.
  const esFondo = new Uint8Array(n);
  const visto = new Uint8Array(n);
  const minimo = Math.max(50, Math.floor(n * 0.002));
  const pila: number[] = [];
  const mancha: number[] = [];
  for (let inicio = 0; inicio < n; inicio++) {
    if (!delColor[inicio] || visto[inicio]) continue;
    mancha.length = 0;
    let tocaBorde = false;
    pila.push(inicio);
    visto[inicio] = 1;
    while (pila.length) {
      const p = pila.pop() as number;
      mancha.push(p);
      const x = p % w;
      const y = (p - x) / w;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) tocaBorde = true;
      if (x > 0 && delColor[p - 1] && !visto[p - 1]) { visto[p - 1] = 1; pila.push(p - 1); }
      if (x < w - 1 && delColor[p + 1] && !visto[p + 1]) { visto[p + 1] = 1; pila.push(p + 1); }
      if (y > 0 && delColor[p - w] && !visto[p - w]) { visto[p - w] = 1; pila.push(p - w); }
      if (y < h - 1 && delColor[p + w] && !visto[p + w]) { visto[p + w] = 1; pila.push(p + w); }
    }
    if (tocaBorde || mancha.length >= minimo) for (const p of mancha) esFondo[p] = 1;
  }

  // 2b. Las motitas sueltas en el fondo (polvo, ruido del JPEG): un punto que
  //     no es fondo pero esta solo en el medio del fondo, y es muy chico, es
  //     fondo. Un detalle real del producto es bastante mas grande.
  const motita = Math.max(20, Math.floor(n * 0.0001));
  const vistoP = new Uint8Array(n);
  for (let inicio = 0; inicio < n; inicio++) {
    if (esFondo[inicio] || vistoP[inicio]) continue;
    mancha.length = 0;
    pila.push(inicio);
    vistoP[inicio] = 1;
    while (pila.length && mancha.length <= motita) {
      const p = pila.pop() as number;
      mancha.push(p);
      const x = p % w;
      const y = (p - x) / w;
      if (x > 0 && !esFondo[p - 1] && !vistoP[p - 1]) { vistoP[p - 1] = 1; pila.push(p - 1); }
      if (x < w - 1 && !esFondo[p + 1] && !vistoP[p + 1]) { vistoP[p + 1] = 1; pila.push(p + 1); }
      if (y > 0 && !esFondo[p - w] && !vistoP[p - w]) { vistoP[p - w] = 1; pila.push(p - w); }
      if (y < h - 1 && !esFondo[p + w] && !vistoP[p + w]) { vistoP[p + w] = 1; pila.push(p + w); }
    }
    if (pila.length === 0 && mancha.length <= motita) for (const p of mancha) esFondo[p] = 1;
    else {
      // Grande: es producto. Se termina de recorrer para no volver a mirarla.
      while (pila.length) {
        const p = pila.pop() as number;
        const x = p % w;
        const y = (p - x) / w;
        if (x > 0 && !esFondo[p - 1] && !vistoP[p - 1]) { vistoP[p - 1] = 1; pila.push(p - 1); }
        if (x < w - 1 && !esFondo[p + 1] && !vistoP[p + 1]) { vistoP[p + 1] = 1; pila.push(p + 1); }
        if (y > 0 && !esFondo[p - w] && !vistoP[p - w]) { vistoP[p - w] = 1; pila.push(p - w); }
        if (y < h - 1 && !esFondo[p + w] && !vistoP[p + w]) { vistoP[p + w] = 1; pila.push(p + w); }
      }
    }
  }

  // 3. Sobre blanco. En el borde del producto el pixel mezcla producto y
  //    fondo: se le saca la parte de fondo y se le pone blanco, asi no queda
  //    un contorno azul.
  const salida = new Uint8ClampedArray(rgba.length);
  const blancoMenosFondo = [255 - fondo[0], 255 - fondo[1], 255 - fondo[2]];
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    salida[i + 3] = 255;
    if (esFondo[p]) {
      salida[i] = salida[i + 1] = salida[i + 2] = 255;
      continue;
    }
    const x = p % w;
    const y = (p - x) / w;
    let pegado = false;
    for (let dy = -1; dy <= 1 && !pegado; dy++)
      for (let dx = -1; dx <= 1 && !pegado; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && esFondo[yy * w + xx]) pegado = true;
      }
    // Que tanto es producto: lejos del color del fondo, todo; parecido, poco.
    const a = pegado ? Math.min(1, distancia(rgba, i, fondo) / 140) : 1;
    for (let c = 0; c < 3; c++) salida[i + c] = rgba[i + c] + (1 - a) * blancoMenosFondo[c];
  }
  return { tipo: "sacado", rgba: salida, fondo };
}
