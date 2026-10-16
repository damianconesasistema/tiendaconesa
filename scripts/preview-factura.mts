// Genera una factura de ejemplo para mirar el diseño sin tener que emitir
// un comprobante real. Se corre con:  npx tsx scripts/preview-factura.mts

import { generarFacturaPdf } from "../src/lib/afip/pdf";
import fs from "node:fs";

const pdf = await generarFacturaPdf({
  cbteTipo: 6,
  ptoVta: 6,
  cbteNro: 1,
  fecha: new Date(),
  cae: "76543210987654",
  caeVto: new Date(Date.now() + 10 * 864e5),
  neto: 252892.56,
  iva: 53107.44,
  total: 306000,
  comprador: {
    nombre: "JUAN PEREZ",
    docTipo: 96,
    docNro: "30123456",
    domicilio: "San Martin 450, Mina Clavero, Cordoba",
    condicionIva: "Consumidor Final",
  },
  items: [
    { codigo: "MAN-MUY8KPEI-CQDW", titulo: "COMBO PRINGLES JADE 3 PIEZAS INODORO, DEPOSITO Y BIDET 3 AGUJEROS", qty: 1, precio: 306000 },
  ],
  orderNumber: 7,
});
fs.writeFileSync("preview-factura.pdf", pdf);
console.log("ok, " + (pdf.length / 1024).toFixed(1) + " KB");
