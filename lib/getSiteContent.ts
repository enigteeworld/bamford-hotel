import { supabaseServer } from "./supabaseServer";

export async function getSiteContent(keys: string[]) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("site_content")
    .select("key,value")
    .in("key", keys);

  if (error) return {};

  const map: Record<string, string> = {};
  for (const row of data || []) map[row.key] = row.value;
  return map;
}
