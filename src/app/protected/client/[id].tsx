import ClientCard from "@/src/components/clients/clientCard";
import AddMeasurements from "@/src/components/clients/modal/EditMeasurement";
import EditNote from "@/src/components/clients/modal/EditNote";
import DesignItem from "@/src/components/designs/DesignItem";
import { HapticTab } from "@/src/components/haptic-tab";
import InvoiceItem from "@/src/components/invoice/Item";
import OrderItem from "@/src/components/orders/OrderItem";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useClientStore } from "@/src/stores/clientSlice";
import { useDesignStore } from "@/src/stores/designSlice";
import { useInvoiceStore } from "@/src/stores/invoiceSlice";
import { Measurement, useMeasurementStore } from "@/src/stores/measurementSlice";
import { useOrderStore } from "@/src/stores/orderSlice";
import { Client } from "@/src/types/client";
import {
  CapitalizeFirstName,
  FormatCurrency,
  FormatNairaShorthand,
  FormatOrderDate,
  scale,
  scaleFontSize,
  ShowToastMessage,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Calendar,
  ChevronLeft,
  FileText,
  Pencil,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabProps = { client: Client | undefined; isDark: boolean };

// ─── Overview Tab ────────────────────────────────────────────────────────────
const OverViewTab = ({ client, isDark }: TabProps) => {
  const invoices = useInvoiceStore((state) => state.invoices);
  const clientInvoices = invoices.filter(
    (inv) => inv.clientEmail === client?.email,
  );
  const [editNoteModal, setEditNoteModal] = useState(false);

  const orders = useOrderStore((state) => state.orders);
  const clientOrders = orders
    .filter((o) => {
      if (!client) return false;
      // Match by clientId first, then fall back to phone match
      return o.clientId === client.id || o.clientPhone === client.phone;
    })
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );

  // Total spent = sum of all invoice line items for this client (matches web)
  const totalSpent = clientInvoices.reduce((grand, inv) => {
    return (
      grand +
      (inv.items ?? []).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      )
    );
  }, 0);

  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subText = isDark ? "rgba(160,160,160,1)" : "rgba(74, 85, 101, 1)";
  const statBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249,250,251,1)";
  const statBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(229,231,235,1)";

  return (
    <>
      <View style={styles.tabContainer}>
        {/* Stats row */}
        <View
          style={[
            styles.statsRow,
            { backgroundColor: statBg, borderColor: statBorder },
          ]}
        >
          {[
            { value: clientOrders.length, label: "Total Orders" },
            {
              value: FormatNairaShorthand(totalSpent.toString()),
              label: "Total Spent",
            },
            { value: clientInvoices.length, label: "Invoices" },
          ].map((stat, i) => (
            <View
              key={i}
              style={[
                styles.statItem,
                i < 2 && {
                  borderRightWidth: 1,
                  borderRightColor: statBorder,
                },
              ]}
            >
              <Text style={[styles.reg18, { color: textColor }]}>
                {stat.value}
              </Text>
              <Text
                style={[
                  Styles.reg12,
                  { color: subText, lineHeight: 16, textAlign: "center" },
                ]}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View
          style={[
            styles.noteBox,
            { backgroundColor: statBg, borderColor: statBorder },
          ]}
        >
          <View style={styles.row}>
            <View style={[styles.gapRow, { gap: spacing(10) }]}>
              <FileText size={scale(16)} color={Colors.primary} />
              <Text style={[styles.reg16, { color: textColor }]}>Notes</Text>
            </View>
            <HapticTab hitSlop={20} onPress={() => setEditNoteModal(true)}>
              <Pencil
                size={scale(16)}
                color={isDark ? "rgba(160,160,160,1)" : "black"}
              />
            </HapticTab>
          </View>
          <Text
            style={[
              styles.reg14g,
              {
                flexShrink: 1,
                color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray,
              },
            ]}
          >
            {client?.notes ? client.notes : "Add note"}
          </Text>
        </View>

        {/* Recent activity — capped at 3 most recent, matching web */}
        <View style={[styles.col, { gap: spacing(12) }]}>
          <Text style={[Styles.reg16, { color: textColor }]}>
            Recent Activity
          </Text>
          <View style={styles.orders}>
            {clientOrders.slice(0, 3).map((order, index) => (
              <OrderItem order={order} key={index} />
            ))}
            {clientOrders.length === 0 && (
              <Text
                style={[
                  Styles.reg12,
                  { color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray },
                ]}
              >
                No recent orders
              </Text>
            )}
          </View>
        </View>
      </View>

      {editNoteModal && client && (
        <EditNote
          visible={editNoteModal}
          onClose={() => setEditNoteModal(false)}
          client={client}
        />
      )}
    </>
  );
};

// ─── Measurements Tab ────────────────────────────────────────────────────────
const MeasurementsTab = ({ client, isDark }: TabProps) => {
  const measurements = useMeasurementStore((s) => s.measurements);
  const deleteMeasurement = useMeasurementStore((s) => s.deleteMeasurement);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] =
    useState<Measurement | null>(null);

  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const boxBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(249,250,251,1)";
  const boxBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(229,231,235,1)";
  const subText = isDark ? "rgba(160,160,160,1)" : Colors.grayText;
  const deleteColor = isDark ? "rgba(255,80,80,0.8)" : "#ef4444";

  const handleDelete = (m: Measurement) => {
    if (Platform.OS === "web") {
      // Alert.alert is a no-op on web — use window.confirm instead
      const confirmed = window.confirm(`Delete "${m.name}"?`);
      if (confirmed) deleteMeasurement(m.id);
      return;
    }
    Alert.alert(
      "Delete Measurement",
      `Delete "${m.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMeasurement(m.id),
        },
      ],
    );
  };

  return (
    <>
      <View style={styles.tabContainer}>
        <View style={styles.rowHeader}>
          <View style={[styles.col, { gap: spacing(2) }]}>
            <Text style={[Styles.reg16, { color: textColor }]}>
              Body Measurements
            </Text>
            <Text
              style={[
                Styles.reg12,
                {
                  color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray,
                },
              ]}
            >
              {measurements.length > 0
                ? `${measurements.length} measurement${measurements.length > 1 ? "s" : ""} recorded`
                : "Standard measurements in inches"}
            </Text>
          </View>
          <HapticTab
            style={[
              styles.iconWrapper,
              { backgroundColor: Colors.primary, borderRadius: 100 },
            ]}
            onPress={() => {
              setEditingMeasurement(null);
              setAddModalOpen(true);
            }}
          >
            <Plus size={scale(18)} color="white" strokeWidth={2} />
          </HapticTab>
        </View>

        {measurements.length === 0 ? (
          <Text
            style={[
              Styles.reg12,
              { color: isDark ? "rgba(160,160,160,1)" : Colors.text.gray },
            ]}
          >
            No measurements recorded for this client.
          </Text>
        ) : (
          <View style={styles.measurements}>
            {measurements.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.box,
                  {
                    backgroundColor: boxBg,
                    borderWidth: 1,
                    borderColor: boxBorder,
                  },
                ]}
              >
                <View style={styles.row}>
                  <Text style={[Styles.reg12, { color: subText, flex: 1 }]}>
                    {m.name}
                  </Text>
                  <View style={[styles.gapRow, { gap: spacing(8) }]}>
                    {/* Edit */}
                    <HapticTab
                      hitSlop={10}
                      onPress={() => {
                        setEditingMeasurement(m);
                        setAddModalOpen(true);
                      }}
                    >
                      <Pencil size={scale(13)} color={Colors.primary} />
                    </HapticTab>
                    {/* Delete */}
                    <HapticTab
                      hitSlop={10}
                      onPress={() => handleDelete(m)}
                    >
                      <Trash2 size={scale(13)} color={deleteColor} />
                    </HapticTab>
                  </View>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.med18, { color: textColor }]}>
                    {m.value}
                  </Text>
                  <View style={[styles.gapRow, { gap: spacing(4) }]}>
                    <Ruler
                      size={scale(13)}
                      color={Colors.primary}
                      strokeWidth={1}
                    />
                    <Text style={[Styles.reg12, { color: subText }]}>
                      {m.unit}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Add / Edit modal */}
      {addModalOpen && client && (
        <AddMeasurements
          visible={addModalOpen}
          onClose={() => {
            setAddModalOpen(false);
            setEditingMeasurement(null);
          }}
          client={client}
          editingMeasurement={editingMeasurement}
        />
      )}
    </>
  );
};

// ─── Designs Tab ─────────────────────────────────────────────────────────────
const DesignsTab = ({ client, isDark }: TabProps) => {
  const designs = useDesignStore((state) => state.designs);
  const clientDesigns = designs.filter(
    (prev) => prev.clientId === client?.id,
  );
  const textColor = isDark ? Colors.text.white : Colors.text.black;

  return (
    <View style={[styles.tabContainer, { paddingTop: 20 }]}>
      <View style={styles.row}>
        <Text style={[styles.reg16, { color: textColor }]}>
          {clientDesigns.length} Designs
        </Text>
        <HapticTab
          style={styles.rowBtn}
          onPress={() =>
            router.push({
              pathname: "/protected/form/create-design",
              params: { clientId: client?.id ?? "" },
            })
          }
        >
          <Plus size={scale(15)} color="white" />
          <Text style={[styles.reg14g, { color: "white" }]}>New Design</Text>
        </HapticTab>
      </View>
      <View style={styles.designs}>
        {clientDesigns.map((design, index) => (
          <DesignItem item={design} key={index} />
        ))}
      </View>
    </View>
  );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const OrdersTab = ({ client, isDark }: TabProps) => {
  const orders = useOrderStore((state) => state.orders);
  const clientsOrder = orders.filter((o) => {
    if (!client) return false;
    return o.clientId === client.id || o.clientPhone === client.phone;
  });
  const textColor = isDark ? Colors.text.white : Colors.text.black;

  return (
    <View style={styles.tabContainer}>
      <View style={styles.row}>
        <Text style={[styles.reg16, { color: textColor }]}>
          {clientsOrder.length} Total Orders
        </Text>
        <HapticTab
          style={styles.rowBtn}
          onPress={() =>
            router.push({
              pathname: "/protected/form/create-order",
              params: { clientId: client?.id ?? "" },
            })
          }
        >
          <Plus size={scale(15)} color="white" />
          <Text style={[styles.reg14g, { color: "white" }]}>New Order</Text>
        </HapticTab>
      </View>
      <View style={styles.orders}>
        {clientsOrder.map((order, index) => (
          <OrderItem order={order} key={index} />
        ))}
      </View>
    </View>
  );
};

// ─── Invoices Tab ─────────────────────────────────────────────────────────────
const InvoicesTab = ({ client, isDark }: TabProps) => {
  const invoices = useInvoiceStore((state) => state.invoices);
  const clientInvoices = invoices.filter(
    (inv) => inv.clientEmail === client?.email,
  );

  const totalInvoiceAmount = clientInvoices.reduce((grand, invoice) => {
    return (
      grand +
      (invoice.items ?? []).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      )
    );
  }, 0);

  // Paid / pending counts matching the web panel
  const paidCount = clientInvoices.filter(
    (inv) => (inv as any).status === "Paid",
  ).length;
  const pendingCount = clientInvoices.filter(
    (inv) => (inv as any).status !== "Paid",
  ).length;

  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const recBg = isDark ? "rgba(22,152,141,0.15)" : "#E8F5F4";
  const subText = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;
  const pillBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(249,250,251,1)";
  const pillBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(229,231,235,1)";

  return (
    <View style={[styles.tabContainer, { paddingTop: 20 }]}>
      {/* Summary box — matches web */}
      <View style={[styles.recBox, { backgroundColor: recBg }]}>
        <View style={styles.row}>
          <Text style={[styles.reg14g, { color: textColor }]}>
            Total Invoiced
          </Text>
          <Text style={[styles.reg20, { color: Colors.primary }]}>
            {FormatCurrency(totalInvoiceAmount)}
          </Text>
        </View>
        {/* Paid / Pending pills */}
        <View style={[styles.gapRow, { gap: spacing(8), paddingTop: spacing(8) }]}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: pillBg, borderColor: pillBorder },
            ]}
          >
            <Text style={[Styles.reg12, { color: "#10b981" }]}>
              Paid: {paidCount}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: pillBg, borderColor: pillBorder },
            ]}
          >
            <Text style={[Styles.reg12, { color: subText }]}>
              Pending: {pendingCount}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={[styles.reg16, { color: textColor }]}>
          {clientInvoices.length} Invoices
        </Text>
        <HapticTab
          style={styles.rowBtn}
          onPress={() =>
            router.push({
              pathname: "/protected/form/create-invoice",
              params: { clientId: client?.id ?? "" },
            })
          }
        >
          <Plus size={scale(15)} color="white" />
          <Text style={[styles.reg14g, { color: "white" }]}>New Invoice</Text>
        </HapticTab>
      </View>

      <View style={styles.invoices}>
        {clientInvoices.map((invoice, index) => (
          <InvoiceItem invoice={invoice} key={index} />
        ))}
      </View>
    </View>
  );
};

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABLIST = [
  { label: "Overview", value: "index" },
  { label: "Measurements", value: "measurements" },
  { label: "Design", value: "design" },
  { label: "Orders", value: "order" },
  { label: "Invoices", value: "invoice" },
];

type TAB = "index" | "measurements" | "design" | "order" | "invoice";

// ─── Main screen ──────────────────────────────────────────────────────────────
const ClientDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  // Fix: use raw id without encodeURIComponent — it's already decoded by expo-router
  const clientId = id.toString();
  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : Colors.text.black;
  const subText = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;
  const tabInactiveBg = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(249,250,251,1)";
  const tabBorder = isDark ? "rgba(255,255,255,0.06)" : "transparent";

  const getClientById = useClientStore((state) => state.getClientById);
  const [client, setClient] = useState<Client | undefined>(undefined);
  const [loadingClient, setLoadingClient] = useState(true);

  const fetchInvoices = useInvoiceStore((state) => state.getInvoicesByTailor);
  const getMeasurements = useMeasurementStore((s) => s.getMeasurements);

  const [selectedTab, setSelectedTab] = useState<TAB>("index");

  const TabHandler: Record<TAB, React.ReactNode> = {
    index: <OverViewTab client={client} isDark={isDark} />,
    measurements: <MeasurementsTab client={client} isDark={isDark} />,
    design: <DesignsTab client={client} isDark={isDark} />,
    order: <OrdersTab client={client} isDark={isDark} />,
    invoice: <InvoicesTab client={client} isDark={isDark} />,
  };

  useEffect(() => {
    setLoadingClient(true);
    getClientById(clientId).then((data) => {
      if (data) setClient(data);
    }).finally(() => setLoadingClient(false));
    fetchInvoices("");
  }, [clientId]);

  // Load measurements whenever the Measurements tab is opened
  useEffect(() => {
    if (selectedTab === "measurements" && client?.email) {
      getMeasurements(client.email);
    }
  }, [selectedTab, client?.email]);

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: top }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={[
          styles.rowHeader,
          { paddingHorizontal: 16, paddingVertical: spacing(12) },
        ]}
      >
        <Pressable
          hitSlop={20}
          onPress={() => router.replace("/(tabs)/Clients")}
        >
          <ChevronLeft size={scale(20)} color={textColor} />
        </Pressable>

        <View style={[styles.gapRow, { gap: spacing(12) }]}>
          {/* Edit client */}
          <HapticTab
            style={styles.gapRow}
            onPress={() =>
              router.push({
                pathname: "/protected/form/create-client",
                params: { clientId },
              })
            }
          >
            <Pencil
              size={scale(16)}
              color={isDark ? "rgba(160,160,160,1)" : "black"}
            />
            <Text style={[Styles.reg14, { lineHeight: 20, color: subText }]}>
              Edit
            </Text>
          </HapticTab>

          {/* Appointments shortcut */}
          <HapticTab
            style={styles.gapRow}
            onPress={() =>
              router.push({
                pathname: "/protected/clientAppt/[phone]",
                params: { phone: client?.phone ?? "" },
              })
            }
          >
            <Calendar
              size={scale(18)}
              color={isDark ? "rgba(160,160,160,1)" : "black"}
            />
            <Text style={[Styles.reg14, { lineHeight: 20, color: subText }]}>
              Appt.
            </Text>
          </HapticTab>
        </View>
      </View>

      {loadingClient ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: spacing(40),
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
      >
        <View style={[styles.content, { paddingHorizontal: 16 }]}>
          <ClientCard item={client} />

          {/* Tab bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabs}
          >
            {TABLIST.map((tab, index) => {
              const isSelected = selectedTab === tab.value;
              return (
                <Pressable
                  key={index}
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: isSelected
                        ? Colors.primary
                        : tabInactiveBg,
                      borderWidth: 1,
                      borderColor: isSelected ? Colors.primary : tabBorder,
                    },
                  ]}
                  onPress={() => setSelectedTab(tab.value as TAB)}
                >
                  <Text
                    style={[
                      Styles.reg12,
                      {
                        color: isSelected
                          ? "white"
                          : isDark
                            ? "rgba(160,160,160,1)"
                            : Colors.grey,
                        fontFamily: isSelected ? "medium" : "regular",
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {TabHandler[selectedTab]}
        </View>
      </ScrollView>
      )}
    </View>
  );
};

export default ClientDetailsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { paddingVertical: spacing(16), gap: spacing(20) },
  tabContainer: { paddingTop: spacing(20), gap: spacing(24) },
  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  statItem: {
    flex: 1,
    paddingVertical: spacing(16),
    alignItems: "center",
    gap: spacing(4),
  },
  noteBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing(16),
    gap: spacing(10),
  },
  recBox: { padding: spacing(16), borderRadius: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  col: { gap: spacing(16) },
  gapRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(8),
  },
  tabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing(8),
    paddingVertical: spacing(4),
  },
  tabBtn: {
    height: 36,
    borderRadius: 20,
    paddingHorizontal: spacing(16),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  rowBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: spacing(14),
    gap: spacing(8),
    height: 34,
    borderRadius: 12,
  },
  iconWrapper: {
    width: 36,
    aspectRatio: 1,
    backgroundColor: "rgba(232,245,244,1)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  statusPill: {
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: 20,
    borderWidth: 1,
  },
  reg18: {
    fontFamily: "regular",
    fontSize: scaleFontSize(18),
    lineHeight: 22,
    textAlign: "center",
  },
  reg16: { fontFamily: "regular", fontSize: scaleFontSize(16) },
  reg20: { fontFamily: "regular", fontSize: scaleFontSize(20) },
  reg14g: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
    color: Colors.text.gray,
  },
  med18: {
    fontFamily: "medium",
    fontSize: scaleFontSize(18),
    lineHeight: 24,
  },
  orders: { gap: spacing(12) },
  invoices: { gap: spacing(12) },
  measurements: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing(12),
    flexWrap: "wrap",
  },
  box: {
    width: "47%",
    minHeight: 88,
    padding: spacing(14),
    gap: spacing(8),
    borderRadius: 16,
  },
  designs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
  },
});
