import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { BackHandler, ToastAndroid } from "react-native";

export default function useBackHandler() {
  const router = useRouter();
  const lastPress = useRef(0);

  useEffect(() => {
    const onBackPress = () => {
      // If can go back → navigate normally
      if (router.canGoBack()) {
        router.back();
        return true;
      }

      // If on root → require double press
      const now = Date.now();

      if (now - lastPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastPress.current = now;
      ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => sub.remove();
  }, [router]);
}
