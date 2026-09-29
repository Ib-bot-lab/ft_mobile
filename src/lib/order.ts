export function GenerateOrderId(): string {
  return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
