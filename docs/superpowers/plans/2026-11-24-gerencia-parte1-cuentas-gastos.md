# Gerencia, parte 1: cuentas y gastos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada razón social (srl, cnc, tsl) tenga sus cuentas (efectivo, Mercado Pago, bancos) con saldo, que el cajero anote desde Caja lo que sale o entra del efectivo, y que Gerencia vea y anote gastos del día y del mes por razón social.

**Architecture:** Reglas puras sin imports (`src/lib/punto-cuentas-reglas.ts`, probadas con `node --test`) + capa de base (`src/lib/punto-cuentas.ts`, Prisma) + una ruta (`src/app/sistema/cuentas/route.ts`). La página de Punto suma una solapa "Cuentas y gastos" dentro de Gerencia y un botón "Anotar movimiento" en Caja. Un movimiento = un hecho de plata en una cuenta; una transferencia son dos filas con el mismo `grupo`; un gasto compartido es una fila con `reparto`.

**Tech Stack:** Next.js 16 (leer `node_modules/next/dist/docs/` antes de tocar rutas), Prisma 5 + Postgres, Node 24 (`node --test` con TypeScript sin compilar), página de Punto como HTML generado.

**Spec:** `docs/superpowers/specs/2026-11-24-gerencia-cuentas-gastos-design.md` (parte 1 de su "Orden de trabajo").

## Global Constraints

- Repositorio público: ningún monto, cuenta ni dato real en el código ni en las pruebas (montos de ejemplo inventados).
- No se toca nada de facturación, emisión, CAE, ventas ni cobro (`punto-documentos.ts`, `punto-ventas.ts`, `/sistema/documentos`, `/sistema/ventas`).
- No se conecta a bancos ni a Mercado Pago; el token de Mercado Pago no se toca.
- Migración nueva `prisma/migrations/57_punto_cuentas/migration.sql`, solo agregando tablas (se publica con `prisma migrate deploy` en el push).
- Plata en pesos con centavos: columnas `Float` como el resto de Punto; toda suma se hace en centavos enteros (`aCentavos`) y vuelve redondeada a 2 decimales.
- Días y meses en hora de Argentina (UTC−3 fijo): un gasto a las 22:00 del 24 es del 24, no del 25.
- Errores de las rutas de `/sistema`: HTTP 200 con `{ error }` (Cloudflare tapa los 5xx); 401 solo sin sesión.
- Lo que vuelve a la página va adentro de `innerHTML`: textos sin `<` ni `>`.
- Nada se borra: un movimiento se anula (`anuladoEn`, `anuladoPor`, `motivo`) y queda a la vista.
- Página: cada cambio es un script `punto-vNNNa.py` sobre el HTML anterior del scratchpad (reemplazos con cuenta exacta), después `node generar-punto-ts.mjs <html> src/app/sistema/punto.ts`, `node comprobar-punto-ts.mjs`, `node --check` del script grande, `npx tsc --noEmit -p .`, prueba en el simulador (`servidor-prueba.mjs`, puerto 3999).
- Versión: `src/lib/version.ts` `APP_VERSION` sube (V.0.11.226 en adelante) con su entrada en `VERSION_HISTORY`.
- Sucursales: `srl` (CONESA SRL), `cnc` (SANITARIOS CNC), `tsl` (TRASLASIERRA), separadas para la plata.

## Review Focus

1. Doble clic o corte de conexión al guardar un movimiento → se guarda una sola vez (mismo `idLocal` devuelve el mismo movimiento). Prueba en Task 3.
2. Un movimiento a las 22:30 hora argentina → cuenta para ese día y ese mes, no para el siguiente. Prueba en Task 1.
3. Un gasto repartido 33/33/34 o con centavos impares → las partes suman exactamente el total. Prueba en Task 1.
4. Un cajero con sucursal fija que manda (a mano) una cuenta de otra sucursal o un banco → rechazado por el servidor. Prueba en Task 1 (`puedeMover`).
5. Anular una transferencia, o anular dos veces → se anulan las dos patas, la segunda vez no cambia nada, y el saldo ya no la cuenta. Pruebas en Task 1 (saldo) y Task 3 (anular).

