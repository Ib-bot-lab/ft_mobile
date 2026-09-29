export function generateExpenseId(): string {
  return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateIncomeId(): string {
  return `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
