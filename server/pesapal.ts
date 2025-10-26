import axios from "axios";

const PESAPAL_BASE_URL = process.env.NODE_ENV === "production"
  ? "https://pay.pesapal.com/v3/api"
  : "https://cybqa.pesapal.com/pesapalv3/api";

const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn("Warning: PesaPal credentials not configured");
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && tokenExpiry && tokenExpiry > Date.now()) {
    return cachedToken;
  }

  try {
    const response = await axios.post(
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

    const token = response.data.token;
    if (!token) {
      throw new Error("No token returned from PesaPal");
    }
    
    cachedToken = token;
    tokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    return token;
  } catch (error: any) {
    console.error("PesaPal authentication error:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with PesaPal");
  }
}

export interface CreateOrderData {
  id: string; // merchant reference (unique order ID)
  amount: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  description: string;
  callbackUrl: string;
}

export interface PesaPalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: any;
  status: string;
}

export async function createOrder(orderData: CreateOrderData): Promise<PesaPalOrderResponse> {
  const token = await getAccessToken();

  const orderPayload = {
    id: orderData.id,
    currency: "USD", // US Dollars for international clients
    amount: orderData.amount,
    description: orderData.description,
    callback_url: orderData.callbackUrl,
    notification_id: process.env.PESAPAL_IPN_ID || "",
    payment_method: "CARD", // Card-only payments
    billing_address: {
      email_address: orderData.email,
      phone_number: orderData.phone,
      country_code: "",
      first_name: orderData.firstName,
      last_name: orderData.lastName,
      line_1: "",
      city: "",
      state: "",
      postal_code: "",
    },
  };

  try {
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/Transactions/SubmitOrderRequest`,
      orderPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    // Check for redirect_url (can be redirect_url or RedirectURL)
    const redirect_url = response.data?.redirect_url || response.data?.RedirectURL || null;
    if (!redirect_url) {
      console.warn("PesaPal response without redirect_url:", response.data);
      throw new Error("No redirect URL returned from PesaPal");
    }

    return response.data;
  } catch (error: any) {
    console.error("PesaPal create order error:", error.response?.data || error.message);
    throw new Error("Failed to create payment order");
  }
}

export interface TransactionStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_back_url: string;
  status_code: number;
  merchant_reference: string;
  account_number: string;
  payment_status_code: string;
  currency: string;
}

export async function getTransactionStatus(orderTrackingId: string): Promise<TransactionStatus> {
  const token = await getAccessToken();

  try {
    const response = await axios.get(
      `${PESAPAL_BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("PesaPal transaction status error:", error.response?.data || error.message);
    throw new Error("Failed to get transaction status");
  }
}
