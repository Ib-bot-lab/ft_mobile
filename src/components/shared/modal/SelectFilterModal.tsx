import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { scale, spacing } from "@/src/utils/random";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Check } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity } from "react-native";

type OptionType = {
  label: string;
  value: string;
};

type Props = {
  data: OptionType[];
  selected: string;
  visible: boolean;
  onClose: () => void;
  handleOption: (option: string) => void;
};

const SelectFilterModal = ({
  data,
  selected,
  visible,
  onClose,
  handleOption,
}: Props) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    setTimeout(() => onClose(), 200);
  }, [onClose]);

  useEffect(() => {
    if (visible && bottomSheetRef.current) {
      bottomSheetRef.current.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={true}
      enablePanDownToClose={true}
      onDismiss={handleClosePress}
      backdropComponent={({ style }) => (
        <TouchableOpacity
          onPress={handleClosePress}
          accessible={false}
          focusable={false}
          style={[
            style,
            {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          ]}
        />
      )}
    >
      <BottomSheetScrollView
        style={styles.modalContent}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing(30) }}
      >
        {data.map((option, index) => {
          const isSelected = selected === option.value;
          return (
            <Pressable
              key={index}
              style={[
                styles.option,
                // isSelected && { backgroundColor: "rgba(106, 114, 130, 0.1)" },
              ]}
              onPress={() => {
                handleOption(option.value);
                handleClosePress();
              }}
              hitSlop={20}
            >
              <Text style={[Styles.reg14, { color: Colors.text.gray }]}>
                {option.label}
              </Text>
              {isSelected && (
                <Check
                  size={scale(12)}
                  color={Colors.iconGrey}
                  strokeWidth={3}
                />
              )}
            </Pressable>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export default SelectFilterModal;

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing(22),
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing(24),
    borderBottomWidth: 0.3,
    borderColor: "rgba(106, 114, 130, 0.2)",
  },
});
