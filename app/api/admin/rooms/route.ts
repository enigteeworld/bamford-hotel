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

function isValidSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

async function handleUpsert(req: Request) {
  const supabase = adminSupabase();
  const body = await req.json();

  const id = String(body?.id ?? "").trim(); // required for update
  const name = String(body?.name ?? "").trim();
  const slug = String(body?.slug ?? "").trim();

  if (!id) return jsonError("Room id is required for update.");
  if (!name) return jsonError("Room name is required.");
  if (!slug) return jsonError("Room slug is required.");
  if (!isValidSlug(slug)) {
    return jsonError(
      "Slug must be lowercase letters/numbers with hyphens only (e.g. deluxe-king)."
    );
  }

  // slug uniqueness (except this id)
  const { data: existing, error: exErr } = await supabase
    .from("rooms")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (exErr) return jsonError(exErr.message, 500);
  if (existing?.id && existing.id !== id) {
    return jsonError(`Slug already exists: ${slug}`, 409);
  }

  const payload = {
    slug,
    name,
    description: body?.description ?? null,
    price_per_night: body?.price_per_night ?? null,
    currency: body?.currency ?? "NGN",
    bed_type: body?.bed_type ?? null,
    max_guests: body?.max_guests ?? null,
    size_sqm: body?.size_sqm ?? null,
    amenities: Array.isArray(body?.amenities) ? body.amenities : [],
  };

  const { data, error } = await supabase
    .from("rooms")
    .update(payload)
    .eq("id", id)
    .select(
      "id,slug,name,description,price_per_night,currency,bed_type,max_guests,size_sqm,amenities,created_at"
    )
    .single();

  if (error) return jsonError(error.message, 500);

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  try {
    const supabase = adminSupabase();
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const slug = String(body?.slug ?? "").trim();

    if (!name) return jsonError("Room name is required.");
    if (!slug) return jsonError("Room slug is required.");
    if (!isValidSlug(slug))
      return jsonError(
        "Slug must be lowercase letters/numbers with hyphens only (e.g. deluxe-king)."
      );

    const { data: existing, error: exErr } = await supabase
      .from("rooms")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (exErr) return jsonError(exErr.message, 500);
    if (existing?.id) return jsonError(`Slug already exists: ${slug}`, 409);

    const payload = {
      slug,
      name,
      description: body?.description ?? null,
      price_per_night: body?.price_per_night ?? null,
      currency: body?.currency ?? "NGN",
      bed_type: body?.bed_type ?? null,
      max_guests: body?.max_guests ?? null,
      size_sqm: body?.size_sqm ?? null,
      amenities: Array.isArray(body?.amenities) ? body.amenities : [],
    };

    const { data, error } = await supabase
      .from("rooms")
      .insert(payload)
      .select(
        "id,slug,name,description,price_per_night,currency,bed_type,max_guests,size_sqm,amenities,created_at"
      )
      .single();

    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ data });
  } catch (e: any) {
    return jsonError(e?.message || "Server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    return await handleUpsert(req);
  } catch (e: any) {
    return jsonError(e?.message || "Server error", 500);
  }
}

// ✅ If your admin uses PATCH instead of PUT, this prevents 405
export async function PATCH(req: Request) {
  try {
    return await handleUpsert(req);
  } catch (e: any) {
    return jsonError(e?.message || "Server error", 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = adminSupabase();
    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") ?? "").trim();

    if (!id)
      return jsonError("Missing id query param. Use /api/admin/rooms?id=ROOM_UUID");

    await supabase.from("room_images").delete().eq("room_id", id);

    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return jsonError(error.message, 500);

    return NextResponse.json({ data: { ok: true } });
  } catch (e: any) {
    return jsonError(e?.message || "Server error", 500);
  }
}
