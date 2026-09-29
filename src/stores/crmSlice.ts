import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { ClientFeedback, EmailCampaign, LoyaltyMember } from "../types/crm";
import { readCache, writeCache } from "../utils/storeCache";
import { ShowToastMessage } from "../utils/random";

const CACHE_LOYALTY   = "store_loyalty_members";
const CACHE_FEEDBACKS = "store_feedbacks";

interface CrmState {
  loyaltyMembers: LoyaltyMember[];
  clientFeedbacks: ClientFeedback[];
  campaigns: EmailCampaign[];
  loading: boolean;

  // ─── Loyalty Members ───────────────────────────────────────────────────────
  getLoyaltyMembers: () => Promise<void>;
  addLoyaltyMember: (member: Omit<LoyaltyMember, "id">) => Promise<boolean>;
  editLoyaltyMember: (id: string, updatedData: LoyaltyMember) => Promise<boolean>;
  deleteMemeber: (id: string) => Promise<boolean>;

  // ─── Feedback ──────────────────────────────────────────────────────────────
  getFeedBacks: () => Promise<void>;
  addFeeback: (feedback: Omit<ClientFeedback, "id">) => Promise<boolean>;
  editFeedback: (id: string, updatedData: ClientFeedback) => Promise<boolean>;
  replyToFeedback: (id: string, reply: string) => Promise<boolean>;
  updateFeedbackReply: (id: string, reply: string) => Promise<boolean>;
  deleteFeedback: (id: string) => Promise<boolean>;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  loyaltyMembers: [],
  clientFeedbacks: [],
  campaigns: [],
  loading: false,

  // ─── LIST loyalty members ──────────────────────────────────────────────────
  async getLoyaltyMembers() {
    const cached = await readCache<LoyaltyMember[]>(CACHE_LOYALTY);
    if (cached) set({ loyaltyMembers: cached });

    if (!cached) set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: LoyaltyMember[] }>(
        "/loyalty-member/list",
      );
      const sorted = (res.data ?? []).slice().sort(
        (a, b) => (b.points || 0) - (a.points || 0),
      );
      set({ loyaltyMembers: sorted });
      await writeCache(CACHE_LOYALTY, sorted);
    } catch (error: any) {
      console.error("Error fetching loyalty members:", error);
      if (!cached) {
        ShowToastMessage({ title: error.message ?? "Failed to fetch members", preset: "error", haptic: "error" });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ─── CREATE loyalty member ─────────────────────────────────────────────────
  async addLoyaltyMember(member) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: LoyaltyMember }>(
        "/loyalty-member/create",
        {
          method: "POST",
          body: JSON.stringify(member),
        },
      );
      const saved = res.data;
      set((state) => ({
        loyaltyMembers: [saved, ...state.loyaltyMembers],
      }));
      return true;
    } catch (error: any) {
      console.error("Error adding loyalty member:", error);
      ShowToastMessage({ title: error.message ?? "Failed to add member", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─── EDIT loyalty member ───────────────────────────────────────────────────
  async editLoyaltyMember(id, updatedData) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: LoyaltyMember }>(
        `/loyalty-member/edit/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedData),
        },
      );
      const updated = res.data;
      set((state) => ({
        loyaltyMembers: state.loyaltyMembers.map((m) =>
          m.id === updated.id ? updated : m,
        ),
      }));
      return true;
    } catch (error: any) {
      console.error("Error editing loyalty member:", error);
      ShowToastMessage({ title: error.message ?? "Failed to update member", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─── DELETE loyalty member ─────────────────────────────────────────────────
  async deleteMemeber(id) {
    set({ loading: true });
    try {
      await apiFetch(`/loyalty-member/delete/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      set((state) => ({
        loyaltyMembers: state.loyaltyMembers.filter((m) => m.id !== id),
      }));
      ShowToastMessage({ title: "Member deleted", preset: "done", haptic: "success" });
      return true;
    } catch (error: any) {
      console.error("Error deleting loyalty member:", error);
      ShowToastMessage({ title: error.message ?? "Failed to delete member", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─── LIST feedback ─────────────────────────────────────────────────────────
  async getFeedBacks() {
    const cached = await readCache<ClientFeedback[]>(CACHE_FEEDBACKS);
    if (cached) set({ clientFeedbacks: cached });

    if (!cached) set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: ClientFeedback[] }>(
        "/feedback/list",
      );
      const sorted = (res.data ?? []).slice().sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        return bTime - aTime;
      });
      set({ clientFeedbacks: sorted });
      await writeCache(CACHE_FEEDBACKS, sorted);
    } catch (error: any) {
      console.error("Error fetching feedback:", error);
      if (!cached) {
        ShowToastMessage({ title: error.message ?? "Failed to fetch feedback", preset: "error", haptic: "error" });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ─── CREATE feedback ───────────────────────────────────────────────────────
  async addFeeback(feedback) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: ClientFeedback }>(
        "/feedback/create",
        {
          method: "POST",
          body: JSON.stringify(feedback),
        },
      );
      const saved = res.data;
      set((state) => ({
        clientFeedbacks: [saved, ...state.clientFeedbacks],
      }));
      return true;
    } catch (error: any) {
      console.error("Error adding feedback:", error);
      ShowToastMessage({ title: error.message ?? "Failed to add feedback", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─── EDIT feedback ─────────────────────────────────────────────────────────
  async editFeedback(id, updatedData) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: ClientFeedback }>(
        `/feedback/edit/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: JSON.stringify(updatedData),
        },
      );
      const updated = res.data;
      set((state) => ({
        clientFeedbacks: state.clientFeedbacks.map((f) =>
          f.id === updated.id ? updated : f,
        ),
      }));
      return true;
    } catch (error: any) {
      console.error("Error editing feedback:", error);
      ShowToastMessage({ title: error.message ?? "Failed to update feedback", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─── REPLY to feedback ─────────────────────────────────────────────────────
  async replyToFeedback(id, reply) {
    set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: ClientFeedback }>(
        `/feedback/reply/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          body: JSON.stringify({ reply }),
        },
      );
      const updated = res.data;
      set((state) => ({
        clientFeedbacks: state.clientFeedbacks.map((f) =>
          f.id === updated.id ? updated : f,
        ),
      }));
      return true;
    } catch (error: any) {
      console.error("Error replying to feedback:", error);
      ShowToastMessage({ title: error.message ?? "Failed to send reply", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  // ─── UPDATE feedback reply (alias → same endpoint) ─────────────────────────
  async updateFeedbackReply(id, reply) {
    return get().replyToFeedback(id, reply);
  },

  // ─── DELETE feedback ───────────────────────────────────────────────────────
  async deleteFeedback(id) {
    set({ loading: true });
    try {
      await apiFetch(`/feedback/delete/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      set((state) => ({
        clientFeedbacks: state.clientFeedbacks.filter((f) => f.id !== id),
      }));
      ShowToastMessage({ title: "Feedback deleted", preset: "done", haptic: "success" });
      return true;
    } catch (error: any) {
      console.error("Error deleting feedback:", error);
      ShowToastMessage({ title: error.message ?? "Failed to delete feedback", preset: "error", haptic: "error" });
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
