import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  let referralCode = profile?.referral_code;

  if (!referralCode) {
    referralCode = `EKSU-${user.id.substring(0, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await supabase
      .from("profiles")
      .update({ referral_code: referralCode })
      .eq("id", user.id);
  }

  const { data: referrals } = await supabase
    .from("referrals")
    .select("*, referred:referred_id(full_name, username, avatar_url)")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const totalEarned = (referrals || [])
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (r.bonus_amount || 0), 0);

  return NextResponse.json({
    referral_code: referralCode,
    referrals: referrals || [],
    total_earned: totalEarned,
    total_referrals: referrals?.length || 0,
  });
}
