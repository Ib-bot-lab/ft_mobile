/**
 * Form validation utilities.
 * Mandatory fields are required; optional fields are validated only when present.
 */

export type ValidationResult<T extends string = string> = {
  isValid: boolean;
  errors: Record<T, string>;
};

/** Design form shape (create-design) */
export type DesignFormData = {
  imageUrl: string;
  name: string;
  price: string;
  description: string;
  notes: string;
};

/**
 * Validates design form. Mandatory: imageUrl, name, price (must be valid number > 0).
 * Optional: description, notes (no validation).
 */
export function validateDesignForm(data: DesignFormData): ValidationResult<keyof DesignFormData> {
  const errors: Record<keyof DesignFormData, string> = {
    imageUrl: "",
    name: "",
    price: "",
    description: "",
    notes: "",
  };

  let isValid = true;

  if (!data.imageUrl?.trim()) {
    errors.imageUrl = "Design image is required";
    isValid = false;
  }

  if (!data.name?.trim()) {
    errors.name = "Design name is required";
    isValid = false;
  }

  if (!data.price?.trim()) {
    errors.price = "Price is required";
    isValid = false;
  } else {
    const num = parseFloat(data.price.replace(/[^0-9.]/g, ""));
    if (Number.isNaN(num) || num <= 0) {
      errors.price = "Enter a valid price (greater than 0)";
      isValid = false;
    }
  }

  return { isValid, errors };
}

/** Client form shape (create-client) */
export type ClientFormData = {
  name: string;
  email: string;
  phone: string;
  notes?: string;
};

/**
 * Validates client form. Mandatory: name, email (valid format), phone (valid Nigerian).
 * Optional: notes.
 */
export function validateClientForm(data: ClientFormData): ValidationResult<keyof ClientFormData> {
  const errors = {
    name: "",
    email: "",
    phone: "",
    notes: "",
  };

  let isValid = true;

  if (!data.name?.trim()) {
    errors.name = "Client name is required";
    isValid = false;
  }

  if (!data.email?.trim()) {
    errors.email = "Email address is required";
    isValid = false;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.email = "Enter a valid email address";
      isValid = false;
    }
  }

  if (!data.phone?.trim()) {
    errors.phone = "Phone number is required";
    isValid = false;
  } else {
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ""))) {
      errors.phone = "Enter a valid Nigerian phone number";
      isValid = false;
    }
  }

  return { isValid, errors };
}

/** Stock form shape (create-stock) – only fields we validate */
export type StockFormData = {
  name: string;
  supplier: string;
  quantity: number;
  sellingPricePerUnit: number;
};

/**
 * Validates stock form. Mandatory: name, supplier, quantity > 0, sellingPricePerUnit > 0.
 */
export function validateStockForm(data: StockFormData): ValidationResult<keyof StockFormData> {
  const errors = {
    name: "",
    supplier: "",
    quantity: "",
    sellingPricePerUnit: "",
  };

  let isValid = true;

  if (!data.name?.trim()) {
    errors.name = "Item name is required";
    isValid = false;
  }

  if (!data.supplier?.trim()) {
    errors.supplier = "Supplier is required";
    isValid = false;
  }

  if (data.quantity == null || data.quantity <= 0) {
    errors.quantity = "Quantity must be greater than 0";
    isValid = false;
  }

  if (data.sellingPricePerUnit == null || data.sellingPricePerUnit <= 0) {
    errors.sellingPricePerUnit = "Selling price must be greater than 0";
    isValid = false;
  }

  return { isValid, errors };
}
