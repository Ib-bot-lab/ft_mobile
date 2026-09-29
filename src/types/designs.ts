export interface Design {
  id: string;
  createdAt: string;
  updatedAt?: string;
  name: string;
  category?:
    | "Uniforms"
    | "Shirts"
    | "Children's Wear"
    | "Dresses"
    | "Tops"
    | "Bottoms"
    | "Others";
  customCategory?: string;
  status?: "Active" | "Archived";
  description?: string;
  userEmail?: string;
  materials?: string[];
  measurements?: {
    bust?: number;
    waist?: number;
    hips?: number;
    length?: number;
    shoulder?: number;
    sleeveLength?: number;
    neckSize?: number;
    armLength?: number;
    thigh?: number;
    inseam?: number;
  };
  price: number;
  imageUrl?: string;
  images?: string[];
  notes?: string;
  dueDate?: Date;
  clientId?: string;
  clientName?: string;
  clientBio?: string;
  nextOfKin?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}
