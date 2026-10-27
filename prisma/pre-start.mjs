// Setup DB antes de arrancar el server en Railway:
// 1. Si hay migrations rolled-back que quedaron fallidas, marcarlas rolled-back
//    (tolerante al error si no hay nada que resolver)
// 2. Aplicar migrations pendientes
// 3. Seed idempotente
import { spawnSync } from "node:child_process";

function run(cmd, args, { allowFailure = false } = {}) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0 && !allowFailure) {
    console.error(`\n✗ Fallo "${cmd} ${args.join(" ")}" (exit ${r.status})`);
    process.exit(r.status || 1);
  }
}

// Si existe una migration "0_init" en estado fallido en _prisma_migrations,
// marcarla como rolled back para que migrate deploy pueda reintentar.
// Fallible: no hay DB o no existe migration -> ignoramos.
run("npx", ["prisma", "migrate", "resolve", "--rolled-back", "0_init"], {
  allowFailure: true,
});

// Aplicar migrations pendientes (ahora si -- debe pasar)
run("npx", ["prisma", "migrate", "deploy"]);

// Seed (idempotente, skip si ya hay productos)
run("node", ["prisma/seed.mjs"]);

// Sucursales. Idempotente: crea las dos si faltan y copia el catalogo a
// Traslasierra una sola vez. Nunca pisa lo que haya cargado el admin.
//
// Fallible a proposito: la tienda vende igual sin la tabla de sucursales (la
// home ya la consulta dentro de un try y se saltea la seccion si no esta).
// El 27/10 este paso fallo por una columna que faltaba y dejo el sitio entero
// en 502. Un paso accesorio no puede tirar abajo la tienda: si falla, queda
// el error en el log y el servicio arranca igual.
run("node", ["prisma/sucursales.mjs"], { allowFailure: true });

// Reset de precios one-shot: setea todos los productos activos a 1_000_000
// para evitar compras mientras el admin actualiza precios reales.
// Trigger: setear RESET_PRICES=1000000 (o cualquier numero) en Railway Variables.
// Ejecucion: una vez por valor distinto (persistido en tabla PriceResetLog).
if (process.env.RESET_PRICES) {
  console.log(`\n$ reset de precios → ${process.env.RESET_PRICES}`);
  run("node", ["prisma/reset-prices.mjs"]);
}

console.log("\n✓ DB lista");
