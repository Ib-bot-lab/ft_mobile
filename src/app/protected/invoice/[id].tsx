import PrimaryButton from "@/src/components/button/PrimaryButton";
import SelectClientModal from "@/src/components/form/order/SelectClientModal";
import { HapticTab } from "@/src/components/haptic-tab";
import { ColorWheelPicker } from "@/src/components/invoice/ColorWheelPicker";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { getCurrentUserEmail } from "@/src/lib/auth-utils";
import { useClientStore } from "@/src/stores/clientSlice";
import { useInvoiceStore } from "@/src/stores/invoiceSlice";
import { useUserStore } from "@/src/stores/userSlice";
import { Client } from "@/src/types/client";
import { InvoiceData, InvoiceItem } from "@/src/types/Invoice";
import {
  ConvertToISO,
  FormatCurrency,
  FormatDateToYYYYMMDD,
  formatInvoiceDate,
  formatPrice,
  GetDetailedDate,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  Plus,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "react-native-date-picker";

const EditInvoiceScreen = () => {
  const { id } = useLocalSearchParams();
  const invoices = useInvoiceStore((state) => state.invoices);
  const foundInvoice = invoices.find((prev) => prev.id === (Array.isArray(id) ? id[0] : id)) ?? null;
  const fetchClients = useClientStore((state) => state.getClientsByTailor);
  const clients = useClientStore((state) => state.clients);
  const foundClient = foundInvoice
    ? clients.find((prev) => prev.id === foundInvoice.clientId?.toString())
    : undefined;

  const user = useUserStore((state) => state.user);
  const editInvoice = useInvoiceStore((state) => state.editInvoice);
  const loading = useInvoiceStore((state) => state.loading);

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const labelColor = isDark ? "rgba(160,160,160,1)" : "#4A5565";
  const subLabelColor = isDark ? "rgba(120,120,120,1)" : "#99A1AF";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "white";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const inputTextColor = isDark ? Colors.text.white : Colors.black;
  const placeholderColor = isDark ? "rgba(100,100,100,1)" : Colors.grayText;
  const dropdownTextColor = isDark ? "rgba(200,200,200,1)" : "rgba(10, 10, 10, 0.5)";
  const dropdownActiveColor = isDark ? Colors.text.white : "rgba(10, 10, 10, 1)";
  const chevronColor = isDark ? "rgba(160,160,160,1)" : Colors.grey;
  const datePickerBorder = isDark ? "rgba(255,255,255,0.1)" : Colors.inputBorder;
  const dateTextColor = isDark ? "rgba(200,200,200,1)" : "rgba(10, 10, 10, 1)";
  const summaryBoxBg = isDark ? "rgba(22,152,141,0.12)" : "#E8F5F4";
  const summaryDivider = isDark ? "rgba(22,152,141,0.3)" : Colors.primary20;

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientModal, setClientModal] = useState(false);
  const toggleClientModal = () => setClientModal((prev) => !prev);

  const [datePickerFor, setDatePickerFor] = useState<"invoiceDate" | "dueDate" | null>(null);

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: foundInvoice?.id ?? "",
    invoiceDate: ConvertToISO(foundInvoice?.invoiceDate, "state innvoice date"),
    dueDate: ConvertToISO(foundInvoice?.dueDate, "state invoice due date"),
    terms: "Due on Receipt",
    businessName: foundInvoice?.businessName ?? "",
    businessAddress: foundInvoice?.businessAddress ?? "",
    logoUrl: user?.logo ?? "",
    clientName: foundInvoice?.clientName ?? "",
    clientPhone: foundInvoice?.clientPhone ?? "",
    clientEmail: foundClient?.email,
    currency: "NGN",
    items: foundInvoice?.items ?? [],
    notes: foundInvoice?.notes,
    themeColor: foundInvoice?.themeColor,
    termsAndConditions: "NO REFUND AFTER PAYMENT",
  });

  const [error, setError] = useState({
    clientName: "",
    invoiceDate: "",
    dueDate: "",
    terms: "",
    items: "",
  });

  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

  const totals = useMemo(() => {
    const sub = invoiceData.items.reduce(
      (sum, i) => sum + Number(i.quantity) * Number(i.price),
      0,
    );
    const t = (7.5 / 100) * sub;
    return { subTotal: sub, tax: t, total: sub + t };
  }, [invoiceData.items]);

  const handleDetailsChange = (field: keyof typeof invoiceData, value: string | string[]) => {
    setInvoiceData((prev) => ({ ...prev, [field]: value }));
    if (error[field as keyof typeof error]) {
      setError((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, price: 0 }],
    }));
    setItemErrors((prev) => {
      const next = { ...prev };
      delete next[invoiceData.items.length];
      return next;
    });
  };

  const removeItem = (index: number) => {
    if (invoiceData.items.length <= 1) return;
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoiceData((prev) => {
      const items = [...prev.items];
      const item = { ...items[index], [field]: value };
      if (field === "description" && typeof value === "string") item.description = value;
      else if (field === "quantity") item.quantity = typeof value === "number" ? value : parseInt(value, 10) || 0;
      else if (field === "price") item.price = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
      items[index] = item;
      return { ...prev, items };
    });
    if (itemErrors[index]) setItemErrors((prev) => ({ ...prev, [index]: "" }));
    if (error.items) setError((prev) => ({ ...prev, items: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors = { clientName: "", invoiceDate: "", dueDate: "", terms: "", items: "" };
    const newItemErrors: Record<number, string> = {};
    let isValid = true;

    if (!invoiceData.clientName?.trim()) { newErrors.clientName = "Bill to (client) is required"; isValid = false; }
    if (!invoiceData.invoiceDate.trim()) { newErrors.invoiceDate = "Invoice date is required"; isValid = false; }
    if (!invoiceData.dueDate.trim()) { newErrors.dueDate = "Due date is required"; isValid = false; }

    const hasValidItem = invoiceData.items.some((i) => i.description.trim() && i.quantity >= 1 && i.price > 0);
    if (!hasValidItem) { newErrors.items = "Add at least one item with description, quantity and price"; isValid = false; }

    invoiceData.items.forEach((item, index) => {
      if (!item.description.trim() && (item.quantity > 0 || item.price > 0)) {
        newItemErrors[index] = "Description is required"; isValid = false;
      } else if (item.description.trim() && (item.quantity < 1 || item.price <= 0)) {
        newItemErrors[index] = "Quantity must be at least 1 and price greater than 0"; isValid = false;
      }
    });

    setError(newErrors);
    setItemErrors(newItemErrors);
    return isValid;
  };

  const handleEditInvoice = async () => {
    if (!validateForm()) return;
    if (!user?.email || !selectedClient || !foundInvoice) return;
    try {
      const validItems = invoiceData.items.filter((i) => i.description.trim() && i.quantity >= 1 && i.price > 0);
      await editInvoice(foundInvoice.id, {
        ...invoiceData,
        dueDate: formatInvoiceDate(invoiceData.dueDate),
        invoiceDate: formatInvoiceDate(invoiceData.invoiceDate),
        items: validItems,
        userEmail: user.email,
        clientId: selectedClient.id,
      });
      handleBack();
    } catch (err) {
      console.error("Error editing invoice", err);
    }
  };

  useEffect(() => {
    fetchClients(getCurrentUserEmail());
    if (foundInvoice) {
      console.log("invoice", JSON.stringify(foundInvoice, null, 2));
    }
  }, []);

  useEffect(() => {
    if (foundClient) {
      setSelectedClient(foundClient);
      setInvoiceData((prev) => ({
        ...prev,
        billTo: [foundClient.name, foundClient.phone].filter(Boolean).join("\n"),
      }));
    }
  }, [foundClient]);

  const handleBack = () => router.replace("/(tabs)/Invoices");

  // Guard — invoice not found in store (e.g. stale navigation after delete)
  if (!foundInvoice) {
    handleBack();
    return null;
  }

  const inputStyle = [Styles.input, { paddingVertical: 0, paddingHorizontal: spacing(16), backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }];

  return (
    <>
      <View style={{ flex: 1, paddingTop: top, backgroundColor: bg }}>
        <StatusBar style={isDark ? "light" : "dark"} />

        <View style={styles.header}>
          <HapticTab style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={scale(20)} color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"} strokeWidth={1.5} />
          </HapticTab>
          <Text style={[styles.reg24, { color: textColor }]}>Edit Invoice</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: bg }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? spacing(50) : spacing(0)}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ flexGrow: 1, paddingVertical: spacing(30) }}
            keyboardDismissMode="interactive"
          >
            <View style={styles.content}>
              {/* client */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>
                  Clients<Text style={styles.red}> *</Text>
                </Text>
                <Pressable
                  style={[Styles.input, { ...styles.row, paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder }]}
                  onPress={toggleClientModal}
                >
                  <Text style={[Styles.reg16, { color: selectedClient ? dropdownActiveColor : dropdownTextColor }]}>
                    {selectedClient ? selectedClient.name : "Select client"}
                  </Text>
                  <ChevronDown size={scale(20)} color={chevronColor} />
                </Pressable>
                {error.clientName ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.clientName}</Text> : null}
              </View>

              {/* dates */}
              <View style={[styles.row, { gap: spacing(20) }]}>
                <View style={[Styles.inputContainer, { gap: spacing(8), flex: 1 }]}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Invoice Date<Text style={styles.red}> *</Text>
                  </Text>
                  <Pressable
                    style={[styles.datePicker, { borderColor: datePickerBorder, backgroundColor: inputBg }]}
                    onPress={() => setDatePickerFor("invoiceDate")}
                  >
                    <Text style={[styles.reg12, { color: invoiceData.invoiceDate ? dateTextColor : subLabelColor }]}>
                      {invoiceData.invoiceDate ? GetDetailedDate(invoiceData.invoiceDate) : "DD/MM/YYYY"}
                    </Text>
                    <Calendar size={scale(15)} color={chevronColor} />
                  </Pressable>
                  {error.invoiceDate ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.invoiceDate}</Text> : null}
                </View>

                <View style={[Styles.inputContainer, { gap: spacing(8), flex: 1 }]}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Due Date<Text style={styles.red}> *</Text>
                  </Text>
                  <Pressable
                    style={[styles.datePicker, { borderColor: datePickerBorder, backgroundColor: inputBg }]}
                    onPress={() => setDatePickerFor("dueDate")}
                  >
                    <Text style={[styles.reg12, { color: invoiceData.dueDate ? dateTextColor : subLabelColor }]}>
                      {invoiceData.dueDate ? GetDetailedDate(invoiceData.dueDate) : "DD/MM/YYYY"}
                    </Text>
                    <Calendar size={scale(15)} color={chevronColor} />
                  </Pressable>
                  {error.dueDate ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.dueDate}</Text> : null}
                </View>
              </View>

              {(datePickerFor === "invoiceDate" || datePickerFor === "dueDate") && (
                <DatePicker
                  modal
                  open={!!datePickerFor}
                  date={
                    datePickerFor === "invoiceDate" && invoiceData.invoiceDate
                      ? new Date(invoiceData.invoiceDate)
                      : datePickerFor === "dueDate" && invoiceData.dueDate
                        ? new Date(invoiceData.dueDate)
                        : new Date()
                  }
                  mode="date"
                  onConfirm={(date) => {
                    const value = FormatDateToYYYYMMDD(date.toISOString());
                    if (datePickerFor === "invoiceDate") handleDetailsChange("invoiceDate", value);
                    else handleDetailsChange("dueDate", value);
                    setDatePickerFor(null);
                  }}
                  onCancel={() => setDatePickerFor(null)}
                />
              )}

              {/* items */}
              <View style={[Styles.inputContainer, { gap: spacing(16) }]}>
                <View style={styles.row}>
                  <Text style={[Styles.label, { color: labelColor }]}>
                    Items<Text style={styles.red}> *</Text>
                  </Text>
                  <HapticTab style={[styles.gapRow, { gap: spacing(5) }]} onPress={handleAddItem}>
                    <Plus size={scale(18)} color={Colors.primary} />
                    <Text style={[styles.reg14, { color: Colors.primary }]}>Add Item</Text>
                  </HapticTab>
                </View>
                {error.items ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{error.items}</Text> : null}

                {invoiceData.items.map((item, index) => (
                  <View style={{ gap: spacing(4) }} key={index}>
                    {invoiceData.items.length > 1 && (
                      <View style={[styles.gapRow, { gap: spacing(15), justifyContent: "center", paddingVertical: spacing(10) }]}>
                        <Text style={[Styles.label, { color: labelColor }]}>Item {index + 1}</Text>
                        <HapticTab style={styles.removeBtn} onPress={() => removeItem(index)}>
                          <X size={scale(10)} color="white" strokeWidth={3} />
                        </HapticTab>
                      </View>
                    )}
                    <TextInput
                      value={item.description}
                      onChangeText={(text) => handleItemChange(index, "description", text)}
                      placeholder="Description"
                      placeholderTextColor={placeholderColor}
                      style={[Styles.input, { paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, color: inputTextColor }]}
                    />
                    <View style={[styles.row, { gap: spacing(20), paddingTop: spacing(8) }]}>
                      <View style={[Styles.inputContainer, { flex: 1 }]}>
                        <Text style={[Styles.label, { color: labelColor }]}>Quantity<Text style={styles.red}> *</Text></Text>
                        <TextInput
                          value={item.quantity === 0 ? "" : item.quantity.toString()}
                          onChangeText={(text) => handleItemChange(index, "quantity", parseInt(text, 10) || 0)}
                          placeholder="1"
                          placeholderTextColor={placeholderColor}
                          keyboardType="number-pad"
                          style={inputStyle}
                        />
                      </View>
                      <View style={[Styles.inputContainer, { flex: 1 }]}>
                        <Text style={[Styles.label, { color: labelColor }]}>Price<Text style={styles.red}> *</Text></Text>
                        <TextInput
                          value={formatPrice(item.price === 0 ? "" : item.price.toString())}
                          onChangeText={(text) => handleItemChange(index, "price", parseFloat(text.replace(/[^0-9.]/g, "")) || 0)}
                          placeholder="₦0"
                          placeholderTextColor={placeholderColor}
                          keyboardType="decimal-pad"
                          style={inputStyle}
                        />
                      </View>
                    </View>
                    {itemErrors[index] ? <Text style={{ ...Styles.reg12, color: "red", marginTop: 4 }}>{itemErrors[index]}</Text> : null}
                  </View>
                ))}
              </View>

              {/* theme color */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Invoice Theme Color</Text>
                <ColorWheelPicker
                  value={invoiceData.themeColor ?? "#16988D"}
                  onChange={(hex) => handleDetailsChange("themeColor", hex)}
                />
              </View>

              {/* notes */}
              <View style={Styles.inputContainer}>
                <Text style={[Styles.label, { color: labelColor }]}>Notes (Optional)</Text>
                <TextInput
                  value={invoiceData.notes ? invoiceData.notes.join("\n") : ""}
                  onChangeText={(text) => handleDetailsChange("notes", text ? text.split("\n").filter(Boolean) : [])}
                  placeholder="Add payment terms, delivery notes, etc."
                  placeholderTextColor={placeholderColor}
                  multiline
                  numberOfLines={20}
                  style={[Styles.input, { height: 100, textAlignVertical: "top", paddingTop: spacing(15), paddingVertical: 0, backgroundColor: inputBg, borderColor: inputBorder, paddingHorizontal: spacing(16), color: inputTextColor }]}
                />
              </View>

              {/* totals */}
              <View style={[styles.box, { backgroundColor: summaryBoxBg }]}>
                <View style={styles.row}>
                  <Text style={[Styles.reg14, { color: inputTextColor }]}>Subtotal</Text>
                  <Text style={[Styles.reg16, { color: inputTextColor }]}>{FormatCurrency(totals.subTotal)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[Styles.reg14, { color: inputTextColor }]}>Tax</Text>
                  <Text style={[Styles.reg16, { color: inputTextColor }]}>{FormatCurrency(totals.tax)}</Text>
                </View>
                <View style={[styles.row, { borderTopWidth: 0.5, borderTopColor: summaryDivider, paddingTop: spacing(10) }]}>
                  <Text style={[Styles.reg14, { color: inputTextColor }]}>Total</Text>
                  <Text style={[Styles.reg16, { color: Colors.primary, fontSize: scaleFontSize(24) }]}>{FormatCurrency(totals.total)}</Text>
                </View>
              </View>

              <View style={styles.button}>
                <PrimaryButton title="Edit Invoice" onPress={handleEditInvoice} loading={loading} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {clientModal && (
        <SelectClientModal
          visible={clientModal}
          handleOption={(client) => {
            setSelectedClient(client);
            setInvoiceData((prev) => ({ ...prev, clientName: client.name, clientPhone: client.phone, clientEmail: client.email }));
            if (error.clientName) setError((prev) => ({ ...prev, clientName: "" }));
          }}
          onClose={() => setClientModal(false)}
        />
      )}
    </>
  );
};

export default EditInvoiceScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(8),
    paddingHorizontal: spacing(16),
    paddingTop: spacing(12),
    paddingBottom: spacing(8),
  },
  backBtn: {
    width: 32,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reg12: {
    fontFamily: "regular",
    fontSize: scaleFontSize(12),
  },
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: spacing(24),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gapRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(14),
  },
  removeBtn: {
    backgroundColor: "#E7000B",
    width: 18,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
  red: { color: "rgba(251, 44, 54, 1)" },
  datePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing(15),
    paddingHorizontal: spacing(13),
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
  },
  box: {
    padding: spacing(16),
    gap: spacing(10),
    borderRadius: 16,
  },
  button: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
