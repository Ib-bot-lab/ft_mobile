import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { ForceUpdateScreen } from "../components/shared/ForceUpdateScreen";
import { NoNetworkBanner } from "../components/shared/NoNetworkBanner";
import { useAuth } from "../hooks/auth";
import { useForceUpdate } from "../hooks/useForceUpdate";
import { useSubscriptionGuard } from "../hooks/useSubscriptionGuard";
import { getCurrentUserEmail, getCurrentUserId } from "../lib/auth-utils";
import { useUserStore } from "../stores/userSlice";

// import { useColorScheme } from '@/hooks/use-color-scheme';

// export const unstable_settings = {
//   anchor: "(tabs)",
// };

// const WIDTH = Dimensions.get("window").width;

// const drawerOptions = {
//   headerShown: false,
//   drawerPosition: "left",
//   drawerStyle: {
//     backgroundColor: "black",
//     width: Math.max(WIDTH * 0.7, 270),
//   },
//   drawerActiveTintColor: "#000",
//   drawerInactiveTintColor: "#666",
//   drawerLabelStyle: {
//     fontSize: 16,
//     fontWeight: "500",
//   },
//   overlayColor: "rgba(0, 0, 0, 0.5)",
//   swipeEnabled: true,
//   swipeEdgeWidth: DrawerContentWidth,
// } as const;

export default function RootLayout() {
  const [loaded] = useFonts({
    regular: require("@/assets/fonts/Baloo2-Regular.ttf"),
    medium: require("@/assets/fonts/Baloo2-Medium.ttf"),
    semibold: require("@/assets/fonts/Baloo2-SemiBold.ttf"),
    bold: require("@/assets/fonts/Baloo2-Bold.ttf"),
    black: require("@/assets/fonts/Baloo2-ExtraBold.ttf"),
    balo: require("@/assets/fonts/Baloo-Regular.ttf"),
  });

  const user = useUserStore((state) => state.user);
  const { loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const { checked, forceUpdate, updateMessage, storeUrl } = useForceUpdate();

  useEffect(() => {
    if (loading || !loaded) return;

    const inTab = segments[0] === "(tabs)";
    const inProtected = segments[0] === "protected";
    const inAuth = segments[0] === "(auth)";

    const inForgetPassword =
      pathname.split("?")[0] === "/screen/forget-password";
    // const inSubModal = pathname.split("?")[0] === "subscription-modal";

    const isInsideAuthArea = inTab || inProtected;

    if (user) {
      if (!isInsideAuthArea && !inForgetPassword) {
        router.replace("/(tabs)/Dashboard");
        console.log("Redirecting logged-in user to Dashboard");
      }
    } else {
      if (!inAuth) {
        router.replace("/(auth)/sign-in");
        console.log("Redirecting guest to Sign-In", loaded, loading);
      }
    }
  }, [loading, router, segments, user, loaded, pathname]);

  // Expo OTA Updates once app starts
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.info("New update available, fetching...");
          await Updates.fetchUpdateAsync();
          console.info("Update fetched, reloading app...");
          await Updates.reloadAsync();
        } else {
          console.info("No updates found.");
        }
      } catch (err) {
        console.error("Update check failed:", err);
      }
    };

    if (!__DEV__) checkForUpdates();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const currentRoute = pathname.split("?")[0];
    console.log(`Current route: ${currentRoute}`);
  }, [pathname]);

  const { loading: isLoading, isSubscribed } = useSubscriptionGuard({
    email: user?.email ?? getCurrentUserEmail(),
    uuid: user?.uid ?? getCurrentUserId(),
    paymentUrl: "https://www.fashiontally.com/login",
  });

  // if (isLoading) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
  //       <ActivityIndicator size="large" />
  //     </View>
  //   );
  // }

  // if (!isSubscribed) {
  //   return null;
  // }

  if (!loaded) {
    return null;
  }

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
          <NoNetworkBanner />
          <StatusBar style="auto" translucent backgroundColor="transparent" />
          {/* Force update — rendered on top of everything, cannot be dismissed */}
          {checked && forceUpdate && (
            <ForceUpdateScreen message={updateMessage} storeUrl={storeUrl} />
          )}
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </>
  );
}
