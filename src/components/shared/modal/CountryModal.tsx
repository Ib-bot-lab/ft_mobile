import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { Country, useCountries } from "@/src/hooks/useCountry";
import { scaleFontSize, spacing } from "@/src/utils/random";
import { BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  handleOption: (option: string) => void;
};

const CountryModal: React.FC<Props> = ({ visible, onClose, handleOption }) => {
  const { countries, isLoading, error } = useCountries();

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
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent black backdrop
            },
          ]}
        />
      )}
    >
      <BottomSheetFlatList
        contentContainerStyle={styles.modalContent}
        data={countries}
        keyExtractor={(item: Country, index: number) => `index-${index}`}
        renderItem={({ item }: { item: Country }) => (
          <TouchableOpacity
            style={styles.countryItem}
            onPress={() => {
              handleOption(item.name);
              handleClosePress();
            }}
          >
            <Text style={styles.countryFlag}>{item.flag}</Text>
            <Text style={styles.countryName}>{item.name}</Text>
            <Text style={styles.countryDialCode}>{item.dialCode}</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() =>
          isLoading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : error ? (
            <Text style={Styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.desc}>No countries found</Text>
          )
        }
      />
      {/* </BottomSheetView> */}
    </BottomSheetModal>
  );
};

export default CountryModal;

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing(20),
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing(13),
  },
  countryFlag: {
    fontSize: scaleFontSize(24),
    marginRight: spacing(12),
  },
  countryName: {
    flex: 1,
    fontSize: scaleFontSize(15),
    fontFamily: "regular",
  },
  countryDialCode: {
    fontSize: scaleFontSize(15),
    color: "#666",
    fontFamily: "regular",
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
