import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { Order } from "../types/Order";
import { readCache, writeCache } from "../utils/storeCache";
import { ShowToastMessage } from "../utils/random";

const CACHE_KEY = "store_orders";

interface OrderState {
  orders: Order[];
  loading: boolean;
  getOrdersByTailor(tailorId: string): Promise<void>;
  saveOrder(order: Order): Promise<void>;
  getOrderById(id: string): Promise<Order | null>;
  deleteOrder(orderId: string): Promise<void>;
  updateOrderStatus(orderId: string, status: Order["status"]): Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  loading: false,

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async getOrdersByTailor(_tailorId) {
    // 1. Show cached data immediately if available
    const cached = await readCache<Order[]>(CACHE_KEY);
    if (cached) set({ orders: cached });

    // 2. Fetch fresh data (show spinner only when cache is empty)
    if (!cached) set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Order[] }>(
        "/order/list",
      );
      const fresh = (res.data ?? []).map((o: any) => ({
        ...o,
        id: o.id || o._id?.toString() || "",
      }));
      set({ orders: fresh });
      await writeCache(CACHE_KEY, fresh);
    } catch (error: any) {
      console.error("Error getting orders:", error);
      if (!cached) {
        ShowToastMessage({ title: error.message ?? "Failed to fetch orders", preset: "error", haptic: "error" });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ─── CREATE / UPSERT ───────────────────────────────────────────────────────
  async saveOrder(order) {
    set({ loading: true });
    try {
      // If the order already exists in the store, treat it as an edit
      const exists = get().orders.some((o) => o.id === order.id);

      if (exists) {
        const res = await apiFetch<{ success: boolean; data: Order }>(
          `/order/edit/${encodeURIComponent(order.id)}`,
          { method: "PUT", body: JSON.stringify(order) },
        );
        const updated = res.data;
        set((state) => ({
          orders: state.orders.map((o) => (o.id === updated.id ? updated : o)),
        }));
      } else {
        const res = await apiFetch<{ success: boolean; data: Order }>(
          "/order/create",
          { method: "POST", body: JSON.stringify(order) },
        );
        const saved = res.data;
        set((state) => ({ orders: [saved, ...state.orders] }));
      }
    } catch (error: any) {
      console.error("Error saving order:", error);
      ShowToastMessage({ title: error.message ?? "Failed to save order", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  async getOrderById(id) {
    set({ loading: true });
    try {
      // Return from in-memory cache first
      const cached = get().orders.find((o) => o.id === id);
      if (cached) return cached;

      const res = await apiFetch<{ success: boolean; data: Order }>(
        `/order/get/${encodeURIComponent(id)}`,
      );
      return res.data ?? null;
    } catch (error: any) {
      console.error("Error getting order:", error);
      ShowToastMessage({ title: error.message ?? "Failed to fetch order", preset: "error", haptic: "error" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // ─── UPDATE STATUS ─────────────────────────────────────────────────────────
  async updateOrderStatus(orderId, status) {
    set({ loading: true });
    try {
      const updatedAt = new Date().toISOString();
      const res = await apiFetch<{ success: boolean; data: Order }>(
        `/order/edit/${encodeURIComponent(orderId)}`,
        { method: "PUT", body: JSON.stringify({ status, updatedAt }) },
      );
      const updated = res.data;
      set((state) => ({
        orders: state.orders.map((o) => (o.id === updated.id ? updated : o)),
      }));
    } catch (error: any) {
      console.error("Error updating order status:", error);
      ShowToastMessage({ title: error.message ?? "Failed to update status", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────
  async deleteOrder(orderId) {
    set({ loading: true });
    try {
      await apiFetch(`/order/delete/${encodeURIComponent(orderId)}`, {
        method: "DELETE",
      });
      set((state) => ({
        orders: state.orders.filter((o) => o.id !== orderId),
      }));
    } catch (error: any) {
      console.error("Error deleting order:", error);
      ShowToastMessage({ title: error.message ?? "Failed to delete order", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },
}));
