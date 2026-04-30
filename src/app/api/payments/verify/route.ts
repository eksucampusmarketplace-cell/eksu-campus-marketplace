import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySquadTransaction } from "@/lib/squad";

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

      await supabase
        .from("payment_transactions")
        .update({
          status: "success",
          squad_transaction_ref:
            verification.data.transaction_ref || reference,
          payment_channel: verification.data.channel,
          gateway_response: verification.data,
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

      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: depositAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        status: "success",
        reference: `WD-${reference}`,
        description: `Wallet deposit via ${verification.data.channel || "Squad"}`,
        metadata: { payment_reference: reference },
      });

      return NextResponse.json({
        success: true,
        status: "success",
        message: "Payment verified and wallet credited",
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
