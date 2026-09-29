import { useAuth } from "@/src/hooks/auth";
import { Colors } from "@/src/constants/theme";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { checkSubscriptionStatus } from "../../utils/subscription";
import { Zap, LogOut, RefreshCw } from "lucide-react-native";

WebBrowser.maybeCompleteAuthSession();

const PAYMENT_URL = "https://www.fashiontally.com/login";

export default function SubscriptionModal() {
  const router = useRouter();
  const { email, uuid } = useLocalSearchParams();
  const { signOut } = useAuth();
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    setChecking(true);
    const res = await checkSubscriptionStatus(String(email), String(uuid));
    setChecking(false);
    if (res.isSubscribed) {
      router.back();
    }
  };

  useEffect(() => {
    verify();
  }, []);

  const handleManage = async () => {
    try {
      const result = await WebBrowser.openBrowserAsync(PAYMENT_URL, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        showTitle: true,
      });
      if (result.type === "dismiss" || result.type === "cancel") {
        await verify();
      }
    } catch {
      // silent
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  return (
    <SafeAreaView edges={["left","right","bottom"]} style={styles.container}>
      {checking ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <View style={styles.inner}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Zap size={scale(36)} color={Colors.primary} fill={Colors.primary} />
          </View>

          {/* Text */}
          <Text style={styles.title}>Subscription Expired</Text>
          <Text style={styles.subtitle}>
            Your subscription has expired. Log in to the web to renew, upgrade, or manage your plan.
          </Text>

          {/* Manage button */}
          <TouchableOpacity style={styles.manageBtn} onPress={handleManage}>
            <Text style={styles.manageBtnText}>Renew Subscription</Text>
          </TouchableOpacity>

          {/* Refresh */}
          <TouchableOpacity style={styles.refreshRow} onPress={verify}>
            <RefreshCw size={scale(14)} color={Colors.text.gray} />
            <Text style={styles.refreshText}>Already renewed? Tap to refresh</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <LogOut size={scale(14)} color="rgba(220, 38, 38, 1)" />
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    alignItems: "center",
    paddingHorizontal: spacing(32),
    gap: spacing(12),
  },
  iconWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(24),
    backgroundColor: Colors.plight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing(8),
  },
  title: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(24),
    color: "rgba(17, 24, 39, 1)",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    color: "rgba(108, 114, 120, 1)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing(8),
  },
  manageBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: spacing(14),
    paddingHorizontal: spacing(32),
    alignItems: "center",
    width: "100%",
  },
  manageBtnText: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(15),
    color: "white",
  },
  refreshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(6),
    marginTop: spacing(4),
  },
  refreshText: {
    fontFamily: "regular",
    fontSize: scaleFontSize(13),
    color: "rgba(108, 114, 120, 1)",
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(6),
    marginTop: spacing(8),
  },
  logoutText: {
    fontFamily: "medium",
    fontSize: scaleFontSize(13),
    color: "rgba(220, 38, 38, 1)",
  },
});
