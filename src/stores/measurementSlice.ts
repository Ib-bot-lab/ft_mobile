import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { ShowToastMessage } from "../utils/random";

export interface Measurement {
  id: string;
  clientId: string; // client email
  userEmail: string;
  name: string;
  value: string;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

interface MeasurementState {
  measurements: Measurement[];
  loading: boolean;
  getMeasurements: (clientEmail: string) => Promise<void>;
  addMeasurements: (clientEmail: string, items: { name: string; value: string; unit?: string }[]) => Promise<boolean>;
  editMeasurement: (id: string, data: { name: string; value: string; unit: string }) => Promise<boolean>;
  deleteMeasurement: (id: string) => Promise<boolean>;
}

export const useMeasurementStore = create<MeasurementState>((set, get) => ({
  measurements: [],
  loading: false,

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async getMeasurements(clientEmail) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Measurement[] }>(
        `/measurement/list/${encodeURIComponent(clientEmail)}`,
      );
      set({ measurements: res.data ?? [] });
    } catch (error: any) {
      console.error("Error fetching measurements:", error);
      ShowToastMessage({ title: error.message ?? "Failed to fetch measurements", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── CREATE (batch) ────────────────────────────────────────────────────────
  async addMeasurements(clientEmail, items) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Measurement[]; warning?: string }>(
        "/measurement/create",
        {
          method: "POST",
          body: JSON.stringify({ clientId: clientEmail, measurements: items }),
        },
      );
      if (res.warning) {
        ShowToastMessage({ title: res.warning, preset: "error", haptic: "warning" });
      }
      set((state) => ({ measurements: [...state.measurements, ...res.data] }));
      return true;
    } catch (error: any) {
      console.error("Error adding measurements:", error);
      ShowToastMessage({ title: error.message ?? "Failed to save measurement", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─── EDIT ──────────────────────────────────────────────────────────────────
  async editMeasurement(id, data) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Measurement }>(
        `/measurement/edit/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
      );
      const updated = res.data;
      set((state) => ({
        measurements: state.measurements.map((m) => (m.id === updated.id ? updated : m)),
      }));
      ShowToastMessage({ title: "Measurement updated", preset: "done", haptic: "success" });
      return true;
    } catch (error: any) {
      console.error("Error editing measurement:", error);
      ShowToastMessage({ title: error.message ?? "Failed to update measurement", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────
  async deleteMeasurement(id) {
    set({ loading: true });
    try {
      await apiFetch(`/measurement/delete/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      set((state) => ({
        measurements: state.measurements.filter((m) => m.id !== id),
      }));
      ShowToastMessage({ title: "Measurement deleted", preset: "done", haptic: "success" });
      return true;
    } catch (error: any) {
      console.error("Error deleting measurement:", error);
      ShowToastMessage({ title: error.message ?? "Failed to delete measurement", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
