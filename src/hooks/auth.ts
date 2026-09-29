import {
  confirmPasswordReset,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { auth, db } from "../context/firebase";
import { apiFetch, clearSession, getStoredUser, saveSession } from "../lib/apiClient";
import { getCurrentUserEmail } from "../lib/auth-utils";
import { sendWhatsAppWelcome } from "../lib/whatsappService";
import { registerFCMToken, removeFCMToken } from "../services/notification.service";
import { useUserStore } from "../stores/userSlice";
import { RegisterUserData } from "../types/auth";
import { FormatFirebaseError, ShowToastMessage } from "../utils/random";

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const setUserData = useUserStore.getState().updateUser;

  const fetchBrandSettings = useUserStore.getState().fetchBrandSettings;


  // ─── Session restore on app startup ──────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await getStoredUser<RegisterUserData>();
        if (stored) {
          setUserData(stored);
          await fetchBrandSettings();
        }
      } catch (error) {
        console.error("Error restoring session:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const fetchUserProfile = async (
    uid: string,
    options?: { showErrors?: boolean },
  ): Promise<RegisterUserData | null> => {
    const showErrors = options?.showErrors ?? true;
    try {
      if (uid) {
        // 1️⃣ Check fashiontally_admins first (sub-admin login)
        const email = getCurrentUserEmail();
        if (email) {
          const adminRef = doc(db, "fashiontally_admins", email);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            const adminData = adminSnap.data();
            return {
              uid,
              ...(adminData as RegisterUserData),
              isAdmin: true,
              invitedBy: adminData.invitedBy ?? null,
              permissions: adminData.permissions ?? null,
            };
          }
        }

        // 2️⃣ Regular user by uid
        const ref = doc(db, "fashiontally_users", uid);
        const docSnap = await getDoc(ref);
        if (docSnap.exists()) {
          return { uid, ...docSnap.data() } as RegisterUserData;
        }
      }

      // 3️⃣ Email fallback
      const email = getCurrentUserEmail();
      if (email) {
        const q = query(
          collection(db, "fashiontally_users"),
          where("email", "==", email),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return { uid, ...snap.docs[0].data() } as RegisterUserData;
        }
      }

      console.warn("[FETCH_USER_PROFILE] No profile found", { uid, email });
      if (showErrors) {
        ShowToastMessage({
          title: "User profile not found",
          preset: "error",
          haptic: "error",
        });
      }
      return null;
    } catch (error: any) {
      console.error("[FETCH_USER_PROFILE] Failed to fetch user profile", {
        uid,
        error,
      });
      if (showErrors) {
        ShowToastMessage({
          title: "Error fetching user",
          message: FormatFirebaseError(error),
          preset: "error",
          haptic: "error",
        });
      }
      return null;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: RegisterUserData }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        },
      );

      const { token, user } = data;

      await saveSession(token, user);
      setUserData(user);
      await fetchBrandSettings();

      // Register this device for push notifications (fire-and-forget)
      registerFCMToken().catch(() => {});

      return data; // truthy — caller in sign-in.tsx checks `if (result)`
    } catch (error: any) {
      console.error("Error signing in:", error);
      ShowToastMessage({
        title: error.message || "Error signing in",
        preset: "error",
        haptic: "error",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    userDataInput: RegisterUserData,
    password: string,
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const userEmail = userDataInput.email.trim().toLowerCase();

      // ── Upload logo to Cloudinary on "Launch Account" ────────────────────
      let logoUrl = "";
      if (userDataInput.logo) {
        if (userDataInput.logo.startsWith("https")) {
          // Already a URL (e.g. re-submit after a previous attempt)
          logoUrl = userDataInput.logo;
        } else {
          // Raw base64 → convert to Blob → upload via FormData (works on web + native)
          const base64Data = userDataInput.logo.startsWith("data:image")
            ? userDataInput.logo.split(",")[1]
            : userDataInput.logo;

          const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
          const preset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

          // Decode base64 to binary and create a Blob
          const byteChars = atob(base64Data);
          const byteArray = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: "image/jpeg" });

          const formData = new FormData();
          formData.append("file", blob, "logo.jpg");
          formData.append("upload_preset", preset!);

          console.log("[SIGNUP] Uploading logo to Cloudinary...");
          const cloudRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: "POST", body: formData },
          );
          const cloudData = await cloudRes.json();
          console.log("[SIGNUP] Cloudinary status:", cloudRes.status, cloudData?.secure_url ?? cloudData?.error);

          if (!cloudRes.ok || !cloudData.secure_url) {
            ShowToastMessage({ title: "Logo upload failed. Please try again.", preset: "error", haptic: "error" });
            return false;
          }
          logoUrl = cloudData.secure_url;
        }
      }

      // ── POST as JSON via apiFetch (same path as login — already proven to work) ──
      console.log("[SIGNUP] Posting to backend:", userEmail);
      console.log("[SIGNUP] Full URL:", `${process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://backend.fashiontally.com/api"}/auth/signup`);
      let data: any;
      try {
        data = await apiFetch<any>("/auth/signup", {
          method: "POST",
          body: JSON.stringify({
            name: userDataInput.name.trim(),
            email: userEmail,
            phone: userDataInput.phone.trim(),
            password,
            country: (userDataInput.country ?? "Nigeria").trim(),
            businessName: userDataInput.businessName.trim(),
            category: (userDataInput.role ?? "Designer").trim(),
            logoUrl,
          }),
        });
      } catch (fetchErr: any) {
        // apiFetch throws on !ok — extract message from the error
        console.error("[SIGNUP] Backend error:", fetchErr?.message);
        ShowToastMessage({ title: fetchErr?.message ?? "Sign up failed", preset: "error", haptic: "error" });
        return false;
      }

      console.log("[SIGNUP] Response body:", JSON.stringify(data, null, 2));

      // ── Auto-login to get the JWT ─────────────────────────────────────────
      const loginData = await apiFetch<{ token: string; user: RegisterUserData }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email: userEmail, password }),
        },
      );

      await saveSession(loginData.token, loginData.user);
      setUserData(loginData.user);
      await fetchBrandSettings();

      // Send WhatsApp welcome (non-blocking — backend also does this)
      const fullPhone = `+234${userDataInput.phone}`;
      sendWhatsAppWelcome(fullPhone, userDataInput.name).catch((err) =>
        console.warn("Welcome message failed:", err),
      );

      return true;
    } catch (error: any) {
      console.error("[SIGNUP] Unexpected error:", error?.message ?? error);
      ShowToastMessage({
        title: "Error signing up",
        message: error.message,
        preset: "error",
        haptic: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Remove this device's FCM token before clearing session
      await removeFCMToken().catch(() => {});
      await clearSession();
      setUserData(null);
      // Also sign out of Firebase so legacy Firestore paths don't retain a stale session
      try { await auth.signOut(); } catch { /* ignore */ }
    } catch (error: any) {
      console.error("Error signing out:", error);
      ShowToastMessage({
        title: "Error signing out",
        preset: "error",
        haptic: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendResetEmail = async (email: string) => {
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      Alert.alert(
        "Email Sent",
        "A password reset link has been sent to your email. Please check your inbox and spam folder.",
        [{ text: "OK" }],
      );
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      ShowToastMessage({
        title: error.message || "Error sending reset email",
        preset: "error",
        haptic: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const confrimResetCode = async (otp: string, newPassword: string) => {
    setLoading(true);
    try {
      await confirmPasswordReset(auth, otp, newPassword);
    } catch (error) {
      console.error("Error sending reset password:", error);
      //   throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      // Re-read the current user from the store and reload brand settings
      const currentUser = useUserStore.getState().user;
      if (!currentUser) return;
      setUserData(currentUser);
      await fetchBrandSettings();
    } catch (error: any) {
      console.error("Error refreshing user data:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    refreshUser,
    signIn,
    signOut,
    signUp,
    sendResetEmail,
    confrimResetCode,
  };
}
