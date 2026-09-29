import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { InventoryItem } from "../types/inventory";
import { readCache, writeCache } from "../utils/storeCache";
import { ShowToastMessage } from "../utils/random";

const CACHE_KEY = "store_inventory";

interface InventoryState {
  stocks: InventoryItem[];
  loading: boolean;
  saveInventoryItem(item: InventoryItem): Promise<void>;
  getInventoryItemById(id: string): Promise<InventoryItem | null>;
  getInventoryByTailor(tailorId: string): Promise<void>;
  editInventoryItem(itemId: string, updates: Partial<InventoryItem>): Promise<void>;
  deleteInventoryItem(itemId: string): Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  stocks: [],
  loading: false,

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async saveInventoryItem(item) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: InventoryItem }>(
        "/inventory/create",
        {
          method: "POST",
          body: JSON.stringify(item),
        },
      );
      const saved = res.data;
      set((state) => ({
        stocks: state.stocks.some((s) => s.id === saved.id)
          ? state.stocks.map((s) => (s.id === saved.id ? saved : s))
          : [saved, ...state.stocks],
      }));
    } catch (error: any) {
      console.error("Error saving inventory item:", error);
      ShowToastMessage({ title: error.message ?? "Failed to save item", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  async getInventoryItemById(id) {
    set({ loading: true });
    try {
      // Return from in-memory cache first
      const cached = get().stocks.find((s) => s.id === id);
      if (cached) return cached;

      const res = await apiFetch<{ success: boolean; data: InventoryItem }>(
        `/inventory/get/${encodeURIComponent(id)}`,
      );
      return res.data ?? null;
    } catch (error: any) {
      console.error("Error getting inventory item:", error);
      ShowToastMessage({ title: error.message ?? "Failed to fetch item", preset: "error", haptic: "error" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async getInventoryByTailor(_tailorId) {
    // 1. Show cached data immediately if available
    const cached = await readCache<InventoryItem[]>(CACHE_KEY);
    if (cached) set({ stocks: cached });

    // 2. Fetch fresh data (show spinner only when cache is empty)
    if (!cached) set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: InventoryItem[] }>(
        "/inventory/list",
      );
      // Sort by name ascending to match previous Firestore orderBy("name","asc")
      const sorted = (res.data ?? []).slice().sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? ""),
      );
      set({ stocks: sorted });
      await writeCache(CACHE_KEY, sorted);
    } catch (error: any) {
      console.error("Error getting inventory:", error);
      if (!cached) {
        ShowToastMessage({ title: error.message ?? "Failed to fetch inventory", preset: "error", haptic: "error" });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ─── EDIT ──────────────────────────────────────────────────────────────────
  async editInventoryItem(itemId, updates) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: InventoryItem }>(
        `/inventory/edit/${encodeURIComponent(itemId)}`,
        {
          method: "PUT",
          body: JSON.stringify(updates),
        },
      );
      const updated = res.data;
      set((state) => ({
        stocks: state.stocks.map((s) => (s.id === updated.id ? updated : s)),
      }));
      ShowToastMessage({ title: "Inventory updated successfully", preset: "done", haptic: "success" });
    } catch (error: any) {
      console.error("Error updating inventory item:", error);
      ShowToastMessage({ title: error.message ?? "Update failed", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────
  async deleteInventoryItem(itemId) {
    set({ loading: true });
    try {
      await apiFetch(`/inventory/delete/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
      });
      set((state) => ({
        stocks: state.stocks.filter((s) => s.id !== itemId),
      }));
    } catch (error: any) {
      console.error("Error deleting inventory item:", error);
      ShowToastMessage({ title: error.message ?? "Failed to delete item", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },
}));
