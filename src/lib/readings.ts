import { supabase } from "@/lib/supabaseClient";

export type Reading = {
  id: string;
  method: "tarot" | "coffee" | "dream" | "numerology";
  title: string | null;
  created_at: string;
  thumbnail_url: string | null;
};

export async function fetchReadingsPage(opts: {
  method?: Reading["method"] | "all";
  page: number;         // 1-based
  perPage?: number;     // default 25
}) {
  const perPage = opts.perPage ?? 25;
  const from = (opts.page - 1) * perPage;
  const to = from + perPage - 1;

  let q = supabase
    .from("readings")
    .select("id, method, title, created_at, thumbnail_url", { count: "exact" })
    .order("created_at", { ascending: false });

  if (opts.method && opts.method !== "all") {
    q = q.eq("method", opts.method);
  }

  const { data, error, count } = await q.range(from, to);
  if (error) throw error;
  return { items: (data ?? []) as Reading[], total: count ?? 0, perPage };
}