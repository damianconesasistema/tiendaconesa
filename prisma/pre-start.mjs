// Setup DB antes de arrancar el server en Railway:
// 1. Si hay migrations rolled-back que quedaron fallidas, marcarlas rolled-back
//    (tolerante al error si no hay nada que resolver)
// 2. Aplicar migrations pendientes
// 3. Seed idempotente
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

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
// Una sola consulta contesta las dos preguntas: cuales quedaron a medias y
// cuales ya estan aplicadas. Abrir la conexion cuesta un segundo; "npx prisma"
// cuesta catorce, y catorce segundos aca son catorce segundos de tienda
// caida, porque esto corre entre que el programa se apaga y vuelve.
async function estadoDeLasMigraciones() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const filas = await prisma.$queryRawUnsafe(
      `SELECT migration_name, finished_at, rolled_back_at
         FROM "_prisma_migrations"`,
    );
    await prisma.$disconnect();
    return {
      // Empezada, sin terminar y sin estar ya marcada como vuelta atras. Al
      // arrancar no hay otra corriendo, asi que "sin terminar" es "fallo".
      aMedias: filas
        .filter((f) => f.finished_at === null && f.rolled_back_at === null)
        .map((f) => f.migration_name),
      aplicadas: new Set(
        filas.filter((f) => f.finished_at !== null).map((f) => f.migration_name),
      ),
      leida: true,
    };
  } catch {
    // Sin base todavia, o sin tabla de migraciones. No se sabe nada, asi que
    // se hace todo el trabajo completo: es el arranque de una base nueva.
    return { aMedias: [], aplicadas: new Set(), leida: false };
  }
}

/** Las carpetas de prisma/migrations, que son las que deberian estar. */
function migracionesDelCodigo() {
  try {
    return readdirSync(new URL("./migrations", import.meta.url), {
      withFileTypes: true,
    })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return [];
  }
}

const estado = await estadoDeLasMigraciones();

for (const nombre of estado.aMedias) {
  console.log(`\n! La migracion "${nombre}" quedo a medias. La marco para reintentar.`);
  run("npx", ["prisma", "migrate", "resolve", "--rolled-back", nombre], {
    allowFailure: true,
  });
}

// Si ya estan todas aplicadas, no hace falta llamar a prisma para que nos lo
// diga. Es el caso de CASI TODOS los arranques: se publica muchas veces por
// dia y migraciones nuevas hay una cada tanto.
const faltan =
  !estado.leida ||
  estado.aMedias.length > 0 ||
  migracionesDelCodigo().some((m) => !estado.aplicadas.has(m));

if (faltan) {
  run("npx", ["prisma", "migrate", "deploy"]);
} else {
  console.log("\n· migraciones al dia, no hace falta llamar a prisma");
}

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
