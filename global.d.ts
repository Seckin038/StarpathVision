// This declaration tells TypeScript how to handle Deno's standard library import.
declare module "https://deno.land/std@0.224.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number }
  ): void;
}

// This declaration defines the 'Deno' global variable for TypeScript.
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};