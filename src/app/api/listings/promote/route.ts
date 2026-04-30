import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROMOTION_COST = 500; // ₦500 to promote a listing
const PROMOTION_DAYS = 7; // 7 days of promotion

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { product_id } = await req.json();

  if (!product_id) {
    return NextResponse.json(
      { error: "product_id is required" },
      { status: 400 }
    );
  }

  // Verify the product belongs to the user
  const { data: product } = await supabase
    .from("products")
    .select("id, seller_id, is_promoted")
    .eq("id", product_id)
    .single();

  if (!product || product.seller_id !== user.id) {
    return NextResponse.json(
      { error: "Product not found or not yours" },
      { status: 404 }
    );
  }

  if (product.is_promoted) {
    return NextResponse.json(
      { error: "Product is already promoted" },
      { status: 400 }
    );
  }

  // Check wallet balance
  const { data: wallet } = await supabase
    .from("wallets")
    .select("id, balance")
    .eq("user_id", user.id)
    .single();

  if (!wallet || wallet.balance < PROMOTION_COST) {
    return NextResponse.json(
      {
        error: `Insufficient wallet balance. You need ₦${PROMOTION_COST} to promote a listing.`,
      },
      { status: 400 }
    );
  }

  // Deduct from wallet
  const newBalance = wallet.balance - PROMOTION_COST;
  const { error: walletError } = await supabase
    .from("wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("id", wallet.id);

  if (walletError) {
    return NextResponse.json(
      { error: "Failed to deduct wallet balance" },
      { status: 500 }
    );
  }

  // Record wallet transaction
  await supabase.from("wallet_transactions").insert({
    user_id: user.id,
    type: "withdrawal",
    amount: PROMOTION_COST,
    balance_before: wallet.balance,
    balance_after: newBalance,
    status: "success",
    reference: `PROMO-${product_id}-${Date.now()}`,
    description: `Listing promotion for 7 days`,
    metadata: { product_id, promotion_days: PROMOTION_DAYS },
  });

  // Promote the product
  const promotedUntil = new Date();
  promotedUntil.setDate(promotedUntil.getDate() + PROMOTION_DAYS);

  const { error: updateError } = await supabase
    .from("products")
    .update({
      is_promoted: true,
      promoted_until: promotedUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", product_id);

  if (updateError) {
    // Refund if promotion fails
    await supabase
      .from("wallets")
      .update({ balance: wallet.balance })
      .eq("id", wallet.id);
    return NextResponse.json(
      { error: "Failed to promote listing" },
      { status: 500 }
    );
  }

  // Create notification
  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "wallet_debit",
    title: "Listing Promoted",
    message: `Your listing has been promoted for ${PROMOTION_DAYS} days. ₦${PROMOTION_COST} was deducted from your wallet.`,
    metadata: { product_id, amount: PROMOTION_COST },
  });

  return NextResponse.json({
    success: true,
    promoted_until: promotedUntil.toISOString(),
    cost: PROMOTION_COST,
    new_balance: newBalance,
  });
}
