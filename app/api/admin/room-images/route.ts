import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  try {
    const supabase = adminSupabase();
    const body = await req.json();

    const room_id = String(body?.room_id ?? "").trim();
    const url = String(body?.url ?? "").trim();
    const sort_order =
      body?.sort_order == null ? null : Number(body.sort_order);

    if (!room_id) return jsonError("room_id is required.");
    if (!url) return jsonError("url is required.");

    const { data, error } = await supabase
      .from("room_images")
      .insert({ room_id, url, sort_order })
      .select("id,room_id,url,sort_order,created_at")
      .single();

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ data });
  } catch (e: any) {
    return jsonError(e?.message || "Server error", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = adminSupabase();
    const body = await req.json();

    const id = String(body?.id ?? "").trim();
    const sort_order =
      body?.sort_order == null ? null : Number(body.sort_order);

    if (!id) return jsonError("id is required.");
    if (!Number.isFinite(sort_order as number))
      return jsonError("sort_order must be a number.");

    const { error } = await supabase
      .from("room_images")
      .update({ sort_order })
      .eq("id", id);

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ data: { ok: true } });
  } catch (e: any) {
    return jsonError(e?.message || "Server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = adminSupabase();
    const { searchParams } = new URL(req.url);

    const id = String(searchParams.get("id") ?? "").trim();
    if (!id) return jsonError("Missing id query param. Use /api/admin/room-images?id=IMAGE_UUID");

    const { error } = await supabase.from("room_images").delete().eq("id", id);
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ data: { ok: true } });
  } catch (e: any) {
    return jsonError(e?.message || "Server error", 500);
  }
}