---

### Task 1: Reglas puras de cuentas y movimientos

**Files:**
- Create: `src/lib/punto-cuentas-reglas.ts` (sin ningún import)
- Test: `scripts/pruebas/punto-cuentas.test.ts`

**Interfaces:**
- Produces:
  - `type TipoCuenta = "efectivo" | "mercadopago" | "banco"`; `type ClaseBanco = "ca" | "cc"`
  - `type TipoMovimiento = "gasto" | "pago-proveedor" | "retiro" | "cobranza" | "sena" | "transferencia" | "ajuste"`
  - `const SUCURSALES_CUENTAS = ["srl","cnc","tsl"] as const`
  - `const RUBROS_BASE: readonly string[]` = Alquiler, Luz, Gas, Agua, Internet y teléfono, Sueldos, Cargas sociales, Impuestos, Gastos bancarios, Honorarios del contador, Publicidad, Fletes, Combustible, Limpieza, Librería, Mantenimiento, Varios
  - `type Cuenta = { id: string; sucursal: string; tipo: TipoCuenta; nombre: string; banco: string; clase: ClaseBanco | null; saldoInicial: number; desde: string /*YYYY-MM-DD*/; activa: boolean }`
  - `type Movimiento = { id: string; grupo: string; fecha: string /*ISO*/; cuentaId: string; sucursal: string; tipo: TipoMovimiento; monto: number /* + entra, − sale */; rubro: string; detalle: string; iva: number; reparto: Record<string, number> | null; usuario: string; anulado: boolean }`
  - `aCentavos(n: number): number`, `dePesos(c: number): number`
  - `diaAR(iso: string): string` (YYYY-MM-DD), `mesAR(iso: string): string` (YYYY-MM)
  - `limpiarCuenta(x: unknown): Omit<Cuenta,"id"> | string` (string = el error para mostrar)
  - `limpiarPedidoMovimiento(x: unknown): PedidoMovimiento | string` con `type PedidoMovimiento = { idLocal: string; tipo: TipoMovimiento; cuentaId: string; cuentaDestinoId: string | null; monto: number /* siempre > 0 */; sentido: "entra" | "sale" | null /* solo ajuste */; rubro: string; detalle: string; iva: number; reparto: Record<string, number> | null; fecha: string | null }`
  - `signoOrigen(p: PedidoMovimiento): 1 | -1` (gasto, pago-proveedor, retiro, transferencia: −1; cobranza, sena: +1; ajuste: `sentido`). La pata de destino de una transferencia es siempre +1.
  - `repartir(montoCent: number, reparto: Record<string, number>): Record<string, number>` (centavos por sucursal)
  - `saldoDe(cuenta: Cuenta, movs: readonly Movimiento[], hastaDia?: string): number`
  - `resumenGastos(movs: readonly Movimiento[], cuentas: readonly Cuenta[], desdeDia: string, hastaDia: string): ResumenGastos` con `type ResumenGastos = { porSucursal: Record<string, { total: number; porRubro: Record<string, number>; porDia: Record<string, number> }> }`
  - `puedeMover(yo: { permisos: readonly string[]; sucursal: string | null }, pedido: PedidoMovimiento, origen: Cuenta, destino: Cuenta | null): string | null` (null = puede; string = el motivo)

- [ ] **Step 1: Write the failing tests** in `scripts/pruebas/punto-cuentas.test.ts` (`import { test } from "node:test"; import assert from "node:assert/strict"; import {…} from "../../src/lib/punto-cuentas-reglas.ts";`):

