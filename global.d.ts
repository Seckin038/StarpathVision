// This declaration tells TypeScript how to handle the Deno server import.
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  // We only need to define the types we use, in this case the 'serve' function.
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): void;
}

// This declaration defines the 'Deno' global variable for TypeScript.
declare const Deno: {
  env: {
    get(key:string): string | undefined;
  };
};