import { useEffect, useState } from "react";
import { Platform } from "react-native";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (Platform.OS === "web") {
      // Web: use browser navigator.onLine + events
      setIsConnected(navigator.onLine);

      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    } else {
      // Native: poll with expo-network
      let cancelled = false;

      const check = async () => {
        try {
          const Network = await import("expo-network");
          const state = await Network.getNetworkStateAsync();
          if (!cancelled) setIsConnected(state.isConnected ?? true);
        } catch {
          if (!cancelled) setIsConnected(false);
        }
      };

      check();
      const interval = setInterval(check, 3000);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }
  }, []);

  return { isConnected };
}
