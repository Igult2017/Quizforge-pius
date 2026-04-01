import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Payment processing is not configured. Please set STRIPE_SECRET_KEY."
    );
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia",
    });
  }
  return _stripe;
}

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
  amountCents: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

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
  const stripe = getStripe();
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
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set. Webhook verification disabled."
    );
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
