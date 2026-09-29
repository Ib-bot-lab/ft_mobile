export type InvoiceItem = {
  description: string;
  quantity: number;
  price: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  terms: string;

  businessName: string;
  businessAddress: string;
  logoUrl: string;

  // billTo: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;

  clientId?: string;

  items: InvoiceItem[];

  notes?: string[];
  termsAndConditions?: string;
  currency?: string; // "NGN"

  themeColor?: string;
};

/** Invoice document stored in Firestore (fashiontally_invoices) */
export type Invoice = InvoiceData & {
  id: string;
  createdAt: string;
  userEmail: string;
};
