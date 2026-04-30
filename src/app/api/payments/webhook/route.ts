import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSquadWebhook } from "@/lib/squad";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const encryptedBody =
    request.headers.get("x-squad-encrypted-body") || "";

  if (process.env.SQUAD_SECRET_KEY && encryptedBody) {
    const isValid = validateSquadWebhook(rawBody, encryptedBody);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  const payload = JSON.parse(rawBody);

  const {
    transaction_ref,
    transaction_status,
    amount,
    transaction_type,
    merchant_amount,
    channel,
  } = payload;

  if (!transaction_ref) {
    return NextResponse.json(
      { error: "Missing transaction reference" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: paymentTx } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("payment_reference", transaction_ref)
    .single();

  if (!paymentTx) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  if (paymentTx.status === "success") {
    return NextResponse.json({ message: "Already processed" });
  }

  const status =
    transaction_status === "success" ? "success" : "failed";

  await supabase
    .from("payment_transactions")
    .update({
      status,
      squad_transaction_ref: transaction_ref,
      payment_channel: channel || transaction_type,
      gateway_response: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("payment_reference", transaction_ref);

  if (status === "success") {
    const depositAmount = merchant_amount
      ? merchant_amount / 100
      : amount / 100;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", paymentTx.user_id)
      .single();

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + depositAmount;

    await supabase
      .from("wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", paymentTx.user_id);

    await supabase.from("wallet_transactions").insert({
      user_id: paymentTx.user_id,
      type: "deposit",
      amount: depositAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      status: "success",
      reference: `WD-${transaction_ref}`,
      description: `Wallet deposit via ${channel || "Squad"}`,
      metadata: { payment_reference: transaction_ref, channel },
    });
  }

  return NextResponse.json({ message: "Webhook processed", status });
}
