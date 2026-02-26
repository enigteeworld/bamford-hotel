import { createClient } from "@supabase/supabase-js";

export type ContentMap = Record<string, string>;

export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

export async function getContentMap() {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("site_content")
    .select("key,value")
    .order("key", { ascending: true });

  if (error) throw new Error(error.message);

  const map: ContentMap = {};
  (data || []).forEach((r: any) => {
    map[r.key] = r.value ?? "";
  });
  return map;
}
