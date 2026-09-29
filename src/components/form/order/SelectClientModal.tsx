import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useClientStore } from "@/src/stores/clientSlice";
import { Client } from "@/src/types/client";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import { User } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  handleOption: (client: Client) => void;
};

const SelectClientModal = ({ visible, onClose, handleOption }: Props) => {
  const clients = useClientStore((state) => state.clients);
  const isLoading = useClientStore((state) => state.loading);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  const handleClosePress = useCallback(() => {
    bottomSheetRef.current?.dismiss();
    setTimeout(() => onClose(), 2000);
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
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      onDismiss={handleClosePress}
      backdropComponent={({ style }) => (
        <TouchableOpacity
          onPress={handleClosePress}
          style={[
            style,
            {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          ]}
        />
      )}
    >
      <BottomSheetFlatList
        contentContainerStyle={styles.modalContent}
        data={clients}
        keyExtractor={(item: Client, index: number) => `${index}-${item.id}`}
        renderItem={({ item }: { item: Client }) => (
          <Pressable
            style={styles.item}
            onPress={() => {
              handleOption(item);
              handleClosePress();
            }}
          >
            <View style={styles.badge}>
              <User size={scale(12)} color={Colors.grey} />
            </View>
            <View style={{ gap: spacing(2) }}>
              <Text
                style={[
                  Styles.med14,
                  { color: Colors.text.black, lineHeight: 20 },
                ]}
              >
                {item.name}
              </Text>
              <Text style={[Styles.reg12, { color: Colors.text.gray }]}>
                {item.phone}
              </Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() =>
          isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <Text style={styles.desc}>No clients found</Text>
          )
        }
      />
    </BottomSheetModal>
  );
};

export default SelectClientModal;

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // gap: spacing(15),
    padding: spacing(22),
  },
  badge: {
    width: 40,
    aspectRatio: 1,
    backgroundColor: "rgba(10, 10, 10, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
  item: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingVertical: spacing(12),
    gap: spacing(8),
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
  },
  desc: {
    fontFamily: "medium",
    fontSize: scaleFontSize(15),
    color: Colors.black,
    textAlign: "center",
  },
});
