// pesapal-client.ts
// PesaPal client for international card payments (TypeScript)

import axios, { AxiosError } from "axios";

/**
 * Configuration -- use environment variables.
 */
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || "";
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || "";

const PESAPAL_BASE_URL = "https://pay.pesapal.com/v3";

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn("[PesaPal] Warning: consumer key/secret not set in environment variables.");
}

// Simple token cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

// IPN cache
let cachedIpnId: string | null = null;

/** Get and cache access token */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const resp = await axios.post(
      `${PESAPAL_BASE_URL}/api/Auth/RequestToken`,
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
    const expiryInSeconds = data.expiryDate || 600; // fallback 10 minutes

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

/** Register or get existing IPN (Instant Payment Notification) */
export async function registerIPN(callbackUrl: string): Promise<string> {
  // Return cached IPN if available
  if (cachedIpnId) {
    return cachedIpnId;
  }

  const token = await getAccessToken();

  try {
    // Check for existing IPNs
    const listResp = await axios.get(
      `${PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    // If we find an existing IPN with our callback URL, use it
    const ipns = listResp.data || [];
    for (const ipn of ipns) {
      if (ipn.url === callbackUrl) {
        console.log(`[PesaPal] Using existing IPN: ${ipn.ipn_id}`);
        cachedIpnId = ipn.ipn_id;
        return ipn.ipn_id;
      }
    }

    // Register new IPN
    const registerResp = await axios.post(
      `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
      {
        url: callbackUrl,
        ipn_notification_type: "GET",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const ipnId = registerResp.data?.ipn_id;
    if (!ipnId) {
      throw new Error("No IPN ID returned from PesaPal");
    }

    console.log(`[PesaPal] Registered new IPN: ${ipnId}`);
    cachedIpnId = ipnId;
    return ipnId;
  } catch (err) {
    const e = err as AxiosError;
    console.error("[PesaPal] IPN registration error:", e.response?.data ?? e.message);
    throw new Error("Failed to register IPN with PesaPal");
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

  // Register IPN dynamically
  const ipnId = await registerIPN(orderData.callbackUrl);

  const payload = {
    id: orderData.id,
    currency: orderData.currency || "USD",
    amount: orderData.amount,
    description: orderData.description,
    callback_url: orderData.callbackUrl,
    notification_id: ipnId,
    payment_methods: ["CARD"],
    billing_address: {
      email_address: orderData.email,
      phone_number: orderData.phone,
      country_code: orderData.countryCode || "US",
      first_name: orderData.firstName,
      last_name: orderData.lastName,
    },
  };

  try {
    const resp = await axios.post(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, payload, {
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
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(
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


