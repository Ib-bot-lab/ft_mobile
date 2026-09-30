import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import countries, { Country } from "@/src/constants/countries";
import { scaleFontSize, spacing } from "@/src/utils/random";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  handleOption: (option: string) => void;
};

const CountryModal: React.FC<Props> = ({ visible, onClose, handleOption }) => {
  const [search, setSearch] = useState("");
  const { bottom } = useSafeAreaInsets();

  const filtered = search.trim()
    ? countries.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dialCode.includes(search)
      )
    : countries;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: bottom + spacing(16) }]}>
        <View style={styles.handleBar} />

        <TextInput
          style={styles.searchInput}
          placeholder="Search country..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item: Country) => item.code}
          renderItem={({ item }: { item: Country }) => (
            <TouchableOpacity
              style={styles.countryItem}
              onPress={() => {
                handleOption(item.name);
                setSearch("");
                onClose();
              }}
            >
              <Text style={styles.countryFlag}>{item.flag}</Text>
              <Text style={styles.countryName}>{item.name}</Text>
              <Text style={styles.countryDialCode}>{item.dialCode}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <Text style={styles.desc}>No countries found</Text>
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

export default CountryModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing(12),
    paddingHorizontal: spacing(20),
    maxHeight: "75%",
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing(12),
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: spacing(12),
    paddingVertical: spacing(10),
    fontSize: scaleFontSize(14),
    fontFamily: "regular",
    color: "#111",
    backgroundColor: "#f9fafb",
    marginBottom: spacing(12),
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
    marginTop: spacing(20),
  },
});
