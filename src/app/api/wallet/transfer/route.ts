import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipient_username, amount, note } = await req.json();

  if (!recipient_username || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "Recipient username and valid amount are required" },
      { status: 400 }
    );
  }

  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("id, full_name, username")
    .eq("username", recipient_username)
    .single();

  if (!recipientProfile) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  if (recipientProfile.id === user.id) {
    return NextResponse.json(
      { error: "Cannot transfer to yourself" },
      { status: 400 }
    );
  }

  const { data: senderWallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!senderWallet || senderWallet.balance < amount) {
    return NextResponse.json(
      { error: "Insufficient wallet balance" },
      { status: 400 }
    );
  }

  const { data: recipientWallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", recipientProfile.id)
    .single();

  if (!recipientWallet) {
    return NextResponse.json(
      { error: "Recipient wallet not found" },
      { status: 400 }
    );
  }

  const reference = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const senderNewBalance = senderWallet.balance - amount;
  const recipientNewBalance = recipientWallet.balance + amount;

  const { error: senderUpdateError } = await supabase
    .from("wallets")
    .update({ balance: senderNewBalance, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (senderUpdateError) {
    return NextResponse.json(
      { error: "Transfer failed" },
      { status: 500 }
    );
  }

  await supabase
    .from("wallets")
    .update({
      balance: recipientNewBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", recipientProfile.id);

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .single();

  await supabase.from("wallet_transactions").insert([
    {
      user_id: user.id,
      type: "transfer",
      amount,
      balance_before: senderWallet.balance,
      balance_after: senderNewBalance,
      status: "success",
      reference,
      description: `Transfer to @${recipientProfile.username}${note ? ": " + note : ""}`,
      metadata: { recipient_id: recipientProfile.id, note },
    },
    {
      user_id: recipientProfile.id,
      type: "deposit",
      amount,
      balance_before: recipientWallet.balance,
      balance_after: recipientNewBalance,
      status: "success",
      reference,
      description: `Received from @${senderProfile?.username || "user"}${note ? ": " + note : ""}`,
      metadata: { sender_id: user.id, note },
    },
  ]);

  await supabase.from("notifications").insert([
    {
      user_id: user.id,
      type: "transfer_sent",
      title: "Transfer Sent",
      message: `You sent ₦${amount.toLocaleString()} to @${recipientProfile.username}`,
      metadata: { amount, recipient: recipientProfile.username, reference },
    },
    {
      user_id: recipientProfile.id,
      type: "transfer_received",
      title: "Money Received",
      message: `@${senderProfile?.username || "Someone"} sent you ₦${amount.toLocaleString()}`,
      metadata: {
        amount,
        sender: senderProfile?.username,
        reference,
      },
    },
  ]);

  return NextResponse.json({
    success: true,
    reference,
    new_balance: senderNewBalance,
    recipient: recipientProfile.full_name,
  });
}
