import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  // Clean up expired promotions
  const now = new Date().toISOString();
  await supabase
    .from("products")
    .update({ is_promoted: false, promoted_until: null })
    .eq("is_promoted", true)
    .lt("promoted_until", now);

  return NextResponse.json({
    status: "alive",
    timestamp: now,
    cleaned_promotions: true,
  });
}
