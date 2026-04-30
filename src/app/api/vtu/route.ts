import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, provider, phone_number, amount, reference } = body;

  const INLOMAX_API_KEY = process.env.INLOMAX_API_KEY;
  const INLOMAX_API_URL = process.env.INLOMAX_API_URL || "https://inlomax.com.ng/api";

  if (!INLOMAX_API_KEY) {
    // Save transaction as pending when API key isn't configured
    const { data, error } = await supabase.from("vtu_transactions").insert({
      user_id: user.id,
      type,
      provider,
      phone_number,
      amount,
      reference,
      status: "pending",
      api_response: { message: "Inlomax API key not configured" },
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Transaction saved. VTU processing will be enabled once API key is configured.",
      transaction: data,
    });
  }

  // Insert transaction as pending before calling external API
  const { error: insertError } = await supabase.from("vtu_transactions").insert({
    user_id: user.id,
    type,
    provider,
    phone_number,
    amount,
    reference,
    status: "pending",
    api_response: { message: "Processing via Inlomax API" },
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Inlomax API integration
  try {
    const apiResponse = await fetch(`${INLOMAX_API_URL}/${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INLOMAX_API_KEY}`,
      },
      body: JSON.stringify({
        network: provider,
        phone: phone_number,
        amount,
        request_id: reference,
      }),
    });

    const apiData = await apiResponse.json();

    const status = apiResponse.ok ? "success" : "failed";

    await supabase
      .from("vtu_transactions")
      .update({
        status,
        api_response: apiData,
      })
      .eq("reference", reference);

    return NextResponse.json({
      success: apiResponse.ok,
      message: apiResponse.ok ? "Transaction successful" : "Transaction failed",
      data: apiData,
    });
  } catch (err) {
    await supabase
      .from("vtu_transactions")
      .update({
        status: "failed",
        api_response: { error: String(err) },
      })
      .eq("reference", reference);

    return NextResponse.json(
      { error: "Failed to process VTU transaction" },
      { status: 500 }
    );
  }
}
