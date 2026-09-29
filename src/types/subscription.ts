export type SubscriptionResult = {
  isSubscribed: boolean;
  planType?: string;
  subscriptionType?: "trial" | "paid" | "free";
  subscriptionEndDate?: string;
};
