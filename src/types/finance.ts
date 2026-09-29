export type ExpenseCategory =
  | "materials"
  | "rent"
  | "utilities"
  | "equipment"
  | "marketing"
  | "transportation"
  | "meals"
  | "insurance"
  | "taxes"
  | "other";

export type IncomeSource =
  | "order_payment"
  | "deposit"
  | "alteration"
  | "consultation"
  | "other";

export type TransactionType = "income" | "expense";

export type Expense = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO string
  receiptUrl?: string;
  notes?: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
};

export type Income = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  source: IncomeSource;
  date: string; // ISO string
  orderId?: string; // Link to order if applicable
  clientName?: string;
  notes?: string;
  userEmail: string;
  createdAt: string;
  updatedAt: string;
};

export const CalculateMonthlyIncrement = (income: Income[]) => {
  if (!income?.length) return 0;

  const now = new Date();

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const lastMonthDate = new Date(currentYear, currentMonth - 1);
  const lastMonth = lastMonthDate.getMonth();
  const lastYear = lastMonthDate.getFullYear();

  let currentTotal = 0;
  let lastTotal = 0;

  for (const item of income) {
    const d = new Date(item.date);

    const m = d.getMonth();
    const y = d.getFullYear();

    if (m === currentMonth && y === currentYear) {
      currentTotal += item.amount;
    }

    if (m === lastMonth && y === lastYear) {
      lastTotal += item.amount;
    }
  }

  // avoid divide by zero
  if (lastTotal === 0 && currentTotal === 0) return 0;
  if (lastTotal === 0) return 100;

  let percent = ((currentTotal - lastTotal) / lastTotal) * 100;

  // clamp
  percent = Math.max(-100, Math.min(100, percent));

  return Number(percent.toFixed(2));
};

/**
 * Calculates the raw percentage change in income between the current and previous month.
 * @param incomeList - Array of income objects
 * @returns A rounded number representing the percentage change (e.g., 18, -10, 0)
 */
export const GetMonthlyIncomeChangeValue = (incomeList: Income[]): number => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Calculate Previous Month/Year
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // 2. Total for Current Month
  const currentMonthTotal = incomeList
    .filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getMonth() === currentMonth &&
        itemDate.getFullYear() === currentYear
      );
    })
    .reduce((acc, item) => acc + item.amount, 0);

  // 3. Total for Previous Month
  const prevMonthTotal = incomeList
    .filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear
      );
    })
    .reduce((acc, item) => acc + item.amount, 0);

  // 4. Calculate Percentage
  if (prevMonthTotal === 0) {
    // If last month was 0 and this month > 0, return 100% growth
    // If both are 0, return 0% growth
    return currentMonthTotal > 0 ? 100 : 0;
  }

  const percentageChange =
    ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;

  // 5. Return as a rounded integer
  return Math.round(percentageChange);
};
