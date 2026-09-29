import InvoicePreviewScreen from "@/src/components/invoice/InvoicePreviewScreen";
import { Colors } from "@/src/constants/theme";
import { useInvoiceStore } from "@/src/stores/invoiceSlice";
import { scale, spacing } from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { MoveLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// const invoice = {
//     invoiceNumber: "INV-000272",
//     invoiceDate: "19 Dec 2025",
//     dueDate: "19 Dec 2025",
//     terms: "Due on Receipt",
//     businessName: "Malaabis by Maymz Couture",
//     businessAddress: "No 1b Ahmadu Bello Way Nassarawa GRA, Kano, Nigeria",
//     logoUrl: "https://picsum.photos/200",
//     billTo: "Hajiya Sahura",
//     currency: "NGN",
//     items: [
//       { name: "Malaabis bespoke classy boubou", qty: 2, rate: 70000 },
//       { name: "Beaded gown", qty: 1, rate: 80000 },
//     ],
//     notes: ["MalaabisbyMaymz Couture LTD", "Zenith Bank - 1015057791"],
//     termsAndConditions: "NO REFUND AFTER PAYMENT",
//   };

const InvoicePreview = () => {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();

  const invoices = useInvoiceStore((state) => state.invoices);
  const invoice = invoices.find((prev) => prev.id === invoiceId?.toString()) ?? null;

  const handleBack = () => {
    router.replace("/(tabs)/Invoices");
  };

  if (!invoice) {
    handleBack();
    return null;
  }

  return (
    <SafeAreaView edges={["left","right","bottom"]} style={{ flex: 1, paddingTop: spacing(20) }}>
      <Pressable style={styles.backBtn} onPress={handleBack}>
        <MoveLeft size={scale(18)} color={"black"} />
      </Pressable>
      <InvoicePreviewScreen invoice={invoice} />
    </SafeAreaView>
  );
};

export default InvoicePreview;

const styles = StyleSheet.create({
  backBtn: {
    width: 35,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    marginHorizontal: spacing(20),
    marginBottom: spacing(20),
    backgroundColor: Colors.primary20,
  },
});
