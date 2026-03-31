import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error(
    "[Stripe] ERROR: STRIPE_SECRET_KEY is not set. Payment processing will fail!"
  );
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia",
});

const PLAN_NAMES: Record<string, string> = {
  weekly: "NurseBrace Weekly Plan",
  monthly: "NurseBrace Monthly Plan",
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  weekly: "7-day full access to NurseBrace exam prep platform",
  monthly: "30-day full access to NurseBrace exam prep platform",
};

/**
 * Create a Stripe Checkout Session (hosted payment page).
 * Returns the session object; use session.url to redirect the customer.
 */
export async function createCheckoutSession(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  merchantReference: string;
  plan: string;
  amountCents: number; // e.g. 1999 for $19.99
  currency: string;   // e.g. "USD"
  successUrl: string; // must contain {CHECKOUT_SESSION_ID} or ?session_id=...
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Payment processing is not configured. Please set STRIPE_SECRET_KEY."
    );
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: data.email,
    line_items: [
      {
        price_data: {
          currency: data.currency.toLowerCase(),
          product_data: {
            name: PLAN_NAMES[data.plan] || `NurseBrace ${data.plan} Plan`,
            description:
              PLAN_DESCRIPTIONS[data.plan] ||
              "Full access to NurseBrace exam prep platform",
          },
          unit_amount: data.amountCents,
        },
        quantity: 1,
      },
    ],
    // Store our internal reference and customer info in metadata
    metadata: {
      merchant_reference: data.merchantReference,
      plan: data.plan,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone || "",
    },
    success_url: data.successUrl,
    cancel_url: data.cancelUrl,
  });

  console.log("[Stripe] Checkout session created:", session.id);
  return session;
}

/**
 * Retrieve a Checkout Session by its ID, expanding the payment_intent.
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  return session;
}

/**
 * Verify and construct a Stripe webhook event from raw body + signature header.
 * Throws if the signature is invalid.
 */
export function constructWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Webhook verification disabled."
    );
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
