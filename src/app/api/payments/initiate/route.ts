import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateSquadPayment } from "@/lib/squad";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { amount } = body;

  if (!amount || amount < 100) {
    return NextResponse.json(
      { error: "Minimum deposit is NGN 100" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const reference = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const { error: insertError } = await supabase
    .from("payment_transactions")
    .insert({
      user_id: user.id,
      amount,
      currency: "NGN",
      status: "pending",
      payment_reference: reference,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY;

  if (!SQUAD_SECRET_KEY) {
    return NextResponse.json({
      success: true,
      message:
        "Payment record saved. Squad API key not configured — configure SQUAD_SECRET_KEY to enable live payments.",
      reference,
      checkout_url: null,
    });
  }

  try {
    const squadResponse = await initiateSquadPayment({
      email: profile?.email || user.email || "",
      amount,
      transaction_ref: reference,
      customer_name: profile?.full_name || undefined,
      callback_url: `${request.headers.get("origin") || ""}/wallet?payment=success`,
      metadata: {
        user_id: user.id,
        type: "wallet_deposit",
      },
    });

    if (squadResponse?.data?.checkout_url) {
      return NextResponse.json({
        success: true,
        checkout_url: squadResponse.data.checkout_url,
        reference,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment initiated",
      reference,
      squad_response: squadResponse,
    });
  } catch (err) {
    await supabase
      .from("payment_transactions")
      .update({
        status: "failed",
        gateway_response: { error: String(err) },
      })
      .eq("payment_reference", reference);

    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
