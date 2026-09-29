import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { Appointment } from "../types/appointment";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "../utils/calender";
import { readCache, writeCache } from "../utils/storeCache";
import { ShowToastMessage } from "../utils/random";

const CACHE_KEY = "store_appointments";

interface AppointmentState {
  appointments: Appointment[];
  loading: boolean;
  getAppointmentsByTailor(email: string): Promise<void>;
  saveAppointment(appointment: Appointment): Promise<void>;
  getAppointmentById(id: string): Promise<Appointment | null>;
  getAppointmentsByDate(email: string, date: string): Promise<Appointment[]>;
  editAppoinment(itemId: string, updates: Partial<Appointment>): Promise<void>;
  deleteAppointment(appointmentId: string): Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  loading: false,

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async getAppointmentsByTailor(_email) {
    const cached = await readCache<Appointment[]>(CACHE_KEY);
    if (cached) set({ appointments: cached });

    if (!cached) set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Appointment[] }>(
        "/appointment/list",
      );
      const fresh = res.data ?? [];
      set({ appointments: fresh });
      await writeCache(CACHE_KEY, fresh);
    } catch (error: any) {
      console.error("Error getting appointments:", error);
      if (!cached) {
        ShowToastMessage({ title: error.message ?? "Failed to fetch appointments", preset: "error", haptic: "error" });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async saveAppointment(appointment) {
    set({ loading: true });
    let calendarEventId = appointment.calendarEventId;
    try {
      // Create device calendar event first (non-blocking if it fails)
      if (!calendarEventId) {
        calendarEventId = await createCalendarEvent(appointment);
      }

      const res = await apiFetch<{ success: boolean; data: Appointment }>(
        "/appointment/create",
        {
          method: "POST",
          body: JSON.stringify({ ...appointment, calendarEventId }),
        },
      );
      const saved = res.data;
      set((state) => ({
        appointments: state.appointments.some((a) => a.id === saved.id)
          ? state.appointments.map((a) => (a.id === saved.id ? saved : a))
          : [saved, ...state.appointments],
      }));
      ShowToastMessage({ title: "Appointment created", preset: "done", haptic: "success" });
    } catch (error: any) {
      console.error("Error saving appointment:", error);
      ShowToastMessage({ title: error.message ?? "Error saving appointment", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  async getAppointmentById(id) {
    set({ loading: true });
    try {
      const cached = get().appointments.find((a) => a.id === id);
      if (cached) return cached;

      const res = await apiFetch<{ success: boolean; data: Appointment }>(
        `/appointment/get/${encodeURIComponent(id)}`,
      );
      return res.data ?? null;
    } catch (error: any) {
      console.error("Error getting appointment:", error);
      ShowToastMessage({ title: error.message ?? "Failed to fetch appointment", preset: "error", haptic: "error" });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // ─── GET BY DATE — filter in-memory (avoids extra round-trip) ─────────────
  async getAppointmentsByDate(_email, date) {
    // Filter from already-loaded appointments; sorted by time ascending
    const results = get()
      .appointments.filter((a) => {
        const d = new Date(a.date);
        const target = new Date(date);
        return (
          d.getFullYear() === target.getFullYear() &&
          d.getMonth() === target.getMonth() &&
          d.getDate() === target.getDate()
        );
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return results;
  },

  // ─── EDIT ──────────────────────────────────────────────────────────────────
  async editAppoinment(itemId, updates) {
    set({ loading: true });
    const current = get().appointments.find((a) => a.id === itemId);
    try {
      // Keep device calendar in sync
      if (current?.calendarEventId) {
        await updateCalendarEvent(current.calendarEventId, {
          ...current,
          ...updates,
        } as Appointment);
      }

      const res = await apiFetch<{ success: boolean; data: Appointment }>(
        `/appointment/edit/${encodeURIComponent(itemId)}`,
        {
          method: "PUT",
          body: JSON.stringify(updates),
        },
      );
      const updated = res.data;
      set((state) => ({
        appointments: state.appointments.map((a) =>
          a.id === updated.id ? updated : a,
        ),
      }));
      ShowToastMessage({ title: "Appointment updated successfully", preset: "done", haptic: "success" });
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      ShowToastMessage({ title: error.message ?? "Update failed", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────
  async deleteAppointment(appointmentId) {
    set({ loading: true });
    const appointment = get().appointments.find((a) => a.id === appointmentId);
    try {
      // Remove from device calendar first
      if (appointment?.calendarEventId) {
        await deleteCalendarEvent(appointment.calendarEventId);
      }

      await apiFetch(`/appointment/delete/${encodeURIComponent(appointmentId)}`, {
        method: "DELETE",
      });
      set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== appointmentId),
      }));
      ShowToastMessage({ title: "Appointment deleted successfully", preset: "done", haptic: "success" });
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      ShowToastMessage({ title: error.message ?? "Failed to delete appointment", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },
}));
