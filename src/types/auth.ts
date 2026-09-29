export type RegisterUserData = {
  uid?: string;
  name: string;
  email: string;
  phone: string;
  phoneNumber?: string;
  businessName: string;
  role: "Designer" | "Business";
  lga: string;
  state: string;
  country: string;
  createdAt: string;
  logo?: string;
  metadata?: any;
  // sub-admin fields
  isAdmin?: boolean;
  invitedBy?: string | null;
  permissions?: Record<string, boolean> | null;
  // subscription fields (returned by loginController from MongoDB)
  isSubscribed?: boolean;
  subscriptionType?: "trial" | "paid" | "free";
  planType?: string;
  isTrialActive?: boolean;
  subscriptionEndDate?: string;
  subscriptionStartDate?: string;
  trialStartDate?: string;
  payment_amount?: number;
  payment_date?: string;
};

export const emptyUserData: RegisterUserData = {
  // firstName: "",
  // lastName: "",
  name: "",
  email: "",
  phone: "",
  businessName: "",
  role: "Designer",
  country: "Nigeria",
  logo: "",
  createdAt: new Date().toString(),
  lga: "",
  state: "",
};

export type BrandSettings = {
  id?: string;
  logoUrl?: string;
  businessName: string;
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessWebsite?: string;
  instagramHandle?: string;
  primaryColor?: string;
  secondaryColor?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  footerText?: string;
  termsAndConditions?: string;
  updatedAt: string;
  userEmail: string;
};

export const BrandSettings = {};
