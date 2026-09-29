export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded";

export type GarmentType =
  | "shirt"
  | "trouser"
  | "suit"
  | "dress"
  | "blouse"
  | "skirt"
  | "jacket"
  | "traditional"
  | "other";

export type Order = {
  id: string;
  name?: string;               // design/style name (set by ft_corrent panel)
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientId?: string; // Optional, if linked to existing client
  garmentType: GarmentType;
  garmentDescription: string;
  fabric: string;
  color: string;
  quantity: number;
  measurements: {
    [key: string]: string; // Flexible measurements based on garment type
  };
  specialInstructions: string;
  price: number;
  deposit: number;
  balance: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  orderDate: string; // ISO string
  dueDate: string; // ISO string
  completionDate?: string; // ISO string, optional
  tailorId: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Calculates the number of orders due within the current calendar week (Sunday to Saturday).
 * @param orders - Array of Order objects
 * @returns The count of orders due this week
 */
export const GetOrdersDueThisWeekCount = (orders: Order[]): number => {
  const now = new Date();

  // 1. Get the start of the current week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // 2. Get the end of the current week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // 3. Filter orders based on the dueDate range
  const dueThisWeek = orders.filter((order) => {
    const dueDate = new Date(order.dueDate);
    return dueDate >= startOfWeek && dueDate <= endOfWeek;
  });

  return dueThisWeek.length;
};

/**
 * Calculates the average price per order.
 * @param orders - Array of Order objects
 * @returns The average order value as a number
 */
export const GetAverageOrderValue = (orders: Order[]): number => {
  // 1. Guard against empty arrays
  if (orders.length === 0) {
    return 0;
  }

  // 2. Sum up the total price of all orders
  const totalRevenue = orders.reduce((acc, order) => {
    return acc + (order.price ?? 0);
  }, 0);

  // 3. Divide by the total number of orders
  const averageValue = totalRevenue / orders.length;

  // 4. Return rounded to 2 decimal places if needed, or raw number
  return Math.round(averageValue);
};

/**
 * Calculates the percentage of orders that have been successfully completed.
 * @param orders - Array of Order objects
 * @returns A rounded number representing the completion percentage (0-100)
 */
export const GetOrderCompletionRate = (orders: Order[]): number => {
  // 1. Guard against empty list to avoid division by zero
  if (orders.length === 0) {
    return 0;
  }

  // 2. Filter orders that have the "completed" status
  const completedOrders = orders.filter(
    (order) => order.status === "completed",
  );

  // 3. Calculate the percentage
  const completionRate = (completedOrders.length / orders.length) * 100;

  // 4. Return as a rounded integer
  return Math.round(completionRate);
};