```ts
test("dia y mes en hora argentina", () => {
  assert.equal(diaAR("2026-11-25T01:30:00.000Z"), "2026-11-24");
  assert.equal(diaAR("2026-11-25T03:00:00.000Z"), "2026-11-25");
  assert.equal(mesAR("2026-12-01T02:59:00.000Z"), "2026-11");
});
test("repartir: las partes suman el total", () => {
  assert.deepEqual(repartir(10001, { srl: 50, cnc: 50 }), { srl: 5001, cnc: 5000 });
  const r = repartir(100000, { srl: 33, cnc: 33, tsl: 34 });
  assert.equal(r.srl + r.cnc + r.tsl, 100000);
});
test("limpiarPedidoMovimiento", () => {
  const base = { idLocal: "abc123", tipo: "gasto", cuentaId: "c1", monto: 15000.5, rubro: "Combustible", detalle: "nafta" };
  assert.equal(typeof limpiarPedidoMovimiento(base), "object");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, monto: 0 }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, monto: -5 }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, monto: 1e11 }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, tipo: "otro" }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, rubro: "" }), "string");          // gasto sin rubro
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, tipo: "transferencia" }), "string"); // sin destino
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, reparto: { srl: 60, cnc: 30 } }), "string"); // no suma 100
  assert.equal((limpiarPedidoMovimiento({ ...base, detalle: "<b>x</b>" }) as PedidoMovimiento).detalle.includes("<"), false);
});
test("saldo: inicial + movimientos no anulados desde la fecha de la cuenta", () => {
  const c: Cuenta = { id: "c1", sucursal: "tsl", tipo: "efectivo", nombre: "Efectivo", banco: "", clase: null, saldoInicial: 1000, desde: "2026-11-01", activa: true };
  const m = (id: string, monto: number, fecha: string, anulado = false): Movimiento =>
    ({ id, grupo: id, fecha, cuentaId: "c1", sucursal: "tsl", tipo: "gasto", monto, rubro: "Varios", detalle: "", iva: 0, reparto: null, usuario: "x", anulado });
  const movs = [m("a", -200.1, "2026-11-02T12:00:00Z"), m("b", 50, "2026-11-03T12:00:00Z"), m("c", -999, "2026-11-03T13:00:00Z", true), m("d", -5, "2026-10-31T12:00:00Z")];
  assert.equal(saldoDe(c, movs), 849.9);
  assert.equal(saldoDe(c, movs, "2026-11-02"), 799.9);
});
test("resumenGastos: solo gastos, repartidos, por dia y rubro", () => { /* gasto 1000 en cuenta srl con reparto srl50/cnc50 + pago-proveedor 500 + retiro 300:
  porSucursal.srl.total === 500, porSucursal.cnc.total === 500, ni el pago a proveedor ni el retiro suman; porRubro y porDia con esos valores; los anulados no suman */ });
test("puedeMover", () => {
  // cajero (permiso "caja", sin "cuentas") con sucursal "tsl":
  //   gasto desde el efectivo de tsl → null; desde el efectivo de srl → string; desde un banco de tsl → string;
  //   con reparto → string; transferencia de efectivo tsl a banco tsl → null; a banco srl → string.
  // cajero sin sucursal fija: gasto desde el efectivo de srl → null.
  // gerencia (permiso "cuentas"): cualquier cuenta, con reparto → null.
  // sin "caja" ni "cuentas" → string. Cuenta inactiva → string para todos.
});
```

(Los dos últimos tests se escriben con esos casos como `assert`, uno por línea del comentario.)

- [ ] **Step 2: Run to verify they fail**

Run: `node --test scripts/pruebas/punto-cuentas.test.ts`
Expected: FAIL (no existe el módulo).

- [ ] **Step 3: Implement `src/lib/punto-cuentas-reglas.ts`**

