import axios from "axios";

// PesaPal API base URL
const PESAPAL_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://pay.pesapal.com/v3/api"
    : "https://cybqa.pesapal.com/pesapalv3/api";

// PesaPal credentials
const CONSUMER_KEY = "k9EjadZje6IwRXWeINaUsbgcSTSYKBkC";
const CONSUMER_SECRET = "SYszBnJxaPht0NCWcROxpn4D7CU=";

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn("Warning: PesaPal credentials not configured");
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

// Get PesaPal access token
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

// Order data interface
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

// PesaPal order response interface
export interface PesaPalOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: any;
  status: string;
}

// Create a payment order
export async function createOrder(orderData: CreateOrderData): Promise<PesaPalOrderResponse> {
  const token = await getAccessToken();

  const orderPayload = {
    id: orderData.id,
    currency: "USD",
    amount: orderData.amount,
    description: orderData.description,
    callback_url: orderData.callbackUrl,
    notification_id: process.env.PESAPAL_IPN_ID || "",
    payment_method: "CARD",
    billing_address: {
      email_address: orderData.email,
      phone_number: orderData.phone,
      country_code: "US", // replace with actual country code if needed
      first_name: orderData.firstName,
      last_name: orderData.lastName,
      line_1: "N/A",
      city: "N/A",
      state: "N/A",
      postal_code: "N/A",
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

    // Normalize redirect URL
    const redirect_url = response.data?.redirect_url || response.data?.RedirectURL || null;
    if (!redirect_url) {
      console.warn("PesaPal response without redirect_url:", response.data);
      throw new Error("No redirect URL returned from PesaPal");
    }

    return {
      order_tracking_id: response.data.order_tracking_id,
      merchant_reference: response.data.merchant_reference,
      redirect_url,
      status: response.data.status,
      error: response.data.error,
    };
  } catch (error: any) {
    console.error("PesaPal create order error:", error.response?.data || error.message);
    throw new Error("Failed to create payment order");
  }
}

// Transaction status interface
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

// Get transaction status
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

