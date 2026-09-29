export function generateInvoiceId(): string {
  return `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString().slice(-9)}`;
}
