import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: savedItems } = await supabase
    .from("saved_items")
    .select("*, listing:listing_id(*, seller:seller_id(full_name, username, avatar_url))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ saved_items: savedItems || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listing_id } = await req.json();

  if (!listing_id) {
    return NextResponse.json(
      { error: "Listing ID is required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listing_id)
    .single();

  if (existing) {
    await supabase
      .from("saved_items")
      .delete()
      .eq("id", existing.id);
    return NextResponse.json({ saved: false, message: "Item removed from saved" });
  }

  await supabase.from("saved_items").insert({
    user_id: user.id,
    listing_id,
  });

  return NextResponse.json({ saved: true, message: "Item saved" });
}
