import "server-only";

const SANDBOX_URL = "https://sandbox.safaricom.co.ke";
const PRODUCTION_URL = "https://api.safaricom.co.ke";

export function darajaBaseUrl() {
  return process.env.DARAJA_ENV === "production" ? PRODUCTION_URL : SANDBOX_URL;
}

export function isDarajaConfigured() {
  return Boolean(
    process.env.DARAJA_CONSUMER_KEY &&
      process.env.DARAJA_CONSUMER_SECRET &&
      process.env.DARAJA_SHORTCODE &&
      process.env.DARAJA_PASSKEY,
  );
}

export function normalizeMsisdn(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

export function mpesaTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

async function darajaFetch(pathname, options = {}) {
  const response = await fetch(`${darajaBaseUrl()}${pathname}`, {
    ...options,
    cache: "no-store",
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.errorMessage || data?.error_description || data?.ResponseDescription || response.statusText;
    throw new Error(`Daraja request failed (${response.status}): ${message}`);
  }

  return data;
}

async function getAccessToken() {
  if (!isDarajaConfigured()) {
    throw new Error("M-PESA is not configured on this server.");
  }

  const credentials = Buffer.from(
    `${process.env.DARAJA_CONSUMER_KEY}:${process.env.DARAJA_CONSUMER_SECRET}`,
  ).toString("base64");

  const data = await darajaFetch("/oauth/v1/generate?grant_type=client_credentials", {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!data.access_token) throw new Error("M-PESA access token was not returned.");
  return data.access_token;
}

export async function initiateStkPush({
  phone,
  amount,
  accountReference,
  description = "MIX order payment",
  callbackUrl,
}) {
  const token = await getAccessToken();
  const timestamp = mpesaTimestamp();
  const shortcode = process.env.DARAJA_SHORTCODE;
  const password = Buffer.from(
    `${shortcode}${process.env.DARAJA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(Number(amount)),
    PartyA: normalizeMsisdn(phone),
    PartyB: shortcode,
    PhoneNumber: normalizeMsisdn(phone),
    CallBackURL: callbackUrl || process.env.DARAJA_CALLBACK_URL,
    AccountReference: accountReference.slice(0, 12),
    TransactionDesc: description.slice(0, 60),
  };

  return darajaFetch("/mpesa/stkpush/v1/processrequest", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function queryStkStatus(checkoutRequestId) {
  const token = await getAccessToken();
  const timestamp = mpesaTimestamp();
  const shortcode = process.env.DARAJA_SHORTCODE;
  const password = Buffer.from(
    `${shortcode}${process.env.DARAJA_PASSKEY}${timestamp}`,
  ).toString("base64");

  return darajaFetch("/mpesa/stkpushquery/v1/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });
}

/**
 * Daraja does not sign callbacks with a shared secret. We validate them by
 * matching the CheckoutRequestID to a payment we initiated and verifying the
 * amount and receipt. Optionally restrict source IPs in production.
 */
export function isAllowedCallbackSource(headers) {
  const allowed = (process.env.DARAJA_ALLOWED_IPS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (allowed.length === 0) return true;

  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : headers.get("x-real-ip");
  return Boolean(ip && allowed.includes(ip));
}
