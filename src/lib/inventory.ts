export function generateInventoryId(): string {
  return `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