Reglas que el código fija:
- `diaAR`/`mesAR`: restar 3 h al instante y tomar la fecha UTC (Argentina no tiene horario de verano).
- `limpiarPedidoMovimiento`: `idLocal` 6–64 caracteres `[A-Za-z0-9_-]`; `monto` número finito, `0 < monto ≤ 1e10`, redondeado a centavos; `rubro` obligatorio solo en `gasto` (máx. 40); `detalle` máx. 200, sin `<>`; `iva` 0 ≤ iva < monto; `transferencia` exige `cuentaDestinoId` distinto del origen; `reparto` solo en `gasto`, claves de `SUCURSALES_CUENTAS`, enteros 1–100 que suman 100; `ajuste` exige `sentido` (`"entra"` o `"sale"`); en los demás tipos `sentido` es null; `fecha` opcional ISO, no más de 1 día en el futuro.
- `repartir`: reparto de mayor resto (el centavo que sobra va a la primera sucursal en orden de `SUCURSALES_CUENTAS` con más resto).
- `saldoDe`: `saldoInicial` + suma de `monto` de los movimientos de esa cuenta, no anulados, con `diaAR(fecha) >= desde` (y `<= hastaDia` si viene).
- `resumenGastos`: solo `tipo === "gasto"` no anulados con `diaAR` entre `desdeDia` y `hastaDia`; importe positivo `-monto`; sin `reparto`, todo a la sucursal de la cuenta; con `reparto`, `repartir`.
- `puedeMover`: con permiso `"cuentas"` puede todo (cuenta activa). Con `"caja"` sin `"cuentas"`: origen tipo `efectivo`, de su sucursal (o cualquiera si `sucursal` es null), sin `reparto`; en `transferencia` el destino es de la misma sucursal que el origen.

- [ ] **Step 4: Run to verify they pass**

Run: `node --test scripts/pruebas/punto-cuentas.test.ts`
Expected: PASS, todos.

- [ ] **Step 5: Commit**

```bash
git add src/lib/punto-cuentas-reglas.ts scripts/pruebas/punto-cuentas.test.ts
git commit -m "Punto: reglas de cuentas y movimientos (saldo, reparto, hora argentina, permisos)"
```

### Task 2: Tablas, migración y permiso "Cuentas y gastos"

**Files:**
- Modify: `prisma/schema.prisma` (al final de los modelos de Punto)
- Create: `prisma/migrations/57_punto_cuentas/migration.sql`
- Modify: `src/lib/punto-permisos.ts` (`AREAS_PUNTO`)
- Test: `scripts/pruebas/punto-cuentas.test.ts` (agregar)

**Interfaces:**
- Produces: modelos `PuntoCuenta` y `PuntoMovimiento`; área de permiso `"cuentas"`.

- [ ] **Step 1: Write the failing test** (agregar al archivo de Task 1):

```ts
import { AREAS_PUNTO, permisosEfectivos } from "../../src/lib/punto-permisos.ts";
test("permiso cuentas", () => {
  assert.ok(AREAS_PUNTO.some(a => a.id === "cuentas"));
  assert.ok(permisosEfectivos(null).includes("cuentas"));
  assert.equal(permisosEfectivos(["caja"]).includes("cuentas"), false);
});
```

- [ ] **Step 2: Run** `node --test scripts/pruebas/punto-cuentas.test.ts` → FAIL en "permiso cuentas".

- [ ] **Step 3: Implement**
  - `AREAS_PUNTO`: `{ id: "cuentas", nombre: "Cuentas y gastos", ayuda: "Las cuentas de cada razón social (efectivo, Mercado Pago, bancos), sus saldos y los gastos. Está adentro de Gerencia." }`, después de `"contable"`.
  - `PuntoCuenta`: `id String @id @default(cuid())`, `sucursal String`, `tipo String`, `nombre String`, `banco String @default("")`, `clase String?`, `saldoInicial Float @default(0)`, `desde String` (YYYY-MM-DD), `activa Boolean @default(true)`, `creadoPor String`, `creadoEn DateTime @default(now())`, `actualizadoEn DateTime @updatedAt`, `movimientos PuntoMovimiento[]`, `@@unique([sucursal, nombre])`.
  - `PuntoMovimiento`: `id String @id @default(cuid())`, `idLocal String` (sin `@unique`: las dos patas de una transferencia comparten el del pedido; el único es `@@unique([idLocal, cuentaId])`), `grupo String`, `fecha DateTime @default(now())`, `creadoEn DateTime @default(now())`, `usuario String`, `sucursal String`, `tipo String`, `cuentaId String` + relación a `PuntoCuenta`, `monto Float`, `rubro String @default("")`, `detalle String @default("")`, `iva Float @default(0)`, `reparto Json?`, `anuladoEn DateTime?`, `anuladoPor String?`, `motivo String?`, índices `[cuentaId, fecha]`, `[sucursal, fecha]`, `[grupo]`.
  - `migration.sql` con el `CREATE TABLE` / índices / FK que corresponden (escribirlo a mano siguiendo el estilo de `55_punto_ventas`, con un comentario arriba que cite a Damián: "en gerencia necesito que tenga un lugar donde sea los gastos diarios y los gastos mensuales de cada sucursal").
  - `npx prisma generate`.

