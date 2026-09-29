// lib/crm-types.ts

export interface LoyaltyMember {
  id?: string;
  name: string;
  email: string;
  level: "Bronze" | "Silver" | "Gold" | "Platinum";
  points: number;
  totalSpent: number;
  lastActivity?: string;
  birthday?: string;
  avatar?: string;
  tags?: string[];
  notes?: string;
  tailorId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  icon: string;
  category: "discount" | "service" | "access" | "gift";
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: "draft" | "scheduled" | "sent" | "archived";
  recipients: string[];
  recipientCount: number;
  sentAt?: string;
  scheduledAt?: string;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "push";
  content: string;
  lastUsed?: string;
  usageCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientFeedback {
  id?: string;
  clientName: string;
  clientEmail: string;
  rating: number;
  comment: string;
  productName: string;
  orderNumber: string;
  invoiceNumber: string;
  status: "pending" | "approved" | "hidden";
  isPublic: boolean;
  reply?: string;
  tailorId: string;
  repliedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAverageRating = (feedbacks: ClientFeedback[]): number => {
  if (!feedbacks.length) return 0;
  const total = feedbacks.reduce((sum, f) => sum + f.rating, 0);
  return Math.round((total / feedbacks.length) * 10) / 10; // 1 decimal place
};

export interface CRMStats {
  totalClients: number;
  monthlyGrowth: number;
  loyaltyMembers: number;
  loyaltyPercentage: number;
  totalCampaigns: number;
  lastCampaignDate?: string;
  averageRating: number;
  totalReviews: number;
}
