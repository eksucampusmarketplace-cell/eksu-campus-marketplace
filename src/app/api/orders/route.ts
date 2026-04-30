import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "buyer";

  const column = role === "seller" ? "seller_id" : "buyer_id";

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "*, listing:listing_id(title, images, price), buyer:buyer_id(full_name, username, avatar_url), seller:seller_id(full_name, username, avatar_url)"
    )
    .eq(column, user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: orders || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listing_id, payment_method, delivery_method, delivery_address, notes } =
    await req.json();

  if (!listing_id) {
    return NextResponse.json(
      { error: "Listing ID is required" },
      { status: 400 }
    );
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, price, title")
    .eq("id", listing_id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json(
      { error: "Cannot order your own listing" },
      { status: 400 }
    );
  }

  const reference = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  if (payment_method === "wallet") {
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!wallet || wallet.balance < listing.price) {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    const newBalance = wallet.balance - listing.price;
    await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: listing.price,
      balance_before: wallet.balance,
      balance_after: newBalance,
      status: "success",
      reference,
      description: `Purchase: ${listing.title}`,
      metadata: { listing_id, order_reference: reference },
    });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      buyer_id: user.id,
      seller_id: listing.seller_id,
      listing_id,
      amount: listing.price,
      payment_method: payment_method || "wallet",
      delivery_method: delivery_method || "meetup",
      delivery_address: delivery_address || null,
      notes: notes || null,
      reference,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: buyerProfile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .single();

  await supabase.from("notifications").insert({
    user_id: listing.seller_id,
    type: "product_sold",
    title: "New Order Received",
    message: `@${buyerProfile?.username || "Someone"} ordered "${listing.title}"`,
    metadata: { order_id: order.id, listing_id, amount: listing.price },
  });

  return NextResponse.json({ order, reference });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { order_id, status } = await req.json();

  if (!order_id || !status) {
    return NextResponse.json(
      { error: "order_id and status are required" },
      { status: 400 }
    );
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", order_id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.seller_id !== user.id && order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", order_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (status === "completed" && order.payment_method === "wallet") {
    const { data: sellerWallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", order.seller_id)
      .single();

    if (sellerWallet) {
      const newBalance = sellerWallet.balance + order.amount;
      await supabase
        .from("wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", order.seller_id);

      await supabase.from("wallet_transactions").insert({
        user_id: order.seller_id,
        type: "deposit",
        amount: order.amount,
        balance_before: sellerWallet.balance,
        balance_after: newBalance,
        status: "success",
        reference: order.reference,
        description: `Sale completed: Order ${order.reference}`,
        metadata: { order_id, listing_id: order.listing_id },
      });
    }
  }

  return NextResponse.json({ success: true, status });
}
