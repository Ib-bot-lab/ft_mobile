import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useInvoiceStore } from "@/src/stores/invoiceSlice";
import { Invoice } from "@/src/types/Invoice";
import { FormatCurrency, scale, scaleFontSize, spacing } from "@/src/utils/random";
import { router } from "expo-router";
import { Eye, FileText, Pencil, Trash2 } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { HapticTab } from "../haptic-tab";

type Props = { invoice: Invoice };

const InvoiceItem = ({ invoice }: Props) => {
  const { isDark } = useTheme();
  const deleteInvoice = useInvoiceStore((state) => state.deleteInvoice);
  const loading = useInvoiceStore((state) => state.loading);

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#6A7282";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subText = isDark ? "rgba(160,160,160,1)" : Colors.grey;
  const iconBg = isDark ? "rgba(22,152,141,0.15)" : "#E8F5F4";
  const editBg = isDark ? "rgba(255,255,255,0.08)" : Colors.inputBorder;

  const totalInvoiceAmount = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleDelete = () => {
    Alert.alert(
      `Delete invoice #${invoice.id.slice(0, 6)}?`,
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => { try { await deleteInvoice(invoice.id); } catch (e) { console.error(e); } } },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.row}>
        <View style={[styles.startRow, { alignItems: "flex-start" }]}>
          <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
            <FileText size={scale(18)} color={Colors.primary} />
          </View>
          <View style={{ gap: spacing(4), flexShrink: 1 }}>
            <Text style={[styles.reg14, { color: textColor }]}>{invoice.id.slice(0, 8)}</Text>
            {invoice.clientName ? (
              <Text style={[styles.reg13, { color: textColor }]} numberOfLines={1}>{invoice.clientName}</Text>
            ) : null}
            <Text style={[styles.reg12, { color: subText }]}>{invoice.invoiceDate}</Text>
          </View>
        </View>
        <Text style={[styles.reg14, { color: textColor }]}>{FormatCurrency(totalInvoiceAmount)}</Text>
      </View>

      <View style={styles.buttons}>
        <HapticTab hitSlop={20} style={[styles.btn, { backgroundColor: editBg }]} onPress={() => router.push({ pathname: "/protected/invoice/[id]", params: { id: invoice.id } })}>
          <Pencil size={scale(12)} color={isDark ? "rgba(200,200,200,1)" : "rgba(74, 85, 101, 1)"} />
          <Text style={[styles.reg14, { color: isDark ? "rgba(200,200,200,1)" : "black" }]}>Edit</Text>
        </HapticTab>
        <HapticTab style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={() => { if (!invoice.id) return; router.push({ pathname: "/protected/invoice-preview", params: { invoiceId: invoice.id } }); }}>
          <Eye size={scale(14)} color="white" />
          <Text style={[styles.reg14, { color: "white" }]}>View</Text>
        </HapticTab>
        <HapticTab style={[styles.btn, { backgroundColor: "#FFE2E2", height: 30, borderRadius: 10 }]} onPress={handleDelete}>
          {loading ? <ActivityIndicator size={scale(20)} color="#E7000B" /> : <Trash2 size={scale(14)} color="#E7000B" strokeWidth={2} />}
        </HapticTab>
      </View>
    </View>
  );
};

export default InvoiceItem;

const styles = StyleSheet.create({
  container: { padding: spacing(16), gap: spacing(12), borderWidth: 0.5, borderRadius: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  startRow: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center", gap: spacing(12) },
  iconWrapper: { width: 40, aspectRatio: 1, justifyContent: "center", alignItems: "center", borderRadius: 100 },
  reg14: { fontFamily: "regular", fontSize: scaleFontSize(14) },
  reg13: { fontFamily: "medium", fontSize: scaleFontSize(13) },
  reg12: { fontFamily: "regular", fontSize: scaleFontSize(12) },
  buttons: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: spacing(10) },
  btn: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingHorizontal: spacing(10), height: 30, gap: spacing(6), borderRadius: 14 },
});
