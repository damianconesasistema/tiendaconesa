// Donde envia Buenos Aires, a cuanto, y cuando es gratis.
//
// Lo que paso Damian el 16/11/2026:
//   - se envia SOLO dentro del mapa de Mercado Envios Flex, "pero por fuera
//     de Mercado Envios": reparten ellos, la zona es la misma;
//   - el mapa por codigo postal: CABA del 1000 al 1440, y tres listas para el
//     conurbano (Zona 1, 2 y 3);
//   - el envio se cobra JUNTO con la compra, segun la zona;
//   - desde $100.000 es gratis, a todas las zonas;
//   - pedir siempre todos los datos del envio.
//
// El 1642 vino en la Zona 1 y en la Zona 3: quedo en la 1, la mas barata.
//
// Los precios y el tope se cambian desde Configuracion del panel (tabla
// Setting); estos son los de arranque. Las listas de codigos van aca porque
// cambian poco y una lista larga no se edita bien en un formulario.
//
// Este archivo no toca la base: lo usan el carrito, el checkout, el servidor
// del pedido y la etiqueta.

export type Zona = "CABA" | "Zona 1" | "Zona 2" | "Zona 3";

export const ZONAS: readonly Zona[] = ["CABA", "Zona 1", "Zona 2", "Zona 3"];

export type PreciosEnvio = Record<Zona, number>;

export const PRECIOS_DE_ARRANQUE: PreciosEnvio = {
  CABA: 5500,
  "Zona 1": 7300,
  "Zona 2": 9100,
  "Zona 3": 10500,
};

const CABA_DESDE = 1000;
const CABA_HASTA = 1440;

const LISTAS: Readonly<Record<Exclude<Zona, "CABA">, readonly number[]>> = {
  "Zona 1": [
    1602, 1603, 1604, 1605, 1606, 1607, 1609, 1636, 1637, 1638, 1640, 1641,
    1642, 1643, 1650, 1651, 1653, 1655, 1657, 1672, 1674, 1675, 1676, 1678,
    1682, 1683, 1687, 1690, 1691, 1692, 1702, 1703, 1820, 1822, 1823, 1824,
    1825, 1826, 1828, 1832, 1868, 1869, 1870, 1871, 1872, 1873, 1874, 1875,
  ],
  "Zona 2": [
    1616, 1644, 1646, 1659, 1660, 1661, 1662, 1663, 1664, 1665, 1684, 1685,
    1686, 1688, 1689, 1704, 1706, 1707, 1708, 1712, 1713, 1714, 1715, 1716,
    1718, 1722, 1723, 1738, 1742, 1743, 1744, 1745, 1746, 1752, 1753, 1754,
    1755, 1757, 1758, 1759, 1761, 1763, 1764, 1765, 1766, 1768, 1770, 1772,
    1773, 1778, 1785, 1786, 1801, 1803, 1804, 1805, 1806, 1807, 1812, 1821,
    1833, 1834, 1836, 1837, 1838, 1839, 1840, 1841, 1842, 1843, 1844, 1845,
    1846, 1847, 1848, 1849, 1850, 1851, 1852, 1853, 1854, 1856, 1858, 1859,
    1860, 1861, 1862, 1863, 1864, 1867, 1876, 1877, 1878, 1879, 1880, 1881,
    1882, 1884, 1885, 1886, 1887, 1888, 1889, 1890, 1891,
  ],
  // Sin el 1642: esta en la Zona 1.
  "Zona 3": [
    1608, 1611, 1612, 1613, 1614, 1615, 1617, 1618, 1619, 1620, 1621, 1622,
    1623, 1624, 1625, 1626, 1627, 1628, 1629, 1631, 1632, 1633, 1634, 1635,
    1648, 1667, 1669, 1670, 1679, 1727, 1748, 1814, 1865, 1893, 1894, 1895,
    1896, 1897, 1900, 1901, 1902, 1903, 1904, 1905, 1906, 1908, 1909, 1910,
    1912, 1914, 1916, 1923, 1925, 1926, 1931, 1980, 2800, 2801, 2802, 2804,
    2806,
  ],
};

/** Como se le dice al cliente donde se envia. */
export const DONDE_ENVIAMOS = "Capital y Gran Buenos Aires";

/** Como elige el cliente a donde va su envio, segun el local que vende.
 *
 *  Traslasierra tiene su lista de pueblos del Valle (src/lib/traslasierra.ts)
 *  y deja escribir "otra localidad, a coordinar". Todo lo demas es Buenos
 *  Aires: el mapa por codigo postal y nada afuera. Damian, 16/11/2026: la
 *  tienda de Traslasierra no va a seguir, asi que lo nuevo es para Buenos
 *  Aires. */
export function modoDeEnvio(slug: string | null | undefined): "mapa" | "valle" {
  return slug === "traslasierra" ? "valle" : "mapa";
}

/** Los cuatro numeros del codigo postal, o null. Acepta "1704", "B1704" y
 *  "C1414ABC" (el CPA), que es como lo escriben muchos. */
export function cpNumerico(cp: string | null | undefined): number | null {
  const m = String(cp ?? "").toUpperCase().match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

/** La zona de un codigo postal, o null si esta fuera del mapa. */
export function zonaDelCP(cp: string | null | undefined): Zona | null {
  const n = cpNumerico(cp);
  if (n === null) return null;
  if (n >= CABA_DESDE && n <= CABA_HASTA) return "CABA";
  for (const z of ["Zona 1", "Zona 2", "Zona 3"] as const)
    if (LISTAS[z].includes(n)) return z;
  return null;
}

/** La provincia que va en la etiqueta y en el pedido. */
export function provinciaDeLaZona(zona: Zona): string {
  return zona === "CABA" ? "Ciudad Autónoma de Buenos Aires" : "Buenos Aires";
}

/** Los precios guardados en la configuracion, completando con los de
 *  arranque lo que falte o venga roto. */
export function preciosValidos(raw: string | null | undefined): PreciosEnvio {
  const salida: PreciosEnvio = { ...PRECIOS_DE_ARRANQUE };
  if (!raw) return salida;
  try {
    const d = JSON.parse(raw) as Partial<Record<Zona, unknown>>;
    for (const z of ZONAS) {
      const n = Number(d?.[z]);
      if (Number.isFinite(n) && n >= 0) salida[z] = Math.round(n);
    }
  } catch {
    // Configuracion rota: valen los de arranque.
  }
  return salida;
}

/** El tope de envio gratis. null = no hay. */
export function topeValido(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/** Cuanto le falta para el envio gratis. 0 si ya llego o si no hay tope. */
export function faltaParaEnvioGratis(totalLista: number, tope: number | null): number {
  if (!tope) return 0;
  return Math.max(0, tope - totalLista);
}

/** El envio de una compra a este codigo postal. null = fuera del mapa.
 *
 *  `totalLista` es el total a precio de lista: lo que el cliente ve en el
 *  carrito. Si despues paga por transferencia y le queda por debajo del
 *  tope, el envio sigue siendo gratis: asi se le mostro y no se le puede
 *  sacar en la ultima pantalla. */
export function envioDe(a: {
  cp: string | null | undefined;
  totalLista: number;
  tope: number | null;
  precios: PreciosEnvio;
}): { zona: Zona; costo: number; gratis: boolean; precioZona: number } | null {
  const zona = zonaDelCP(a.cp);
  if (!zona) return null;
  const precioZona = a.precios[zona];
  const gratis = !!a.tope && a.totalLista >= a.tope;
  return { zona, costo: gratis ? 0 : precioZona, gratis, precioZona };
}
