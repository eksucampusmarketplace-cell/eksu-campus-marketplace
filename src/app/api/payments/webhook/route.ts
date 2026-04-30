import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSquadWebhook } from "@/lib/squad";

function generateTransactionHash(payload: Record<string, unknown>): string {
  const data = JSON.stringify({
    ref: payload.transaction_ref,
    amount: payload.amount,
    status: payload.transaction_status,
    ts: payload.created_at || payload.transaction_date,
  });
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

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
    gateway_ref,
    merchant_ref,
  } = payload;

  if (!transaction_ref) {
    return NextResponse.json(
      { error: "Missing transaction reference" },
      { status: 400 }
    );
  }

  const txHash = generateTransactionHash(payload);

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
      squad_transaction_ref: gateway_ref || merchant_ref || transaction_ref,
      payment_channel: channel || transaction_type || "bank_transfer",
      gateway_response: {
        ...payload,
        tx_hash: txHash,
        processed_at: new Date().toISOString(),
      },
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

    const walletRef = `WD-${transaction_ref}`;

    await supabase.from("wallet_transactions").insert({
      user_id: paymentTx.user_id,
      type: "deposit",
      amount: depositAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      status: "success",
      reference: walletRef,
      description: `Wallet deposit via ${channel || "bank transfer"}`,
      metadata: {
        payment_reference: transaction_ref,
        squad_ref: gateway_ref || merchant_ref || null,
        channel: channel || "bank_transfer",
        tx_hash: txHash,
      },
    });

    await supabase.from("notifications").insert({
      user_id: paymentTx.user_id,
      type: "wallet_credit",
      title: "Wallet Funded",
      message: `Your wallet has been credited with ₦${depositAmount.toLocaleString()} via bank transfer. Ref: ${walletRef}`,
      metadata: {
        amount: depositAmount,
        reference: walletRef,
        tx_hash: txHash,
        channel: channel || "bank_transfer",
      },
    });
  } else {
    await supabase.from("notifications").insert({
      user_id: paymentTx.user_id,
      type: "system",
      title: "Payment Failed",
      message: `Your deposit of ₦${((amount || 0) / 100).toLocaleString()} was not successful. Ref: ${transaction_ref}`,
      metadata: {
        reference: transaction_ref,
        tx_hash: txHash,
        reason: payload.error_message || "Payment was not completed",
      },
    });
  }

  return NextResponse.json({ message: "Webhook processed", status, tx_hash: txHash });
}
