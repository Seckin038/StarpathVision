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

// These declarations map the URL imports to the types from your locally installed npm packages.
declare module "https://deno.land/x/zod@v3.23.8/mod.ts" {
  export * from "zod";
}

declare module 'https://esm.sh/@supabase/supabase-js@2.45.0' {
  export * from "@supabase/supabase-js";
}