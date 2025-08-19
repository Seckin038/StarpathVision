// Safe runtime check: werkt in Deno (Supabase) én in Node
export function getEnv(key: string): string | undefined {
  // Deno (Supabase Edge Functions)
  // @ts-ignore: Deno is a global in the Supabase Edge Function environment
  if (typeof globalThis !== "undefined" && (globalThis as any).Deno?.env?.get) {
    // @ts-ignore: Deno is a global in the Supabase Edge Function environment
    return (globalThis as any).Deno.env.get(key);
  }
  // Node (lokaal) - Vite/Next.js server-side
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

// Vereist env variabele met duidelijke foutmelding
export function requireEnv(key: string): string {
  const val = getEnv(key);
  if (!val) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return val;
}