export type InventoryCategory =
  | "fabrics"
  | "threads"
  | "button"
  | "zipper"
  | "lining"
  | "interfacing"
  | "elastic"
  | "trim"
  | "accessories"
  | "tools"
  | "other";

export type InventoryUnit =
  | "yards"
  | "meters"
  | "pieces"
  | "spools"
  | "packets"
  | "rolls"
  | "sets"
  | "kg"
  | "grams"
  | "other";

export type InventoryStatus =
  | "in-stock"
  | "low-stock"
  | "out-of-stock"
  | "discontinued";

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  description: string;
  supplier: string;
  supplierName: string;
  color: string;
  material: string; // e.g., cotton, silk, polyester
  quantity: number;
  unit: InventoryUnit;
  minStockLevel?: number; // Reorder point
  reorderPoint?: number;
  costPerUnit?: number;
  sellingPricePerUnit?: number;
  totalValue: number; // quantity * costPerUnit
  status: InventoryStatus;
  purchaseDate?: string; // ISO string
  expiryDate?: string; // Optional, for items that expire
  batchNumber?: string; // Optional, for tracking batches
  imageUrl?: string; // Optional, for item images
  notes?: string;
  tailorId: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Calculates the number of inventory items currently marked as "in-stock".
 * @param stocks - The array of inventory items from your store
 * @returns The count of items with "in-stock" status
 */
export const GetInStockCount = (stocks: InventoryItem[]): number => {
  // 1. Filter the array to find only items where status is 'in-stock'
  const inStockItems = stocks.filter((item) => item.status === "in-stock");

  // 2. Return the length of the filtered array
  return inStockItems.length;
};

/**
 * Calculates the number of items that are running low.
 * @param stocks - The array of inventory items
 * @returns The count of items with "low-stock" status
 */
export const GetLowStockCount = (stocks: InventoryItem[]): number => {
  return stocks.filter((item) => item.status === "low-stock").length;
};

/**
 * Calculates the total monetary value of all items in the inventory.
 * @param stocks - Array of InventoryItem objects
 * @returns The sum of all totalValue fields
 */
export const GetTotalInventoryValue = (stocks: InventoryItem[]): number => {
  // Use reduce to sum up the 'totalValue' of every item
  const grandTotal = stocks.reduce((accumulator, item) => {
    // We use (item.totalValue || 0) just in case a value is missing or null
    return accumulator + (item.totalValue ?? 0);
  }, 0);

  return grandTotal;
};
