import { getEffectiveEmail } from "./effectiveEmail";

/**
 * Returns the effective email for data queries.
 * For sub-admins: returns the main admin's email (invitedBy).
 * For everyone else: returns their own email.
 *
 * Falls back to the Zustand store when effectiveEmail hasn't been set yet.
 */
export const getCurrentUserEmail = (): string => {
  const effective = getEffectiveEmail();
  if (effective) return effective;

  // Lazy import to avoid circular dependency at module load time
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useUserStore } = require("../stores/userSlice");
  const user = useUserStore.getState().user;
  return user?.email ?? "";
};

/**
 * Get the current authenticated user's ID from the Zustand store.
 */
export const getCurrentUserId = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useUserStore } = require("../stores/userSlice");
  const user = useUserStore.getState().user;
  return user?.uid ?? "";
};

/**
 * Get the current authenticated user's data from the Zustand store.
 */
export const getCurrentUser = (): { uid: string; email: string } => {
  const email = getCurrentUserEmail();
  const uid = getCurrentUserId();
  return { uid, email };
};

/**
 * Check if a user is currently authenticated.
 */
export const isUserAuthenticated = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useUserStore } = require("../stores/userSlice");
  return useUserStore.getState().user !== null;
};
