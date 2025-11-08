// pesapal-client.ts
// Simple, safe PesaPal client (TypeScript)
// Copy-paste this file. Fill environment variables before running.

import axios, { AxiosError } from "axios";

/**
 * Configuration -- use environment variables.
 * - Set these in your hosting environment or a .env file (do NOT commit secrets).
 */
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || "";
// Dormant placeholder for the IPN ID (leave empty for now; fill later after you register IPN)
const PESAPAL_IPN_ID = process.env.PESAPAL_IPN_ID || ""; // <-- dormant by default

const PESAPAL_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://pay.pesapal.com/v3/api"
    : "https://cybqa.pesapal.com/pesapalv3/api";

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn("[PesaPal] Warning: consumer key/secret not set in environment variables.");
}

// Simple token cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/** Get and cache access token */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const resp = await axios.post(
      `${PESAPAL_BASE_URL}/Auth/RequestToken`,
      {
        consumer_key: CONSUMER_KEY,
        consumer_secret: CONSUMER_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const data = resp.data || {};
    const token = data.token;
    const expiryInSeconds = data.expiry_in_seconds || 600; // fallback 10 minutes

    if (!token) {
      throw new Error("No token returned from PesaPal");
    }

    cachedToken = token;
    tokenExpiry = Date.now() + expiryInSeconds * 1000;
    return token;
  } catch (err) {
    const e = err as AxiosError;
    console.error("[PesaPal] Authentication error:", e.response?.data ?? e.message);
    throw new Error("Failed to authenticate with PesaPal");
  }
}

/** Order input */
export interface CreateOrderData {
  id: string;
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  description: string;
  callbackUrl: string;
  currency?: string; // optional, default USD
  countryCode?: string; // optional, default US
}

/** Order response */
export interface PesaPalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status: string;
  error?: any;
}

/** Create a payment order */
export async function createOrder(orderData: CreateOrderData): Promise<PesaPalOrderResponse> {
  const token = await getAccessToken();

  const payload = {
    id: orderData.id,
    currency: orderData.currency || "USD",
    amount: orderData.amount,
    description: orderData.description,
    callback_url: orderData.callbackUrl,
    notification_id: PESAPAL_IPN_ID, // dormant (empty) until you register and fill it
    payment_method: "CARD",
    billing_address: {
      email_address: orderData.email,
      phone_number: orderData.phone,
      country_code: orderData.countryCode || "US",
      first_name: orderData.firstName,
      last_name: orderData.lastName,
      line_1: "N/A",
      city: "N/A",
      state: "N/A",
      postal_code: "N/A",
    },
  };

  try {
    const resp = await axios.post(`${PESAPAL_BASE_URL}/Transactions/SubmitOrderRequest`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = resp.data || {};
    const redirect_url = data.redirect_url || data.RedirectURL || null;

    if (!redirect_url) {
      console.warn("[PesaPal] createOrder: no redirect_url in response", data);
      throw new Error("No redirect URL returned from PesaPal");
    }

    return {
      order_tracking_id: data.order_tracking_id,
      merchant_reference: data.merchant_reference,
      redirect_url,
      status: data.status,
      error: data.error,
    };
  } catch (err) {
    const e = err as AxiosError;
    console.error("[PesaPal] createOrder error:", e.response?.data ?? e.message);
    throw new Error("Failed to create payment order");
  }
}

/** Transaction status type (partial) */
export interface TransactionStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: string;
  merchant_reference: string;
  currency: string;
  [key: string]: any;
}

/** Get transaction status by orderTrackingId */
export async function getTransactionStatus(orderTrackingId: string): Promise<TransactionStatus> {
  const token = await getAccessToken();

  try {
    const resp = await axios.get(
      `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
        orderTrackingId
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return resp.data;
  } catch (err) {
    const e = err as AxiosError;
    console.error("[PesaPal] getTransactionStatus error:", e.response?.data ?? e.message);
    throw new Error("Failed to get transaction status");
  }
}

/* -------------------------
  Minimal usage example:

  (1) Set environment vars:
      PESAPAL_CONSUMER_KEY=yourkey
      PESAPAL_CONSUMER_SECRET=yoursecret
      (PESAPAL_IPN_ID left blank for now)

  (2) Call createOrder(...) and redirect user to the returned redirect_url.

  We will register the IPN and fill PESAPAL_IPN_ID later — one step at a time.
------------------------- */


