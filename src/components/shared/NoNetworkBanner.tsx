import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

/**
 * Renders as a normal flow element at the bottom of the screen.
 * When offline it animates in (pushes content up).
 * When back online it animates out (content settles back down).
 * NOT fixed or absolute — it lives in the document flow.
 */
export function NoNetworkBanner() {
  const { isConnected } = useNetworkStatus();
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isConnected ? 0 : 36,
      duration: 280,
      useNativeDriver: false,
    }).start();
  }, [isConnected, heightAnim]);

  return (
    <Animated.View style={[styles.banner, { height: heightAnim }]}>
      <Text style={styles.text}>⚠ No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#f5f5f5",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
