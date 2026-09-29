import { create } from "zustand";
import { emptyUserData, RegisterUserData } from "../types/auth";

interface AuthState {
  userData: RegisterUserData;
  updateUserData: (data: Partial<RegisterUserData>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userData: emptyUserData,
  updateUserData(data) {
    set({
      userData: {
        ...get().userData,
        ...data,
      },
    });
  },
}));
