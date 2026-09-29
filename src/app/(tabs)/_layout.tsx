import { DrawerContent, DrawerContentWidth } from "@/src/components/drawer/DrawerContent";
import { PermissionGate } from "@/src/components/shared/PermissionGate";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import Drawer from "expo-router/drawer";
import { StatusBar } from "expo-status-bar";
import { Dimensions } from "react-native";

const WIDTH = Dimensions.get("window").width;

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <PermissionGate>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerPosition: "left",
          drawerStyle: {
            backgroundColor: isDark ? "#0f0f0f" : "#ffffff",
            width: Math.max(WIDTH * 0.7, 270),
          },
          drawerActiveTintColor: Colors.primary,
          drawerInactiveTintColor: "#666",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          swipeEnabled: true,
          swipeEdgeWidth: DrawerContentWidth,
        }}
        drawerContent={(props) => <DrawerContent {...props} />}
      />
    </PermissionGate>
  );
}
