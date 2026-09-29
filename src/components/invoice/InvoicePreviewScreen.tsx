import { Colors } from "@/src/constants/theme";
import { InvoiceData } from "@/src/types/Invoice";
import { scale } from "@/src/utils/random";
import { Download } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { HapticTab } from "../haptic-tab";
import { createAndShareInvoice, generateInvoiceHTML } from "./util";

const InvoicePreviewScreen = ({ invoice }: { invoice: InvoiceData }) => {
  return (
    <View style={{ flex: 1 }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: generateInvoiceHTML(invoice) }}
      />

      <HapticTab
        style={styles.downloadBtn}
        onPress={() => createAndShareInvoice(invoice)}
      >
        <Download size={scale(20)} color={"white"} />
      </HapticTab>
    </View>
  );
};

export default InvoicePreviewScreen;

const styles = StyleSheet.create({
  downloadBtn: {
    position: "absolute",
    right: 20,
    bottom: 50,
    backgroundColor: Colors.primary,
    width: 50,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    elevation: 2,
  },
});
