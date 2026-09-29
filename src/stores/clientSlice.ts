import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { Client, ClientMeasurements } from "../types/client";
import { readCache, writeCache } from "../utils/storeCache";
import { ShowToastMessage } from "../utils/random";

const CACHE_KEY = "store_clients";

interface ClientState {
  clients: Client[];
  loading: boolean;
  saveClient(client: Client): Promise<void>;
  editClient(updatedClient: Client, previousPhone: string): Promise<void>;
  editMeasurements(
    client: Client,
    updates: { [key: string]: string },
  ): Promise<void>;
  getClientById(id: string): Promise<Client | null>;
  getClientsByTailor(tailorId: string): Promise<void>;
  deleteClient(clientId: string): Promise<void>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  loading: false,

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async saveClient(client) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Client }>(
        "/client/create",
        {
          method: "POST",
          body: JSON.stringify(client),
        },
      );
      const saved = res.data;
      set((state) => ({
        clients: state.clients.some((c) => c.id === saved.id)
          ? state.clients.map((c) => (c.id === saved.id ? saved : c))
          : [saved, ...state.clients],
      }));
    } catch (error: any) {
      console.error("Error saving client:", error);
      ShowToastMessage({ title: error.message ?? "Failed to save client", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── EDIT ──────────────────────────────────────────────────────────────────
  async editClient(updatedClient, _previousPhone) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Client }>(
        `/client/edit/${encodeURIComponent(updatedClient.id)}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedClient),
        },
      );
      const updated = res.data;
      set((state) => ({
        clients: state.clients.map((c) =>
          c.id === updated.id ? updated : c,
        ),
      }));
    } catch (error: any) {
      console.error("Error editing client:", error);
      ShowToastMessage({ title: error.message ?? "Failed to update client", preset: "error", haptic: "error" });
      throw new Error("Failed to edit client");
    } finally {
      set({ loading: false });
    }
  },

  // ─── EDIT MEASUREMENTS ─────────────────────────────────────────────────────
  async editMeasurements(client, updates) {
    set({ loading: true });
    try {
      const existing = client.measurements ?? ({} as ClientMeasurements);
      const merged = { ...existing, ...updates };
      const updatedClient: Client = { ...client, measurements: merged };
      await get().editClient(updatedClient, client.phone);
    } catch (error: any) {
      console.error("Error editing measurements:", error);
      ShowToastMessage({ title: error.message ?? "Failed to update measurements", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  async getClientById(id) {
    set({ loading: true });
    try {
      // Check in-memory store first to avoid a round-trip
      const cached = get().clients.find((c) => c.id === id);
      if (cached) return cached;

      const res = await apiFetch<{ success: boolean; data: Client }>(
        `/client/get/${encodeURIComponent(id)}`,
      );
      return res.data ?? null;
    } catch (error: any) {
      console.error("Error getting client:", error);
      ShowToastMessage({ title: error.message ?? "Failed to fetch client", preset: "error", haptic: "error" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async getClientsByTailor(_tailorId) {
    // 1. Show cached data immediately if available
    const cached = await readCache<Client[]>(CACHE_KEY);
    if (cached) {
      console.log("[clientSlice] Loaded from cache:", cached.length, "clients");
      console.log("[clientSlice] Cache sample (first item):", JSON.stringify(cached[0], null, 2));
      // Normalize cached data too in case it was stored before this fix
      const normalizedCache = cached.map((c: any) => ({
        ...c,
        id: c.id || c._id?.toString() || "",
      }));
      set({ clients: normalizedCache });
    }

    // 2. Fetch fresh data (show spinner only when cache is empty)
    if (!cached) set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Client[] }>(
        "/client/list",
      );
      console.log("[clientSlice] API response count:", (res.data ?? []).length);
      console.log("[clientSlice] API raw sample (first item):", JSON.stringify((res.data ?? [])[0], null, 2));
      // Normalize: ensure every client uses the custom `id` field, not MongoDB `_id`
      const fresh = (res.data ?? []).map((c: any) => ({
        ...c,
        id: c.id || c._id?.toString() || "",
      }));
      console.log("[clientSlice] Normalized sample (first item):", JSON.stringify(fresh[0], null, 2));
      set({ clients: fresh });
      await writeCache(CACHE_KEY, fresh);
    } catch (error: any) {
      console.error("[clientSlice] ❌ Error fetching clients:", error.message);
      // Only show error toast if we have nothing to display
      if (!cached) {
        ShowToastMessage({ title: error.message ?? "Failed to fetch clients", preset: "error", haptic: "error" });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────
  async deleteClient(clientId) {
    set({ loading: true });
    try {
      await apiFetch(`/client/delete/${encodeURIComponent(clientId)}`, {
        method: "DELETE",
      });
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== clientId),
      }));
    } catch (error: any) {
      console.error("Error deleting client:", error);
      ShowToastMessage({ title: error.message ?? "Failed to delete client", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },
}));