- [ ] **Step 4: Run** `node --test scripts/pruebas/punto-cuentas.test.ts` → PASS; `npx tsc --noEmit -p .` → sin errores.

- [ ] **Step 5: Commit** — `git add prisma/schema.prisma prisma/migrations/57_punto_cuentas src/lib/punto-permisos.ts scripts/pruebas/punto-cuentas.test.ts` — "Punto: tablas de cuentas y movimientos, permiso Cuentas y gastos".

### Task 3: Capa de base `punto-cuentas.ts`

**Files:**
- Create: `src/lib/punto-cuentas.ts`

**Interfaces:**
- Consumes: todo lo de Task 1; modelos de Task 2.
- Produces:
  - `listarCuentas(): Promise<Cuenta[]>`
  - `guardarCuenta(id: string | null, datos: Omit<Cuenta,"id">, quien: string): Promise<Cuenta | string>` (string = error, p. ej. nombre repetido en la sucursal)
  - `listarMovimientos(f: { desdeDia: string; hastaDia: string; sucursal?: string | null; soloEfectivo?: boolean }): Promise<Movimiento[]>`
  - `todosLosMovimientosDe(cuentaIds: string[]): Promise<Movimiento[]>` (para los saldos)
  - `anotarMovimiento(p: PedidoMovimiento, quien: string): Promise<{ movimientos: Movimiento[]; yaEstaba: boolean } | string>`
  - `anularMovimiento(id: string, quien: string, motivo: string): Promise<Movimiento[] | string>` (anula todo el `grupo`)
  - `leerRubros(): Promise<string[]>` / `guardarRubros(l: string[]): Promise<string[]>` (en `Setting` clave `punto.gastos.rubros`; sin guardar devuelve `RUBROS_BASE`)

- [ ] **Step 1: Implement** siguiendo el estilo de `src/lib/punto-clientes.ts`.
  - `anotarMovimiento`: si ya hay filas con ese `idLocal`, devolverlas con `yaEstaba: true` (mismo pedido repetido). Si no, en una transacción: la fila de origen (`monto = signoOrigen(p) × p.monto`, `sucursal` = la de la cuenta) y, en `transferencia`, la de destino (`+p.monto`), las dos con el mismo `grupo` (= `idLocal`). Un choque del único `(idLocal, cuentaId)` (P2002) se resuelve leyendo y devolviendo lo guardado.
  - `anularMovimiento`: si el grupo ya está anulado, devolverlo igual (sin error). `motivo` obligatorio, máx. 200, sin `<>`.
- [ ] **Step 2: Verify** `npx tsc --noEmit -p .` sin errores. (La lógica que decide está probada en Task 1; esta capa se prueba de punta a punta en Task 4 contra el simulador y en Task 7 en vivo.)
- [ ] **Step 3: Commit** — "Punto: guardar cuentas y movimientos en la base".

### Task 4: Ruta `/sistema/cuentas`

**Files:**
- Create: `src/app/sistema/cuentas/route.ts`
- Modify (scratchpad, no repo): `servidor-prueba.mjs` — la misma ruta en memoria, para el simulador

