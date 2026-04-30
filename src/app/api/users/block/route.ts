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

  const { data: blocks } = await supabase
    .from("user_blocks")
    .select("*, blocked:blocked_id(id, full_name, avatar_url)")
    .eq("blocker_id", user.id);

  return NextResponse.json({ blocks: blocks || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blocked_id, reason } = await req.json();

  if (!blocked_id) {
    return NextResponse.json(
      { error: "blocked_id is required" },
      { status: 400 }
    );
  }

  if (blocked_id === user.id) {
    return NextResponse.json(
      { error: "Cannot block yourself" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_blocks")
    .upsert(
      {
        blocker_id: user.id,
        blocked_id,
        reason: reason || null,
      },
      { onConflict: "blocker_id,blocked_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ block: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const blockedId = searchParams.get("blocked_id");

  if (!blockedId) {
    return NextResponse.json(
      { error: "blocked_id is required" },
      { status: 400 }
    );
  }

  await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", blockedId);

  return NextResponse.json({ success: true });
}
