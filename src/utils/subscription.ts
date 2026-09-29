import { apiFetch } from "../lib/apiClient";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type SubscriptionType = "trial" | "paid" | "free";

export type SubscriptionResult = {
  isSubscribed: boolean;
  planType?: string;
  subscriptionType?: SubscriptionType;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  currentDate?: string;
  paymentAmount?: number;
  paymentDate?: string;
};

type UserDocData = {
  subscriptionType?: SubscriptionType;
  planType?: string;
  isTrialActive?: boolean;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  payment_amount?: number;
  payment_date?: string;
  isSubscribed?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                              CORE CHECK LOGIC                               */
/* -------------------------------------------------------------------------- */

/**
 * Checks subscription status by reading the user record from the backend
 * (MongoDB). Falls back to granting access if the backend is unreachable so
 * a network blip never locks users out.
 */
export async function checkSubscriptionStatus(
  _email?: string,
  _uuid?: string,
): Promise<SubscriptionResult> {
  try {
    // apiFetch attaches the stored Bearer token automatically
    const res = await apiFetch<{ success: boolean; data: UserDocData }>(
      "/user/get",
    );

    if (!res.success || !res.data) {
      return getFallbackAccess();
    }

    return evaluateSubscription(res.data);
  } catch {
    // Network error or 401 — fail open so connectivity issues don't block users
    return getFallbackAccess();
  }
}

/* -------------------------------------------------------------------------- */
/*                          SUBSCRIPTION EVALUATION                            */
/* -------------------------------------------------------------------------- */

function evaluateSubscription(data: UserDocData): SubscriptionResult {
  const {
    subscriptionType,
    planType,
    isTrialActive,
    subscriptionStartDate,
    subscriptionEndDate,
    payment_amount,
    payment_date,
    isSubscribed,
  } = data;

  // 🧪 Trial
  if (subscriptionType === "trial" && isTrialActive && subscriptionEndDate) {
    if (isFutureDate(subscriptionEndDate)) {
      return {
        isSubscribed: true,
        subscriptionType: "trial",
        planType: planType ?? "Starter",
        subscriptionStartDate,
        subscriptionEndDate,
      };
    }
    return { isSubscribed: false, subscriptionType: "free", planType: "Free" };
  }

  // 🆕 New paid fields — check FIRST before legacy payment window
  // isSubscribed + subscriptionEndDate is the authoritative source of truth
  if (isSubscribed && subscriptionEndDate && isFutureDate(subscriptionEndDate)) {
    return {
      isSubscribed: true,
      subscriptionType: subscriptionType ?? "paid",
      planType: planType ?? "Starter",
      subscriptionStartDate,
      subscriptionEndDate,
      currentDate: new Date().toISOString(),
    };
  }

  // 💳 Legacy paid (30-day window) — only used when there is no subscriptionEndDate
  if (payment_amount && payment_amount > 0 && payment_date && !subscriptionEndDate) {
    const active = getDaysSince(payment_date) <= 30;
    return {
      isSubscribed: active,
      subscriptionType: "paid",
      planType: planType ?? determinePlanType(payment_amount),
      subscriptionStartDate: payment_date,
      subscriptionEndDate: getDatePlusDays(payment_date, 30),
      currentDate: new Date().toISOString(),
      paymentAmount: payment_amount,
      paymentDate: payment_date,
    };
  }

  return { isSubscribed: false, subscriptionType: "free", planType: "Free" };
}

/* -------------------------------------------------------------------------- */
/*                               UTIL FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

const isFutureDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date > new Date();
};

const getDaysSince = (dateStr: string): number => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return Infinity;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
};

const getFallbackAccess = (): SubscriptionResult => ({
  isSubscribed: true,
  subscriptionType: "paid",
  planType: "All Access",
});

const determinePlanType = (amount: number): string => {
  if (amount >= 25000) return "PROFESSIONAL";
  if (amount >= 10000) return "GROWTH";
  if (amount >= 5000) return "STARTER";
  return "Free";
};

const getDatePlusDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};
