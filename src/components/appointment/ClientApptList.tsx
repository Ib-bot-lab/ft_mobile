import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { Appointment } from "@/src/types/appointment";
import { spacing } from "@/src/utils/random";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import ClientApptItem from "./ClientApptItem";

type Props = {
  apptList: Appointment[];
};

const ClientApptList = ({ apptList }: Props) => {
  return (
    <FlatList
      data={apptList}
      renderItem={({ item }) => <ClientApptItem item={item} />}
      keyExtractor={(item, index) => item.id}
      style={{ flex: 1 }}
      contentContainerStyle={{
        flexGrow: 1,
        gap: spacing(16),
        paddingBottom: spacing(40),
      }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text
            style={[Styles.med12, { color: Colors.text.gray }]}
          >{`No appointment found for this client.`}</Text>
        </View>
      )}
    />
  );
};

export default ClientApptList;

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
