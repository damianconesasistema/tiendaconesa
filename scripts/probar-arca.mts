// Prueba que la facturacion electronica este bien configurada, SIN emitir
// ningun comprobante.
//
// Hace las dos cosas que fallan cuando algo esta mal:
//   1. pide el ticket de acceso a WSAA, que es lo que valida el certificado
//   2. le pregunta a WSFE cual fue el ultimo comprobante autorizado, que es
//      una consulta de lectura y valida el permiso y el punto de venta
//
// Si las dos pasan, emitir una factura de verdad va a funcionar. Conviene
// correrlo despues de cargar un certificado nuevo y antes de pasar a
// produccion, en vez de descubrir el problema con una venta real adelante.
//
//   sudo -u root bash -c 'set -a; . /etc/conesa.env; set +a; cd /opt/conesa && npx tsx scripts/probar-arca.mts'

import { CBTE, afipConfigurado, ambiente, cuit, puntoVenta, certificado } from "@/lib/afip/config";
import { ticketAcceso } from "@/lib/afip/wsaa";
import { ultimoAutorizado } from "@/lib/afip/wsfe";

const fallar = (m: string) => {
  console.error(`\nNO: ${m}`);
  process.exit(1);
};

if (!afipConfigurado())
  fallar("faltan datos en /etc/conesa.env (AFIP_CUIT, AFIP_CERT, AFIP_KEY, AFIP_PTO_VTA)");

console.log(`ambiente      ${ambiente()}`);
console.log(`CUIT          ${cuit()}`);
console.log(`punto de venta ${puntoVenta()}`);

const { cert } = certificado();
console.log(`certificado   cargado (${cert.length} caracteres)`);

console.log("\n1) Pidiendo ticket de acceso a WSAA...");
let ta;
try {
  ta = await ticketAcceso();
} catch (e) {
  fallar(`WSAA rechazo el certificado: ${(e as Error).message}`);
}
console.log(`   OK. Vence ${ta!.expira.toLocaleString("es-AR")}`);

console.log("\n2) Consultando a WSFE el ultimo comprobante autorizado...");
for (const [nombre, tipo] of [["Factura A", CBTE.FACTURA_A], ["Factura B", CBTE.FACTURA_B]] as const) {
  try {
    const n = await ultimoAutorizado(puntoVenta(), tipo);
    console.log(`   ${nombre}: ultimo autorizado = ${n}  (la proxima seria la ${n + 1})`);
  } catch (e) {
    fallar(`WSFE: ${(e as Error).message}`);
  }
}

console.log(`\nLISTO: el facturador esta configurado y ARCA responde (${ambiente()}).`);
if (ambiente() !== "produccion")
  console.log("Ojo: en homologacion los comprobantes NO tienen validez fiscal.");
process.exit(0);
