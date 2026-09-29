/**
 * hooks/useNotificationPrompt.ts
 *
 * Checks notification permission on dashboard load.
 *
 * - "undetermined" → shows soft pre-prompt modal after 1.5s
 * - "granted" but no token → auto-registers silently (recovery)
 * - "denied" → shows "open settings" modal after 1.5s
 *
 * Uses AsyncStorage (not a module-level flag) to track whether the
 * prompt has been shown, so it resets correctly after logout/login.
 *
 * The prompt only shows once per login session — stored in AsyncStorage
 * under NOTIFICATION_PROMPTED_KEY which is cleared on logout by removeFCMToken().
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useRef, useState } from "react";
import {
  FCM_TOKEN_KEY,
  NOTIFICATION_PROMPTED_KEY,
  registerFCMToken,
} from "../services/notification.service";

const isExpoGo = Constants.appOwnership === "expo";

export type NotificationPromptState =
  | "idle"     // nothing to show
  | "ask"      // permission undetermined — show soft pre-prompt
  | "denied";  // permission denied — show "open settings" prompt

export function useNotificationPrompt() {
  const [promptState, setPromptState] = useState<NotificationPromptState>("idle");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (isExpoGo || checkedRef.current) return;
    checkedRef.current = true;

    const check = async () => {
      // Lazy-load expo-notifications — only available in dev builds
      let Notifications: typeof import("expo-notifications") | null = null;
      try {
        Notifications = require("expo-notifications");
      } catch {
        return;
      }

      // Check if we already prompted this login session
      // NOTIFICATION_PROMPTED_KEY is cleared on logout so it resets correctly
      const alreadyPrompted = await AsyncStorage.getItem(NOTIFICATION_PROMPTED_KEY);
      if (alreadyPrompted) {
        // Already prompted — but still silently recover if granted + no token
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") {
          const stored = await AsyncStorage.getItem(FCM_TOKEN_KEY);
          if (!stored) {
            registerFCMToken().catch(() => {});
          }
        }
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();

      if (status === "granted") {
        // Permission already granted — check if token is registered
        const stored = await AsyncStorage.getItem(FCM_TOKEN_KEY);
        if (!stored) {
          // Token missing (e.g. first launch after reinstall) — re-register silently
          registerFCMToken().catch(() => {});
        }
        // Mark as prompted so we don't re-check unnecessarily
        await AsyncStorage.setItem(NOTIFICATION_PROMPTED_KEY, new Date().toISOString());
        return;
      }

      if (status === "undetermined") {
        // Show our soft pre-prompt first — better UX than jumping straight to OS dialog
        setTimeout(() => setPromptState("ask"), 1500);
        await AsyncStorage.setItem(NOTIFICATION_PROMPTED_KEY, new Date().toISOString());
        return;
      }

      if (status === "denied") {
        // Show "open settings" prompt
        setTimeout(() => setPromptState("denied"), 1500);
        await AsyncStorage.setItem(NOTIFICATION_PROMPTED_KEY, new Date().toISOString());
        return;
      }
    };

    check().catch(() => {});
  }, []);

  const dismiss = () => setPromptState("idle");

  // Call this after the user enables notifications from the modal
  // so the prompt doesn't re-appear this session
  const markEnabled = () => {
    setPromptState("idle");
    AsyncStorage.setItem(NOTIFICATION_PROMPTED_KEY, new Date().toISOString()).catch(() => {});
  };

  return { promptState, dismiss, markEnabled };
}
