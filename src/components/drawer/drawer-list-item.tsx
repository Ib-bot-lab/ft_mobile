import { Colors } from "@/src/constants/theme";
import { DrawerItem } from "@/src/stores/navigation/drawerSlice";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { usePathname } from "expo-router";
import { memo, type FC } from "react";
import { ImageBackground, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { createAnimatedPressable } from "pressto";
import { interpolate } from "react-native-reanimated";

type DrawerListItemProps = {
  item: DrawerItem;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  isDark?: boolean;
};

const PressableHighlight = createAnimatedPressable(
  (progress, { isSelected }: { isSelected: boolean }) => {
    "worklet";
    const opacity = interpolate(progress, [0, 1], [0, 0.1]).toFixed(2);
    const sc = interpolate(progress, [0, 1], [1, 0.97]);
    return {
      backgroundColor: `rgba(255,255,255,${isSelected ? 0.1 : opacity})`,
      transform: [{ scale: sc }],
    };
  },
);

const DrawerListItem: FC<DrawerListItemProps> = memo(
  ({ item, onPress, style, isDark = false }) => {
    const IconComponent = item.icon;
    const pathname = usePathname();
    const currentSegment = pathname.split("/").pop();
    const itemSegment = item.route.toString().split("/").pop();
    const isSelected = currentSegment === itemSegment;

    const inactiveColor = isDark ? "rgba(200,200,200,1)" : Colors.primaryDark;
    const inactiveBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";

    return (
      <ImageBackground
        source={isSelected ? require("@/assets/images/screen_bg.png") : undefined}
        style={isSelected && styles.bgContainer}
        imageStyle={styles.bgImage}
      >
        <PressableHighlight
          style={[
            styles.container,
            style,
            !isSelected && { backgroundColor: inactiveBg, paddingVertical: spacing(4) },
          ]}
          onPress={onPress}
        >
          <IconComponent
            size={scale(19)}
            color={isSelected ? "white" : inactiveColor}
          />
          <Text style={[styles.text, { color: isSelected ? "white" : inactiveColor }]}>
            {item.name}
          </Text>
        </PressableHighlight>
      </ImageBackground>
    );
  },
  (prev, next) => prev.item.id === next.item.id && prev.isDark === next.isDark,
);

DrawerListItem.displayName = "DrawerListItem";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 12,
    flexDirection: "row",
    flex: 1,
  },
  bgContainer: {
    overflow: "hidden",
    borderRadius: 12,
  },
  bgImage: {
    borderRadius: 12,
  },
  text: {
    flex: 1,
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    marginLeft: spacing(12),
  },
});

export { DrawerListItem };
