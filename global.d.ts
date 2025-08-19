// Minimal ambient types zodat TS weet dat Deno bestaat
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};