**Interfaces:**
- Consumes: Task 1 (`puedeMover`, `limpiar…`, `saldoDe`, `resumenGastos`, `diaAR`), Task 3.
- Produces (lo que usa la página):
  - `GET /sistema/cuentas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` → `{ cuentas: (Cuenta & { saldo: number })[], movimientos: Movimiento[], resumen: ResumenGastos, rubros: string[], puedeTodo: boolean }`. Con `"cuentas"`: todo. Con `"caja"` sin `"cuentas"`: solo cuentas `efectivo` de su sucursal (o las tres si no tiene fija), solo movimientos de hoy (`diaAR`) de esas cuentas, `saldo` solo de esas, `resumen` vacío. Sin ninguno de los dos: `{ error }`.
  - `POST { yo, accion: "movimiento", …PedidoMovimiento }` → `{ ok: true, movimientos, yaEstaba }`
  - `POST { yo, accion: "anular", id, motivo }` → `{ ok: true, movimientos }` (con `"caja"` sin `"cuentas"`: solo lo suyo y de hoy)
  - `POST { yo, accion: "cuenta", id?, …Cuenta }` → `{ ok: true, cuenta }` (solo `"cuentas"`)
  - `POST { yo, accion: "rubros", rubros: string[] }` → `{ ok: true, rubros }` (solo `"cuentas"`)

- [ ] **Step 1: Implement** con el patrón de `src/app/sistema/clientes/route.ts`: `quienEntra()` → `yoPunto()` → `deOtroUsuario(cuerpo.yo)` → permisos → limpiar → `puedeMover` → capa de base → `registrar(...)` en el Registro ("Punto: anotó un gasto", "Punto: anuló un movimiento", "Punto: cargó la cuenta …") con monto y detalle.
- [ ] **Step 2: Mock** en `servidor-prueba.mjs`: `/sistema/cuentas` GET/POST con arrays en memoria y las mismas respuestas; importa las reglas de Task 1 directo del `.ts` (Node 24 lee TypeScript).
- [ ] **Step 3: Verify** `npx tsc --noEmit -p .`; con el simulador levantado, `curl` de: crear cuenta, anotar gasto dos veces con el mismo `idLocal` (una sola fila, la segunda con `yaEstaba: true`), anular la transferencia (las dos patas anuladas, segunda anulación sin error).
- [ ] **Step 4: Commit** — "Punto: ruta /sistema/cuentas".

### Task 5: Caja — "Anotar movimiento" y lo de hoy

**Files:**
- Create (scratchpad): `punto-v151a.py` (entrada v150, salida v151)
- Modify: `src/app/sistema/punto.ts` (generado)

**Interfaces:**
- Consumes: Task 4 (`GET/POST /sistema/cuentas`), `pedirSrv(url, cuerpo)` de la página, `aNum` (lee "15.000,50"), `fmt`, `txt`, `toast`, `sucAct()`, `S.cajaSuc`.

- [ ] **Step 1:** En `#v-caja`, botón **"Anotar movimiento"** (ícono nuevo) y una tarjeta **"Movimientos de la caja de hoy"** (hora, tipo, rubro, detalle, monto, quién, anular). El formulario (una ventanita con cruz y Esc, como "Pasar a otra sucursal"): **Qué es** (Gasto / Pago a proveedor / Retiro / Cobranza de cuenta corriente / Seña / Depositar en el banco), **Monto**, **Rubro** (solo Gasto; los de `rubros`), **Detalle**, **Caja** (el efectivo de la sucursal; elegible solo si el usuario no tiene sucursal fija), **A qué cuenta** (solo Depositar: las cuentas de esa sucursal). `idLocal` nuevo al abrir el formulario y el mismo en cada reintento.
- [ ] **Step 2:** Tiles de Caja: sumar **"Gastos de hoy"** y **"Efectivo en caja"** (saldo de la cuenta efectivo de la sucursal elegida; sin cuenta cargada: "Cargá la caja en Gerencia → Cuentas y gastos").
- [ ] **Step 3: Verify en el simulador:** anotar un gasto de $15.000,50 → aparece en la lista y baja el efectivo; doble clic en Guardar → una sola fila; anular con motivo → tachado y el saldo vuelve; cajero con sucursal fija no ve el selector de caja; mostrador (sin "caja") no ve nada de esto.
- [ ] **Step 4:** Generar `punto.ts`, comprobaciones del pipeline, commit — "Punto: anotar movimientos desde Caja".

