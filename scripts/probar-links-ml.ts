// Prueba de numerosDeLinkML: que saque el numero correcto de cada tipo de link
// de MercadoLibre. Correr: npx tsx scripts/probar-links-ml.ts
import { esLinkDeMercadoLibre, numerosDeLinkML } from "../src/lib/mercadolibre";

const casos: [string, ReturnType<typeof numerosDeLinkML>][] = [
  ["https://www.mercadolibre.com.ar/bacha-de-cocina-mi-pileta-443-bajo-mesada/p/MLA21097034", { producto: "MLA21097034" }],
  [
    "https://www.mercadolibre.com.ar/bacha-de-cocina-mi-pileta-443-bajo-mesada/p/MLA21097034?pdp_filters=item_id%3AMLA1503829713#wid=MLA1503829713",
    { producto: "MLA21097034", item: "MLA1503829713" },
  ],
  ["https://articulo.mercadolibre.com.ar/MLA-1426353035-bacha-acero-mi-pileta-443-_JM", { item: "MLA1426353035" }],
  [
    "https://www.mercadolibre.com.ar/bacha-mi-pileta-443/up/MLAU2512345678#polycard_client=search-nordic&wid=MLA1503829713&sid=search",
    { item: "MLA1503829713", up: "MLAU2512345678" },
  ],
  ["https://www.mercadolibre.com.ar/bacha-mi-pileta-443/up/MLAU2512345678", { up: "MLAU2512345678" }],
  [
    "https://www.mercadolibre.com.ar/gz/account-verification?go=https%3A%2F%2Fwww.mercadolibre.com.ar%2Fbacha%2Fp%2FMLA21097034&tid=x",
    { producto: "MLA21097034" },
  ],
  ["https://listado.mercadolibre.com.ar/mi-pileta-445", null],
  ["https://www.piazzagriferia.com/producto/MLA-1234567", null],
  ["https://meli.la/2AbCdEf", null],
];

let mal = 0;
for (const [link, esperado] of casos) {
  const sale = numerosDeLinkML(link);
  const ok = JSON.stringify(sale) === JSON.stringify(esperado);
  if (!ok) mal++;
  console.log(ok ? "OK " : "MAL", link.slice(0, 90), "->", JSON.stringify(sale));
}
const esML: [string, boolean][] = [
  ["https://meli.la/2AbCdEf", true],
  ["https://mercadolibre.com/sec/1AbCdE", true],
  ["https://articulo.mercadolibre.com.ar/MLA-1", true],
  ["https://www.mipileta.com.ar/products/x", false],
  ["https://mercadolibre.com.ar.malo.com/p/MLA1", false],
];
for (const [link, esperado] of esML) {
  const ok = esLinkDeMercadoLibre(link) === esperado;
  if (!ok) mal++;
  console.log(ok ? "OK " : "MAL", "esML", link, "->", esLinkDeMercadoLibre(link));
}
console.log(mal ? `${mal} MAL` : "todo OK");
process.exit(mal ? 1 : 0);
