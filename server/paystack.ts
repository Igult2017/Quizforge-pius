import axios, { AxiosError } from "axios";

/**
 * Paystack client for card payments (USA, Europe, Australia only)
 * Excludes African countries per requirements
 */

const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

if (!SECRET_KEY) {
  console.warn("[Paystack] Warning: PAYSTACK_SECRET_KEY not set in environment variables.");
}

// Countries allowed for payment: USA, European countries, Australia
const ALLOWED_COUNTRIES = [
  "US", // United States
  "GB", // United Kingdom
  "IE", // Ireland
  "FR", // France
  "DE", // Germany
  "IT", // Italy
  "ES", // Spain
  "NL", // Netherlands
  "BE", // Belgium
  "AT", // Austria
  "CH", // Switzerland
  "SE", // Sweden
  "NO", // Norway
  "DK", // Denmark
  "FI", // Finland
  "PL", // Poland
  "CZ", // Czech Republic
  "GR", // Greece
  "PT", // Portugal
  "HU", // Hungary
  "RO", // Romania
  "BG", // Bulgaria
  "HR", // Croatia
  "SI", // Slovenia
  "SK", // Slovakia
  "LV", // Latvia
  "LT", // Lithuania
  "EE", // Estonia
  "MT", // Malta
  "CY", // Cyprus
  "LU", // Luxembourg
  "AU", // Australia
  "NZ", // New Zealand (bonus)
  "CA", // Canada (bonus)
];

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    paidAt: string;
    status: string;
    customer: {
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
    };
    metadata: any;
  };
}

/**
 * Validate if country code is allowed for payment
 */
export function isCountryAllowed(countryCode: string): boolean {
  return ALLOWED_COUNTRIES.includes(countryCode.toUpperCase());
}

/**
 * Initialize a payment with Paystack
 */
export async function initializePayment(data: {
  email: string;
  amount: number; // in cents (Paystack expects kobo/cents)
  firstName: string;
  lastName: string;
  phone?: string;
  merchantReference: string;
  countryCode: string;
}): Promise<PaystackInitializeResponse> {
  // Validate country code
  if (!isCountryAllowed(data.countryCode)) {
    throw new Error(
      `Country code ${data.countryCode} is not allowed. Only USA, European countries, Australia, Canada, and New Zealand are supported.`
    );
  }

  try {
    const payload = {
      email: data.email,
      amount: data.amount, // Already in cents
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || "",
      metadata: {
        merchant_reference: data.merchantReference,
        country_code: data.countryCode,
      },
    };

    console.log("[Paystack] Initializing payment:", {
      email: data.email,
      amount: data.amount,
      reference: data.merchantReference,
    });

    const response = await axios.post<PaystackInitializeResponse>(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.status) {
      throw new Error(response.data.message || "Failed to initialize payment");
    }

    console.log("[Paystack] Payment initialized successfully:", response.data.data.reference);
    return response.data;
  } catch (error) {
    const e = error as AxiosError;
    console.error("[Paystack] Initialize payment error:", e.response?.data ?? e.message);
    throw new Error("Failed to initialize Paystack payment");
  }
}

/**
 * Verify a payment with Paystack
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  try {
    console.log("[Paystack] Verifying payment with reference:", reference);

    const response = await axios.get<PaystackVerifyResponse>(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.status) {
      throw new Error(response.data.message || "Payment verification failed");
    }

    console.log("[Paystack] Payment verified successfully:", reference);
    return response.data;
  } catch (error) {
    const e = error as AxiosError;
    console.error("[Paystack] Verify payment error:", e.response?.data ?? e.message);
    throw new Error("Failed to verify Paystack payment");
  }
}