### Task 6: Gerencia — solapa "Cuentas y gastos"

**Files:**
- Create (scratchpad): `punto-v152a.py` (entrada v151, salida v152)
- Modify: `src/app/sistema/punto.ts` (generado)

**Interfaces:**
- Consumes: Task 4; en la página `GERENCIA_ADENTRO`, `AREA_DE_VISTA`, `#subGer`, `avisarVista`, `ICO_EN`, la lista de accesos de Inicio.

- [ ] **Step 1:** Vista nueva `v-cuentas`: `GERENCIA_ADENTRO = ["gerencia","renta","contable","cuentas"]`, `AREA_DE_VISTA.cuentas = "cuentas"`, botón "Cuentas y gastos" en `#subGer`, `avisarVista` → `pintarCuentas()`.
- [ ] **Step 2:** Arriba, **período**: Hoy / Este mes / Mes anterior / entre dos fechas. Solapas de razón social (SRL, CNC, Traslasierra, Todas) como en Caja.
- [ ] **Step 3:** Tarjeta **"Gastos"**: total del período por razón social, por rubro (barras) y por día (tabla); con "Este mes" muestra también el día de hoy aparte ("gastos diarios y mensuales").
- [ ] **Step 4:** Tarjeta **"Cuentas"**: por razón social, cada cuenta con tipo, banco, CA/CC y **saldo**; **"Nueva cuenta"** / editar (nombre, tipo, banco, caja de ahorro o cuenta corriente, saldo con el que arranca, desde qué día, activa).
- [ ] **Step 5:** **"Anotar movimiento"** (el mismo formulario de Task 5, con cualquier cuenta y, en Gasto, **"Repartir entre razones sociales"** con % que arranca en 50/50 SRL-CNC) y la **lista de movimientos** del período con anular.
- [ ] **Step 6:** **"Rubros"**: lista editable (sumar, renombrar, sacar; los usados en movimientos viejos siguen leyéndose igual).
- [ ] **Step 7: Verify en el simulador:** crear una cuenta efectivo y una banco para tsl; gasto de $100.000 repartido 50/50 SRL-CNC → cada una suma $50.000 en "Gastos" y sale todo de la cuenta elegida; transferencia efectivo → banco mueve los dos saldos; "Este mes" vs "Hoy" con un movimiento a las 22:30; usuario sin "cuentas" no ve la solapa.
- [ ] **Step 8:** Generar `punto.ts`, comprobaciones del pipeline, commit — "Punto: Gerencia, cuentas y gastos".

### Task 7: Publicar y verificar en vivo

**Files:**
- Modify: `src/lib/version.ts`

- [ ] **Step 1:** `APP_VERSION` siguiente y entrada en `VERSION_HISTORY` (qué cambió, en palabras de Damián).
- [ ] **Step 2:** `node --test scripts/pruebas/punto-cuentas.test.ts` PASS; `npx tsc --noEmit -p .` sin errores.
- [ ] **Step 3:** `git push`, esperar el despliegue (`gh run watch`; si falla al bajar la letra de Google, `gh run rerun`), `curl https://conesa.com.ar/sistema/version` con la versión nueva.
- [ ] **Step 4:** En vivo, solo mirando: la solapa "Cuentas y gastos" aparece en Gerencia y Caja muestra "Anotar movimiento"; `GET /sistema/cuentas` contesta `{ cuentas: [] … }`. **No** se cargan cuentas ni gastos de prueba en vivo: las cuentas reales las carga Damián.
- [ ] **Step 5:** Nota en la memoria del proyecto (`project_punto_demo.md`).
