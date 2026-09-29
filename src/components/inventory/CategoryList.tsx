import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { spacing } from "@/src/utils/random";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

const categories = [
  {
    label: "All",
    value: "all",
  },
  {
    label: "🧵 Fabric",
    value: "fabric",
  },
  {
    label: "📌 Notions",
    value: "notion",
  },
  {
    label: "🧶 Threads",
    value: "thread",
  },
  {
    label: "💎 Accessories",
    value: "accessories",
  },
  {
    label: "✂️ Tools",
    value: "tool",
  },
  {
    label: "📐 Patterns",
    value: "pattern",
  },
  {
    label: "🎀 Trims",
    value: "trim",
  },
];

type Props = {
  selectedCategory: string;
  onSelect: (category: string) => void;
};

const CategoryList = ({ selectedCategory, onSelect }: Props) => {
  const { isDark } = useTheme();
  const unselectedText = isDark ? "rgba(200,200,200,1)" : "black";

  const handleOnPress = (category: string) => {
    onSelect(category);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, gap: spacing(12) }}
    >
      {categories.map((category, index) => {
        const isSelected = category.value === selectedCategory;
        // console.log("isSelected", category.value, selectedCategory);
        return (
          <Pressable
            key={index}
            onPress={() => handleOnPress(category.value)}
            style={[
              styles.categoryBtn,
              {
                backgroundColor: isSelected
                  ? "rgba(22, 152, 141, 1)"
                  : "transparent",
              },
            ]}
          >
            <Text
              style={[
                Styles.reg14,
                { color: isSelected ? "white" : unselectedText, textAlign: "center" },
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

export default CategoryList;

const styles = StyleSheet.create({
  categoryBtn: {
    paddingVertical: spacing(10),
    paddingHorizontal: spacing(16),
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    height: 45,
  },
});
