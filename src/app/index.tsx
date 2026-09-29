import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Colors } from "../constants/theme";

const IndexScreen = () => {
  // const { loading, signOut } = useAuth();
  // const user = useUserStore((state) => state.user);
  // useEffect(() => {
  //   setTimeout(() => {
  //     console.log("user", { user, loading });
  //     if (!user) {
  //       router.replace("/(auth)/sign-in");
  //     }
  //   }, 100);
  // }, [user]);
  return (
    <View style={styles.container}>
      <ActivityIndicator size={"small"} color={Colors.primary} />
    </View>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
