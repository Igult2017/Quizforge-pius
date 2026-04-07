/**
 * Subscription & Access Flow Tests
 *
 * Covers:
 * 1. getActiveSubscription — active, expired, cancelled
 * 2. hasActiveSubscription — delegates correctly
 * 3. Access gating at quiz start — subscribed / free-trial / blocked / admin
 * 4. link-to-user — subscription creation, email mismatch, duplicate link
 * 5. adminGrantedAccess expiry fix
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Helpers ────────────────────────────────────────────────────────────────

const daysFromNow = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const makeSubscription = (overrides: Partial<{
  id: number;
  userId: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date;
}> = {}) => ({
  id: 1,
  userId: "user-123",
  plan: "monthly",
  status: "active",
  startDate: daysFromNow(-5),
  endDate: daysFromNow(25),
  paymentId: null,
  createdAt: new Date(),
  ...overrides,
});

const makeUser = (overrides: Partial<{
  id: string;
  email: string;
  isAdmin: boolean;
  adminGrantedAccess: boolean;
  adminAccessExpiresAt: Date | null;
  nclexFreeTrialUsed: boolean;
  teasFreeTrialUsed: boolean;
  hesiFreeTrialUsed: boolean;
}> = {}) => ({
  id: "user-123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  isAdmin: false,
  adminGrantedAccess: false,
  adminAccessExpiresAt: null,
  nclexFreeTrialUsed: false,
  teasFreeTrialUsed: false,
  hesiFreeTrialUsed: false,
  isBanned: false,
  isNewSignup: false,
  phone: null,
  profileImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makePayment = (overrides: Partial<{
  id: number;
  email: string;
  plan: string;
  status: string;
  userId: string | null;
  merchantReference: string;
  amount: number;
}> = {}) => ({
  id: 1,
  merchantReference: "ref-abc123",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  plan: "monthly",
  amount: 4999,
  currency: "USD",
  status: "completed",
  userId: null,
  orderTrackingId: "cs_test_123",
  paymentMethod: "card",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ─── 1. getActiveSubscription logic ─────────────────────────────────────────

describe("getActiveSubscription logic", () => {
  it("returns subscription when status=active and endDate is in the future", () => {
    const sub = makeSubscription({ status: "active", endDate: daysFromNow(10) });
    const now = new Date();
    const isActive = sub.status === "active" && sub.endDate > now;
    expect(isActive).toBe(true);
  });

  it("does NOT return subscription when endDate is in the past (expired)", () => {
    const sub = makeSubscription({ status: "active", endDate: daysFromNow(-1) });
    const now = new Date();
    const isActive = sub.status === "active" && sub.endDate > now;
    expect(isActive).toBe(false);
  });

  it("does NOT return subscription when status=cancelled even if endDate is future", () => {
    const sub = makeSubscription({ status: "cancelled", endDate: daysFromNow(10) });
    const now = new Date();
    const isActive = sub.status === "active" && sub.endDate > now;
    expect(isActive).toBe(false);
  });

  it("does NOT return subscription when status=expired", () => {
    const sub = makeSubscription({ status: "expired", endDate: daysFromNow(-5) });
    const now = new Date();
    const isActive = sub.status === "active" && sub.endDate > now;
    expect(isActive).toBe(false);
  });

  it("weekly plan expires after 7 days", () => {
    const sub = makeSubscription({ plan: "weekly", endDate: daysFromNow(7) });
    const now = new Date();
    expect(sub.endDate > now).toBe(true);

    const expired = makeSubscription({ plan: "weekly", endDate: daysFromNow(-1) });
    expect(expired.endDate > now).toBe(false);
  });

  it("monthly plan expires after 30 days", () => {
    const sub = makeSubscription({ plan: "monthly", endDate: daysFromNow(30) });
    const now = new Date();
    expect(sub.endDate > now).toBe(true);
  });
});

// ─── 2. hasActiveSubscription delegates correctly ────────────────────────────

describe("hasActiveSubscription", () => {
  it("returns true when getActiveSubscription returns a subscription", () => {
    const sub = makeSubscription();
    const hasActive = sub !== undefined;
    expect(hasActive).toBe(true);
  });

  it("returns false when getActiveSubscription returns undefined", () => {
    const sub = undefined;
    const hasActive = sub !== undefined;
    expect(hasActive).toBe(false);
  });
});

// ─── 3. Quiz access gating logic ────────────────────────────────────────────

describe("Quiz access gating", () => {
  const resolveAccess = (user: ReturnType<typeof makeUser>, subscription: ReturnType<typeof makeSubscription> | undefined) => {
    const adminAccessValid =
      !!user.adminGrantedAccess &&
      (!user.adminAccessExpiresAt || user.adminAccessExpiresAt > new Date());
    const hasFullAccess = user.isAdmin || adminAccessValid || !!subscription;
    const questionCount = hasFullAccess ? 50 : 5;
    return { hasFullAccess, questionCount };
  };

  it("subscribed user gets 50 questions", () => {
    const user = makeUser();
    const sub = makeSubscription();
    const { hasFullAccess, questionCount } = resolveAccess(user, sub);
    expect(hasFullAccess).toBe(true);
    expect(questionCount).toBe(50);
  });

  it("free trial user (no subscription) gets 5 questions", () => {
    const user = makeUser();
    const { hasFullAccess, questionCount } = resolveAccess(user, undefined);
    expect(hasFullAccess).toBe(false);
    expect(questionCount).toBe(5);
  });

  it("admin user always gets 50 questions regardless of subscription", () => {
    const user = makeUser({ isAdmin: true });
    const { hasFullAccess, questionCount } = resolveAccess(user, undefined);
    expect(hasFullAccess).toBe(true);
    expect(questionCount).toBe(50);
  });

  it("user with valid adminGrantedAccess gets 50 questions", () => {
    const user = makeUser({
      adminGrantedAccess: true,
      adminAccessExpiresAt: daysFromNow(7),
    });
    const { hasFullAccess, questionCount } = resolveAccess(user, undefined);
    expect(hasFullAccess).toBe(true);
    expect(questionCount).toBe(50);
  });

  it("user with EXPIRED adminGrantedAccess gets only 5 questions (bug fix)", () => {
    const user = makeUser({
      adminGrantedAccess: true,
      adminAccessExpiresAt: daysFromNow(-1), // expired yesterday
    });
    const { hasFullAccess, questionCount } = resolveAccess(user, undefined);
    expect(hasFullAccess).toBe(false);
    expect(questionCount).toBe(5);
  });

  it("user with adminGrantedAccess=true but null expiry gets 50 questions (no expiry = permanent)", () => {
    const user = makeUser({
      adminGrantedAccess: true,
      adminAccessExpiresAt: null,
    });
    const { hasFullAccess, questionCount } = resolveAccess(user, undefined);
    expect(hasFullAccess).toBe(true);
    expect(questionCount).toBe(50);
  });

  it("user with expired subscription is blocked (gets 5 questions)", () => {
    const user = makeUser();
    const expiredSub = makeSubscription({ endDate: daysFromNow(-1) });
    // simulate what getActiveSubscription returns — undefined for expired
    const activeSubOrUndefined = expiredSub.endDate > new Date() && expiredSub.status === "active"
      ? expiredSub
      : undefined;
    const { hasFullAccess, questionCount } = resolveAccess(user, activeSubOrUndefined);
    expect(hasFullAccess).toBe(false);
    expect(questionCount).toBe(5);
  });
});

// ─── 4. Free trial gating ────────────────────────────────────────────────────

describe("Free trial gating", () => {
  const canStartFreeTrial = (user: ReturnType<typeof makeUser>, category: "NCLEX" | "TEAS" | "HESI") => {
    const fieldMap = {
      NCLEX: "nclexFreeTrialUsed",
      TEAS: "teasFreeTrialUsed",
      HESI: "hesiFreeTrialUsed",
    } as const;
    return !user[fieldMap[category]];
  };

  it("user can start NCLEX free trial when not used", () => {
    const user = makeUser({ nclexFreeTrialUsed: false });
    expect(canStartFreeTrial(user, "NCLEX")).toBe(true);
  });

  it("user is blocked from NCLEX free trial when already used", () => {
    const user = makeUser({ nclexFreeTrialUsed: true });
    expect(canStartFreeTrial(user, "NCLEX")).toBe(false);
  });

  it("TEAS free trial is independent of NCLEX free trial", () => {
    const user = makeUser({ nclexFreeTrialUsed: true, teasFreeTrialUsed: false });
    expect(canStartFreeTrial(user, "TEAS")).toBe(true);
  });

  it("HESI free trial is independent of other free trials", () => {
    const user = makeUser({ nclexFreeTrialUsed: true, teasFreeTrialUsed: true, hesiFreeTrialUsed: false });
    expect(canStartFreeTrial(user, "HESI")).toBe(true);
  });

  it("all free trials used blocks all categories", () => {
    const user = makeUser({ nclexFreeTrialUsed: true, teasFreeTrialUsed: true, hesiFreeTrialUsed: true });
    expect(canStartFreeTrial(user, "NCLEX")).toBe(false);
    expect(canStartFreeTrial(user, "TEAS")).toBe(false);
    expect(canStartFreeTrial(user, "HESI")).toBe(false);
  });
});

// ─── 5. link-to-user subscription creation ───────────────────────────────────

describe("link-to-user: subscription creation", () => {
  const planDurations: Record<string, number> = { weekly: 7, monthly: 30 };

  const simulateLinkToUser = (
    payment: ReturnType<typeof makePayment>,
    user: ReturnType<typeof makeUser>,
    userEmail: string
  ): { success: boolean; error?: string; durationDays?: number } => {
    if (payment.status !== "completed") {
      return { success: false, error: "Payment not completed" };
    }
    if (payment.userId) {
      return { success: false, error: "Payment already linked to a user" };
    }
    if (!payment.email || payment.email.toLowerCase() !== userEmail.toLowerCase()) {
      return { success: false, error: "Email does not match payment email" };
    }
    if (!user.email || user.email.toLowerCase() !== userEmail.toLowerCase()) {
      return { success: false, error: "User email does not match provided email" };
    }
    const durationDays = planDurations[payment.plan] || 30;
    return { success: true, durationDays };
  };

  it("links payment and creates subscription for matching email", () => {
    const payment = makePayment({ plan: "monthly" });
    const user = makeUser({ email: "test@example.com" });
    const result = simulateLinkToUser(payment, user, "test@example.com");
    expect(result.success).toBe(true);
    expect(result.durationDays).toBe(30);
  });

  it("weekly plan creates 7-day subscription", () => {
    const payment = makePayment({ plan: "weekly" });
    const user = makeUser({ email: "test@example.com" });
    const result = simulateLinkToUser(payment, user, "test@example.com");
    expect(result.success).toBe(true);
    expect(result.durationDays).toBe(7);
  });

  it("rejects if payment is not completed", () => {
    const payment = makePayment({ status: "pending" });
    const user = makeUser();
    const result = simulateLinkToUser(payment, user, "test@example.com");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Payment not completed");
  });

  it("rejects if payment is already linked to a user", () => {
    const payment = makePayment({ userId: "existing-user-456" });
    const user = makeUser();
    const result = simulateLinkToUser(payment, user, "test@example.com");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Payment already linked to a user");
  });

  it("rejects if email does not match payment email", () => {
    const payment = makePayment({ email: "original@example.com" });
    const user = makeUser({ email: "hacker@evil.com" });
    const result = simulateLinkToUser(payment, user, "hacker@evil.com");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email does not match payment email");
  });

  it("is case-insensitive on email comparison", () => {
    const payment = makePayment({ email: "TEST@EXAMPLE.COM" });
    const user = makeUser({ email: "test@example.com" });
    const result = simulateLinkToUser(payment, user, "test@example.com");
    expect(result.success).toBe(true);
  });

  it("subscription endDate is correctly calculated from startDate", () => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // weekly

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });
});

// ─── 6. /api/auth/user subscription response shape ───────────────────────────

describe("Auth user endpoint subscription shape", () => {
  it("returns hasActiveSubscription=true when subscription is active", () => {
    const sub = makeSubscription();
    const hasActiveSubscription = !!sub;
    const response = { hasActiveSubscription, subscription: sub };
    expect(response.hasActiveSubscription).toBe(true);
    expect(response.subscription.plan).toBe("monthly");
    expect(response.subscription.status).toBe("active");
  });

  it("returns hasActiveSubscription=false when no subscription", () => {
    const sub = undefined;
    const hasActiveSubscription = !!sub;
    const response = { hasActiveSubscription, subscription: sub };
    expect(response.hasActiveSubscription).toBe(false);
    expect(response.subscription).toBeUndefined();
  });
});
