import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { Expense, Income, TransactionType } from "../types/finance";
import { readCache, writeCache } from "../utils/storeCache";
import { ShowToastMessage } from "../utils/random";

// Backend stores all transactions in one collection with a `type` field.
// We split them into income[] and expenses[] on the client for the existing
// utility functions (CalculateMonthlyIncrement, etc.) to keep working.
type Transaction = (Income | Expense) & { type: string };

const CACHE_KEY = "store_transactions";

interface FinancialState {
  income: Income[];
  expenses: Expense[];
  loading: boolean;

  getTransactionsByTailor(tailorId: string): Promise<void>;
  saveTransaction(data: Income, type: "income"): Promise<void>;
  saveTransaction(data: Expense, type: "expense"): Promise<void>;
  editTransaction(
    id: string,
    updates: Partial<Income> | Partial<Expense>,
    type: TransactionType,
  ): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
}

/** Split a flat list of transactions from the API into income / expense buckets */
function splitTransactions(data: Transaction[]) {
  const income: Income[] = [];
  const expenses: Expense[] = [];
  for (const t of data) {
    const type = String(t.type || "").toLowerCase().trim();
    if (type === "income") income.push(t as Income);
    else expenses.push(t as Expense);
  }
  return { income, expenses };
}

export const useFinanceStore = create<FinancialState>((set, get) => ({
  income: [],
  expenses: [],
  loading: false,

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async getTransactionsByTailor(_tailorId) {
    const cached = await readCache<{ income: Income[]; expenses: Expense[] }>(CACHE_KEY);
    if (cached) set({ income: cached.income, expenses: cached.expenses });

    if (!cached) set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Transaction[] }>(
        "/transaction/list",
      );
      const split = splitTransactions(res.data ?? []);
      set(split);
      await writeCache(CACHE_KEY, split);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      if (!cached) {
        ShowToastMessage({ title: "Failed to fetch transactions", preset: "error" });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ─── CREATE / UPSERT ───────────────────────────────────────────────────────
  async saveTransaction(data: Income | Expense, type: TransactionType) {
    if (get().loading) return;
    set({ loading: true });
    try {
      const normalizedType = type.toLowerCase() as TransactionType;

      // Check if already exists — if so, edit instead
      const allExisting = [...get().income, ...get().expenses];
      const exists = allExisting.some((t) => t.id === data.id);

      let saved: Transaction;
      if (exists) {
        const res = await apiFetch<{ success: boolean; data: Transaction }>(
          `/transaction/edit/${encodeURIComponent(data.id)}`,
          { method: "PUT", body: JSON.stringify({ ...data, type: normalizedType }) },
        );
        saved = res.data;
      } else {
        const res = await apiFetch<{ success: boolean; data: Transaction }>(
          "/transaction/create",
          { method: "POST", body: JSON.stringify({ ...data, type: normalizedType }) },
        );
        saved = res.data;
      }

      if (normalizedType === "income") {
        const incomeData = saved as Income;
        set((state) => {
          const ex = state.income.some((i) => i.id === incomeData.id);
          return {
            income: ex
              ? state.income.map((i) => (i.id === incomeData.id ? incomeData : i))
              : [incomeData, ...state.income],
          };
        });
      } else {
        const expenseData = saved as Expense;
        set((state) => {
          const ex = state.expenses.some((e) => e.id === expenseData.id);
          return {
            expenses: ex
              ? state.expenses.map((e) => (e.id === expenseData.id ? expenseData : e))
              : [expenseData, ...state.expenses],
          };
        });
      }
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      ShowToastMessage({ title: error.message ?? "Save failed", preset: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── EDIT ──────────────────────────────────────────────────────────────────
  async editTransaction(id, updates, type) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Transaction }>(
        `/transaction/edit/${encodeURIComponent(id)}`,
        { method: "PUT", body: JSON.stringify(updates) },
      );
      const updated = res.data;
      const updatedAt = updated.updatedAt ?? new Date().toISOString();

      if (type.toLowerCase() === "income") {
        set((state) => ({
          income: state.income.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt } : i,
          ),
        }));
      } else {
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt } : e,
          ),
        }));
      }
      ShowToastMessage({ title: "Transaction updated successfully", preset: "done", haptic: "success" });
    } catch (error: any) {
      console.error("Error editing transaction:", error);
      ShowToastMessage({ title: error.message ?? "Update failed", preset: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────
  async deleteTransaction(id) {
    set({ loading: true });
    try {
      await apiFetch(`/transaction/delete/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      set((state) => ({
        income: state.income.filter((i) => i.id !== id),
        expenses: state.expenses.filter((e) => e.id !== id),
      }));
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      ShowToastMessage({ title: error.message ?? "Delete failed", preset: "error" });
    } finally {
      set({ loading: false });
    }
  },
}));
