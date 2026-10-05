// Minimal type declarations for sdk-node-payway (no @types package upstream)
declare module "sdk-node-payway" {
  export class sdk {
    constructor(
      env: string,
      publicKey: string,
      privateKey: string,
      company: string,
      user: string,
    );
    payment(
      args: Record<string, unknown>,
      cb: (result: unknown, err: unknown) => void,
    ): void;
  }
}
