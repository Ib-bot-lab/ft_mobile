import { create } from "zustand";
import { apiFetch } from "../lib/apiClient";
import { Design } from "../types/designs";
import { readCache, writeCache } from "../utils/storeCache";
import { ShowToastMessage } from "../utils/random";

const CACHE_KEY = "store_designs";

interface DesignState {
  designs: Design[];
  loading: boolean;
  createDesign(
    design: Omit<Design, "id" | "createdAt"> & { userEmail: string },
  ): Promise<void>;
  getDesignsByTailor(email: string): Promise<void>;
  editDesign(itemId: string, updates: Partial<Design>): Promise<void>;
  deleteDesign(designId: string): Promise<void>;
}

/**
 * Upload a local image URI directly to Cloudinary using XMLHttpRequest.
 * XHR uses the native RN network layer, which correctly handles
 * { uri, name, type } file objects in FormData without any Blob/ArrayBuffer.
 */
const uploadDesignImageToCloudinary = (uri: string): Promise<string> => {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset    = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const ext      = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file",          { uri, name: `design.${ext}`, type: mimeType } as any);
    form.append("upload_preset", preset);
    form.append("folder",        "designs");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data?.error?.message || "Cloudinary upload failed"));
        }
      } catch {
        reject(new Error("Failed to parse Cloudinary response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
    xhr.send(form);
  });
};

export const useDesignStore = create<DesignState>((set, get) => ({
  designs: [],
  loading: false,

  // ─── CREATE ────────────────────────────────────────────────────────────────
  async createDesign(payload) {
    if (!payload.imageUrl) {
      ShowToastMessage({ title: "Please add a design image", preset: "error", haptic: "error" });
      return;
    }
    set({ loading: true });
    try {
      // If imageUrl is a local URI (not already on Cloudinary), upload it first
      let imageUrl = payload.imageUrl;
      if (!imageUrl.startsWith("https")) {
        // Strip the data:image/...;base64, prefix to get a usable URI
        const uri = imageUrl.startsWith("data:") ? imageUrl : imageUrl;
        imageUrl = await uploadDesignImageToCloudinary(uri);
      }

      const { imageUrl: _old, ...rest } = payload;
      const json = await apiFetch<{ success: boolean; data: Design }>(
        "/design/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.stringify({ ...rest, imageUrl }) }),
        },
      );
      set((state) => ({ designs: [json.data, ...state.designs] }));
    } catch (error: any) {
      console.error("Error creating design:", error);
      ShowToastMessage({ title: error.message ?? "Failed to create design", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── LIST ──────────────────────────────────────────────────────────────────
  async getDesignsByTailor(_email) {
    // 1. Show cached data immediately if available
    const cached = await readCache<Design[]>(CACHE_KEY);
    if (cached) set({ designs: cached });

    // 2. Fetch fresh data (show spinner only when cache is empty)
    if (!cached) set({ loading: true });
    try {
      const res = await apiFetch<{ success: boolean; data: Design[] }>(
        "/design/list?type=design",
      );
      const fresh = res.data ?? [];
      set({ designs: fresh });
      await writeCache(CACHE_KEY, fresh);
    } catch (error: any) {
      console.error("Error getting designs:", error);
      if (!cached) {
        ShowToastMessage({ title: error.message ?? "Failed to fetch designs", preset: "error", haptic: "error" });
      }
    } finally {
      set({ loading: false });
    }
  },

  // ─── EDIT ──────────────────────────────────────────────────────────────────
  async editDesign(itemId, updates) {
    set({ loading: true });
    try {
      // Upload new image if it's a local URI
      let imageUrl = updates.imageUrl;
      if (imageUrl && !imageUrl.startsWith("https")) {
        imageUrl = await uploadDesignImageToCloudinary(imageUrl);
      }

      const { imageUrl: _old, ...rest } = updates;
      const json = await apiFetch<{ success: boolean; data: Design }>(
        `/design/edit/${encodeURIComponent(itemId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.stringify({ ...rest, ...(imageUrl ? { imageUrl } : {}) }) }),
        },
      );
      set((state) => ({
        designs: state.designs.map((d) => (d.id === json.data.id ? json.data : d)),
      }));
      ShowToastMessage({ title: "Design updated successfully", preset: "done", haptic: "success" });
    } catch (error: any) {
      console.error("Error updating design:", error);
      ShowToastMessage({ title: error.message ?? "Update failed", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },

  // ─── DELETE ────────────────────────────────────────────────────────────────
  async deleteDesign(designId) {
    set({ loading: true });
    try {
      await apiFetch(`/design/delete/${encodeURIComponent(designId)}`, {
        method: "DELETE",
      });
      set((state) => ({
        designs: state.designs.filter((d) => d.id !== designId),
      }));
    } catch (error: any) {
      console.error("Error deleting design:", error);
      ShowToastMessage({ title: error.message ?? "Failed to delete design", preset: "error", haptic: "error" });
    } finally {
      set({ loading: false });
    }
  },
}));
