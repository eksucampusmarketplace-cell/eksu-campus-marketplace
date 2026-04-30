import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySquadTransaction } from "@/lib/squad";

function generateTxHash(ref: string, amount: number, channel: string): string {
  const data = `${ref}:${amount}:${channel}:${Date.now()}`;
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reference } = await request.json();

  if (!reference) {
    return NextResponse.json(
      { error: "Missing reference" },
      { status: 400 }
    );
  }

  const { data: paymentTx } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("payment_reference", reference)
    .eq("user_id", user.id)
    .single();

  if (!paymentTx) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  if (paymentTx.status === "success") {
    return NextResponse.json({
      success: true,
      status: "success",
      message: "Payment already confirmed",
      reference: paymentTx.payment_reference,
    });
  }

  if (!process.env.SQUAD_SECRET_KEY) {
    return NextResponse.json({
      success: false,
      status: paymentTx.status,
      message: "Squad API not configured for verification",
    });
  }

  try {
    const verification = await verifySquadTransaction(reference);

    if (
      verification?.data?.transaction_status === "success" &&
      paymentTx.status !== "success"
    ) {
      const depositAmount =
        (verification.data.merchant_amount ||
          verification.data.transaction_amount) / 100;

      const channel = verification.data.channel || "bank_transfer";
      const squadRef = verification.data.gateway_ref ||
        verification.data.transaction_ref || reference;
      const txHash = generateTxHash(reference, depositAmount, channel);

      await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          squad_transaction_ref: squadRef,
          payment_channel: channel,
          gateway_response: {
            ...verification.data,
            tx_hash: txHash,
            verified_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("payment_reference", reference);

      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + depositAmount;

      await supabase
        .from("wallets")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      const walletRef = `WD-${reference}`;

      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: depositAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        status: "success",
        reference: walletRef,
        description: `Wallet deposit via ${channel}`,
        metadata: {
          payment_reference: reference,
          squad_ref: squadRef,
          channel,
          tx_hash: txHash,
        },
      });

      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "wallet_credit",
        title: "Wallet Funded",
        message: `Your wallet has been credited with ₦${depositAmount.toLocaleString()} via ${channel}. Ref: ${walletRef}`,
        metadata: {
          amount: depositAmount,
          reference: walletRef,
          tx_hash: txHash,
          channel,
        },
      });

      return NextResponse.json({
        success: true,
        status: "success",
        message: "Payment verified and wallet credited",
        reference: walletRef,
        tx_hash: txHash,
      });
    }

    return NextResponse.json({
      success: false,
      status: verification?.data?.transaction_status || "pending",
      message: "Payment not yet confirmed",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Verification failed", details: String(err) },
      { status: 500 }
    );
  }
}
