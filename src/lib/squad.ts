import crypto from "crypto";

const SQUAD_API_URL =
  process.env.SQUAD_API_URL || "https://sandbox-api-d.squadco.com";
const SQUAD_SECRET_KEY = process.env.SQUAD_SECRET_KEY || "";

export async function initiateSquadPayment(params: {
  email: string;
  amount: number;
  currency?: string;
  transaction_ref: string;
  customer_name?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`${SQUAD_API_URL}/transaction/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SQUAD_SECRET_KEY}`,
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount * 100,
      currency: params.currency || "NGN",
      initiate_type: "inline",
      transaction_ref: params.transaction_ref,
      customer_name: params.customer_name,
      callback_url: params.callback_url,
      metadata: params.metadata,
      payment_channels: ["bank"],
    }),
  });

  return response.json();
}

export async function verifySquadTransaction(transactionRef: string) {
  const response = await fetch(
    `${SQUAD_API_URL}/transaction/verify/${transactionRef}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SQUAD_SECRET_KEY}`,
      },
    }
  );

  return response.json();
}

export function validateSquadWebhook(
  body: string,
  encryptedBody: string
): boolean {
  if (!SQUAD_SECRET_KEY) return false;

  const hash = crypto
    .createHmac("sha512", SQUAD_SECRET_KEY)
    .update(body)
    .digest("hex")
    .toUpperCase();

  return hash === encryptedBody.toUpperCase();
}
