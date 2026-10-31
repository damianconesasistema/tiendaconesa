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

// Una migracion que falla deja TODAS las demas bloqueadas: migrate deploy
// contesta P3009 y se niega a aplicar nada mas. Como esto corre al arrancar,
// el servicio no levanta, systemd lo reintenta, vuelve a fallar, y la tienda
// queda caida hasta que alguien entre al servidor a mano. Paso el 31/10 con
// la migracion 25: un error de sintaxis en el SQL tuvo el sitio abajo.
//
// Antes esto estaba escrito a mano para "0_init", una sola migracion. Ahora
// se busca cualquiera que haya quedado a medias y se la marca como vuelta
// atras, que es lo que Prisma pide para poder reintentarla. No se pierde
// nada: cada migracion corre dentro de una transaccion, asi que una que
// fallo no dejo cambios a medio hacer.
//
// Esto NO tapa el problema. Si el SQL sigue roto, migrate deploy vuelve a
// fallar y el servicio no arranca igual. Lo que cambia es que para
// arreglarlo alcanza con subir el SQL corregido.
async function migracionesAMedias() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    // Empezada, sin terminar y sin estar ya marcada como vuelta atras. Al
    // arrancar no hay otra corriendo, asi que "sin terminar" es "fallo".
    const filas = await prisma.$queryRawUnsafe(
      `SELECT migration_name FROM "_prisma_migrations"
        WHERE finished_at IS NULL AND rolled_back_at IS NULL`,
    );
    await prisma.$disconnect();
    return filas.map((f) => f.migration_name);
  } catch {
    // Sin base todavia, o sin tabla de migraciones: no hay nada que resolver.
    return [];
  }
}

for (const nombre of await migracionesAMedias()) {
  console.log(`\n! La migracion "${nombre}" quedo a medias. La marco para reintentar.`);
  run("npx", ["prisma", "migrate", "resolve", "--rolled-back", nombre], {
    allowFailure: true,
  });
}

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
