// Freno a los que prueban contraseñas (V.0.11.243).
//
// Damian, 24/11/2026: "hay alguna forma de darle seguridad ... para que no
// sea vulnerada". Hasta hoy cada contraseña equivocada solo esperaba 0,4 s:
// alguien podia probar miles. Ahora, en 15 minutos:
// - 5 equivocadas con el mismo usuario desde la misma conexion: esa conexion
//   no puede probar ese usuario por 15 minutos;
// - 20 equivocadas desde la misma conexion (a cualquier usuario): esa
//   conexion no puede probar nada por 15 minutos;
// - 30 equivocadas con el mismo usuario desde cualquier lado (el que cambia
//   de conexion para seguir probando): ese usuario se frena 15 minutos.
// Entrar bien borra lo anotado de ese usuario en esa conexion.
//
// Se guarda en la memoria del servidor: alcanza (hay una sola tienda
// atendiendo a la vez) y un reinicio no le da nada a nadie. La conexion es
// la IP que manda Cloudflare (cf-connecting-ip).
//
// Sin ningun import a proposito: lo prueban las pruebas con node solo
// (scripts/pruebas/freno-ingreso.test.ts).

export const VENTANA_MS = 15 * 60 * 1000;
export const MAX_USUARIO_CONEXION = 5;
export const MAX_CONEXION = 20;
export const MAX_USUARIO = 30;

type Marca = { veces: number[]; hasta: number };

export class Freno {
  private marcas = new Map<string, Marca>();

  /** Lo que falta (en ms) para que este usuario pueda probar desde esta
   *  conexion. 0 = puede. */
  espera(ip: string, usuario: string, ahora = Date.now()): number {
    const hasta = Math.max(
      this.marcas.get(claveUC(ip, usuario))?.hasta ?? 0,
      this.marcas.get(claveC(ip))?.hasta ?? 0,
      this.marcas.get(claveU(usuario))?.hasta ?? 0,
    );
    return Math.max(0, hasta - ahora);
  }

  /** Anota una contraseña equivocada. Dice si con esta quedo frenado. */
  fallo(ip: string, usuario: string, ahora = Date.now()): boolean {
    this.limpiar(ahora);
    const a = this.sumar(claveUC(ip, usuario), MAX_USUARIO_CONEXION, ahora);
    const b = this.sumar(claveC(ip), MAX_CONEXION, ahora);
    const c = this.sumar(claveU(usuario), MAX_USUARIO, ahora);
    return a || b || c;
  }

  /** Entro bien: se olvida lo de ese usuario en esa conexion. */
  entro(ip: string, usuario: string): void {
    this.marcas.delete(claveUC(ip, usuario));
  }

  /** ¿Ese usuario esta frenado ahora (desde alguna conexion)? */
  frenado(usuario: string, ahora = Date.now()): boolean {
    for (const [k, m] of this.marcas)
      if (m.hasta > ahora && (k === claveU(usuario) || (k.startsWith("uc:") && k.endsWith("|" + usuario)))) return true;
    return false;
  }

  /** "Liberar" desde Usuarios (Damian: "agregame tambien liberar usuario en
   *  caso de que quieran entrar en un usuario que se equivoca la contraseña
   *  varias veces"). Borra todo lo de ese usuario y tambien el freno de las
   *  conexiones desde donde se equivoco: en el local todos salen por la
   *  misma, y frenarla dejaria afuera a los demas. Dice si estaba frenado. */
  liberar(usuario: string, ahora = Date.now()): boolean {
    const estaba = this.frenado(usuario, ahora);
    const conexiones = new Set<string>();
    for (const k of [...this.marcas.keys()]) {
      if (k === claveU(usuario)) this.marcas.delete(k);
      else if (k.startsWith("uc:") && k.endsWith("|" + usuario)) {
        conexiones.add(k.slice(3, k.length - usuario.length - 1));
        this.marcas.delete(k);
      }
    }
    for (const ip of conexiones) this.marcas.delete(claveC(ip));
    return estaba;
  }

  private sumar(k: string, max: number, ahora: number): boolean {
    const m = this.marcas.get(k) ?? { veces: [], hasta: 0 };
    m.veces = m.veces.filter((t) => t > ahora - VENTANA_MS);
    m.veces.push(ahora);
    if (m.veces.length >= max) {
      m.hasta = ahora + VENTANA_MS;
      m.veces = [];
    }
    this.marcas.set(k, m);
    return m.hasta > ahora;
  }

  /** Que la memoria no crezca para siempre con conexiones viejas. */
  private limpiar(ahora: number): void {
    if (this.marcas.size < 5000) return;
    for (const [k, m] of this.marcas)
      if (m.hasta <= ahora && !m.veces.some((t) => t > ahora - VENTANA_MS)) this.marcas.delete(k);
  }
}

const claveUC = (ip: string, usuario: string) => "uc:" + ip + "|" + usuario;
const claveC = (ip: string) => "c:" + ip;
const claveU = (usuario: string) => "u:" + usuario;

/** La conexion del que pide: la que manda Cloudflare; si no, la del proxy. */
export function conexionDe(req: Request): string {
  const h = req.headers;
  const ip = h.get("cf-connecting-ip") || h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0] || "";
  return ip.trim().slice(0, 64) || "sin-ip";
}

/** "15 minutos", "1 minuto". */
export function minutosTxt(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / 60000));
  return m === 1 ? "1 minuto" : `${m} minutos`;
}

/** El de todo el servidor: uno solo, aunque lo carguen rutas distintas (el
 *  ingreso lo llena y Usuarios lo libera). */
const global = globalThis as typeof globalThis & { __frenoIngreso?: Freno };
export const FRENO_INGRESO: Freno = (global.__frenoIngreso ??= new Freno());
