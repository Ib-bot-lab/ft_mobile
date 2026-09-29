import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUserStore } from "../stores/userSlice";
import { checkSubscriptionStatus } from "../utils/subscription";

const resolveCreatedAt = (createdAt: any): Date | null => {
  if (!createdAt) return null;
  if (typeof createdAt?.toDate === "function") return createdAt.toDate();
  if (typeof createdAt?.seconds === "number") {
    return new Date(createdAt.seconds * 1000);
  }
  const d = new Date(createdAt);
  return isNaN(d.getTime()) ? null : d;
};

type UseSubscriptionGuardProps = {
  email?: string;
  uuid?: string;
  paymentUrl: string;
  /**
   * If true, automatically redirect to subscription modal when not subscribed
   * @default true
   */
  autoRedirect?: boolean;
};

export const useSubscriptionGuard = ({
  email,
  uuid,
  paymentUrl,
  autoRedirect = true,
}: UseSubscriptionGuardProps) => {
  const lastCheckedKeyRef = useRef("");
  const isCheckingRef = useRef(false);

  const [state, setState] = useState({
    loading: true,
    isSubscribed: false,
  });

  const hasUser = useUserStore((state) => !!state.user);
  const user = useUserStore((state) => state.user);

  const redirectToSubscriptionModal = useCallback(
    (resolvedEmail?: string, resolvedUuid?: string) => {
      router.replace({
        pathname: "/protected/subscription-modal",
        params: {
          email: resolvedEmail || "",
          uuid: resolvedUuid || "",
          paymentUrl,
        },
      });
    },
    [paymentUrl],
  );

  const runCheck = useCallback(
    async (resolvedEmail: string, resolvedUuid: string) => {
      if (isCheckingRef.current) return;
      try {
        isCheckingRef.current = true;
        if (!resolvedEmail && !resolvedUuid) {
          setState({ loading: false, isSubscribed: false });
          return;
        }

        const result = await checkSubscriptionStatus(resolvedEmail, resolvedUuid);
        console.log("Subscription status:", result);

        if (result.isSubscribed) {
          setState({ loading: false, isSubscribed: true });
          return;
        }

        // Not subscribed — check 3-day creation grace period
        const createdAt = resolveCreatedAt(user?.createdAt);
        const daysSinceCreation = createdAt
          ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          : Infinity;

        if (daysSinceCreation <= 3) {
          console.log("Within 3-day trial grace period, allowing access");
          setState({ loading: false, isSubscribed: true });
          return;
        }

        setState({ loading: false, isSubscribed: false });

        if (autoRedirect) {
          redirectToSubscriptionModal(resolvedEmail, resolvedUuid);
        }
      } catch (err) {
        console.error("Subscription check failed:", err);
        setState({ loading: false, isSubscribed: false });

        if (autoRedirect) {
          redirectToSubscriptionModal(resolvedEmail, resolvedUuid);
        }
      } finally {
        isCheckingRef.current = false;
      }
    },
    [autoRedirect, redirectToSubscriptionModal, user?.createdAt],
  );

  useEffect(() => {
    if (!hasUser) {
      lastCheckedKeyRef.current = "";
      setState({ loading: false, isSubscribed: false });
      return;
    }

    const resolvedEmail = email || user?.email || "";
    const resolvedUuid = uuid || user?.uid || "";
    const checkKey = `${resolvedEmail}:${resolvedUuid}`;

    if (!resolvedEmail && !resolvedUuid) {
      setState((prev) => ({ ...prev, loading: true }));
      return;
    }

    if (lastCheckedKeyRef.current === checkKey) return;

    lastCheckedKeyRef.current = checkKey;
    runCheck(resolvedEmail, resolvedUuid);
  }, [email, hasUser, runCheck, user?.email, user?.uid, uuid]);

  return state;
};
