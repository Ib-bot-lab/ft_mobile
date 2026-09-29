import { HapticTab } from "@/src/components/haptic-tab";
import SelectFilterModal from "@/src/components/shared/modal/SelectFilterModal";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { useOrderStore } from "@/src/stores/orderSlice";
import { ClientMeasurements } from "@/src/types/client";
import { OrderStatus } from "@/src/types/Order";
import {
  CapitalizeFirstName,
  FormatCurrency,
  FormatMeasurementsForUI,
  GetInitials,
  scale,
  scaleFontSize,
  spacing,
} from "@/src/utils/random";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Check,
  ChevronLeft,
  Dot,
  Package,
  Phone,
  Ruler,
  Trash2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const orderStatusList = [
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Confirmed",
    value: "confirmed",
  },
  {
    label: "In Progress",
    value: "in-progress",
  },
  {
    label: "Completed",
    value: "completed",
  },
  {
    label: "Delivered",
    value: "delivered",
  },
  {
    label: "Cancelled",
    value: "cancelled",
  },
];

type StandProps = {
  active: boolean;
  title: string;
  isDark?: boolean;
};

const StatusStand = ({ active, title, isDark }: StandProps) => {
  const iconColor = active ? "#00A63E" : isDark ? "rgba(100,100,100,1)" : "#99A1AF";
  const bgColor = active ? (isDark ? "rgba(0,100,50,0.3)" : "#DCFCE7") : isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const stickColor = active ? (isDark ? "rgba(0,160,80,0.3)" : "#B9F8CF") : isDark ? "rgba(255,255,255,0.06)" : "#D1D5DC";
  const titleColor = isDark ? "rgba(180,180,180,1)" : "#4A5565";

  return (
    <View style={[styles.gapRow, { alignItems: "flex-start" }]}>
      <View style={styles.stand}>
        <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
          {active ? (
            <Check size={scale(12)} color={iconColor} />
          ) : (
            <Dot size={scale(18)} color={iconColor} />
          )}
        </View>
        <View style={[styles.stick, { backgroundColor: stickColor }]} />
      </View>
      <Text style={[styles.reg14, { color: titleColor }]}>{title}</Text>
    </View>
  );
};

const OrderDetailScreen = () => {
  const { id } = useLocalSearchParams();

  const orderId = id.toString();

  const loading = useOrderStore((state) => state.loading);
  const deleteOrder = useOrderStore((state) => state.deleteOrder);
  const orders = useOrderStore((state) => state.orders);
  const order = orders.find((prev) => prev.id === orderId);

  // Debug — log order fields to see what client data is present
  if (order) {
    console.log("[OrderDetail] order client fields:", {
      clientName: order.clientName,
      clientPhone: order.clientPhone,
      clientEmail: order.clientEmail,
      clientId: order.clientId,
    });
  }

  const { isDark } = useTheme();
  const { top } = useSafeAreaInsets();

  const bg = isDark ? "#0f0f0f" : "white";
  const textColor = isDark ? Colors.text.white : "rgba(54, 65, 83, 1)";
  const subTextColor = isDark ? "rgba(160,160,160,1)" : Colors.text.gray;
  const boxBg = isDark ? "rgba(255,255,255,0.05)" : "#F9FAFB";
  const sectionLabelColor = isDark ? "rgba(160,160,160,1)" : Colors.text.black;
  const updateLinkColor = isDark ? "rgba(80,200,180,1)" : "#0D6B62";

  const pricingBoxBg = isDark ? "rgba(80,60,0,0.3)" : "#FFFBEB";
  const pricingBoxBorder = isDark ? "rgba(120,90,0,0.5)" : "#FEE685";
  const pricingDivider = isDark ? "rgba(120,90,0,0.5)" : "#FFD230";
  const pricingText = isDark ? Colors.text.white : Colors.text.black;
  const depositColor = isDark ? "rgba(80,200,100,1)" : "#008236";
  const balanceColor = isDark ? "rgba(255,140,60,1)" : "#973C00";

  const isCompleted = order?.status === "completed";
  const isCancelled = order?.status === "cancelled";

  const badgeTextColor = isCompleted
    ? "rgba(0, 130, 54, 1)"
    : isCancelled
      ? "rgba(193, 0, 7, 1)"
      : "rgba(0, 130, 54, 1)";
  const badgeBgColor = isDark
    ? isCompleted ? "rgba(0,100,50,0.25)" : isCancelled ? "rgba(193,0,7,0.2)" : "rgba(0,100,50,0.25)"
    : isCompleted ? "rgba(220, 252, 231, 1)" : isCancelled ? "rgba(255, 226, 226, 1)" : "rgba(220, 252, 231, 1)";

  const [statusModal, setStatusModal] = useState(false);
  const toggleStatusModal = () => setStatusModal((prev) => !prev);

  const [orderStatus, setOrderStatus] = useState<OrderStatus>(
    order?.status ?? "pending",
  );

  // const clients = useClientStore((state) => state.clients);
  // const foundClient = clients.find(
  //   (prev) => prev.id === order?.clientId?.toString(),
  // );

  const measurementList = FormatMeasurementsForUI(
    (order?.measurements as ClientMeasurements) ?? {
      neck: "",
      chest: "",
      waist: "",
      hips: "",
      shoulder: "",
      sleeve: "",
      bicep: "",
      wrist: "",
      inseam: "",
      outseam: "",
      thigh: "",
      calf: "",
      ankle: "",
      back: "",
      armhole: "",
      bust: "",
      length: "",
    },
  );

  // console.log("measurement list", order);

  const ORDER_FLOW: OrderStatus[] = [
    "pending",
    "confirmed",
    "in-progress",
    "completed",
    "delivered",
  ];

  const getStatusIndex = (status: OrderStatus) => ORDER_FLOW.indexOf(status);

  const currentStatusIndex = getStatusIndex(orderStatus);

  const handleDeleteOrder = async () => {
    try {
      await deleteOrder(order?.id ?? "");
      handleBack();
    } catch (err) {
      console.error("Error deleting order", err);
    }
  };

  const handleBack = () => {
    router.replace("/(tabs)/Orders");
  };

  return (
    <>
      <View
        style={{ flex: 1, paddingTop: top, backgroundColor: bg }}
      >
        <StatusBar style={isDark ? "light" : "dark"} />

        <View style={[styles.row, { paddingHorizontal: spacing(16), paddingTop: spacing(12), paddingBottom: spacing(8) }]}>
          <View style={styles.header}>
            <HapticTab
              hitSlop={20}
              style={{
                height: 32,
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={handleBack}
            >
              <ChevronLeft
                size={scale(20)}
                color={isDark ? "rgba(200,200,200,1)" : "rgba(54, 65, 83, 1)"}
                strokeWidth={1.5}
              />
            </HapticTab>

            <Text style={[styles.reg24, { color: textColor }]}>Order Details</Text>
          </View>

          <Pressable onPress={handleDeleteOrder}>
            {loading ? (
              <ActivityIndicator size={scale(20)} color={"red"} />
            ) : (
              <Trash2 size={scale(20)} color={"red"} strokeWidth={1.5} />
            )}
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingVertical: spacing(30),
          }}
          keyboardDismissMode="interactive"
        >
          <View style={styles.content}>
            <Text style={[styles.reg14, { color: subTextColor }]}>#{order?.id.slice(0, 10)}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: badgeBgColor,
                  borderColor: badgeTextColor,
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: badgeTextColor }]} />
              <Text style={[styles.reg14, { color: badgeTextColor, fontFamily: "medium" }]}>
                {CapitalizeFirstName(order?.status)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.reg14, { color: sectionLabelColor }]}>Client Information</Text>
              <View style={[styles.box, { backgroundColor: boxBg }]}>
                <View style={[styles.gapRow]}>
                  <View style={styles.bgView}>
                    <Text style={[styles.reg16, { color: "white" }]}>
                      {GetInitials(order?.clientName)}
                    </Text>
                  </View>

                  <Text style={[styles.reg14, { color: sectionLabelColor }]}>
                    {CapitalizeFirstName(order?.clientName) || "No Client"}
                  </Text>
                </View>

                <View style={styles.gapRow}>
                  <Phone size={scale(18)} color={Colors.primary} />
                  <Text style={[styles.reg14, { color: sectionLabelColor }]}>
                    {order?.clientPhone || "N/A"}
                  </Text>
                </View>
                {(order?.clientEmail) ? (
                  <View style={styles.gapRow}>
                    <Text style={[styles.reg14, { color: Colors.primary }]}>@</Text>
                    <Text style={[styles.reg14, { color: sectionLabelColor }]}>
                      {order.clientEmail}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.section}>
                <Text style={[styles.reg14, { color: sectionLabelColor }]}>Order Details</Text>
                <View style={[styles.box, { backgroundColor: boxBg }]}>
                  <View style={[styles.gapRow, { alignItems: "flex-start" }]}>
                    <Package
                      size={scale(20)}
                      color={Colors.primary}
                      height={30}
                    />
                    <View style={[styles.col, { gap: spacing(4) }]}>
                      <Text style={[styles.reg14, { color: subTextColor }]}>
                        Item
                      </Text>
                      <Text style={[styles.reg14, { color: sectionLabelColor }]}>
                        {order?.name || order?.garmentDescription || "Not Specified"}
                      </Text>
                      <Text
                        style={[
                          styles.reg14,
                          {
                            fontSize: scaleFontSize(12),
                            color: subTextColor,
                          },
                        ]}
                      >
                        {order?.garmentType}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.gapRow, { alignItems: "flex-start" }]}>
                    <Ruler
                      size={scale(20)}
                      color={Colors.primary}
                      height={30}
                    />
                    <View style={[styles.col, { gap: spacing(4) }]}>
                      <Text style={[styles.reg14, { color: subTextColor }]}>
                        Fabric
                      </Text>
                      <Text style={[styles.reg14, { color: sectionLabelColor }]}>
                        {order?.fabric ? order?.fabric : "Not Specified"}
                      </Text>
                      <Text
                        style={[
                          styles.reg14,
                          {
                            fontSize: scaleFontSize(12),
                            color: subTextColor,
                          },
                        ]}
                      >
                        {order?.quantity} pc
                        {(order?.quantity ?? 0) > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.reg14, { color: sectionLabelColor }]}>Measurements</Text>
              <View style={styles.measurements}>
                {measurementList.map((measure, index) => (
                  <View style={styles.measure} key={index}>
                    <Text
                      style={[
                        styles.reg14,
                        {
                          fontSize: scaleFontSize(12),
                          color: subTextColor,
                        },
                      ]}
                    >
                      {measure.label}
                    </Text>
                    <Text style={[styles.reg14, { color: sectionLabelColor }]}>{measure.value}&quot;</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={[styles.reg14, { color: sectionLabelColor }]}>Pricing</Text>
                <View
                  style={[
                    styles.box,
                    {
                      backgroundColor: pricingBoxBg,
                      borderWidth: 1,
                      borderColor: pricingBoxBorder,
                      borderRadius: 16,
                    },
                  ]}
                >
                  <View style={[styles.row]}>
                    <Text style={[Styles.reg14, { color: pricingText }]}>
                      Total Amount
                    </Text>
                    <Text style={[Styles.reg16, { color: pricingText }]}>
                      {FormatCurrency(order?.price ?? 0)}
                    </Text>
                  </View>
                  <View style={[styles.row]}>
                    <Text style={[Styles.reg14, { color: depositColor }]}>
                      Deposit Paid
                    </Text>
                    <Text style={[Styles.reg16, { color: pricingText }]}>
                      {FormatCurrency(order?.deposit ?? 0)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.row,
                      {
                        borderTopWidth: 1,
                        borderTopColor: pricingDivider,
                        paddingTop: spacing(12),
                      },
                    ]}
                  >
                    <Text style={[Styles.reg14, { color: balanceColor }]}>
                      Balance Due
                    </Text>
                    <Text style={[Styles.reg16, { color: pricingText }]}>
                      {FormatCurrency(order?.balance ?? 0)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={[styles.reg14, { color: sectionLabelColor }]}>Order Timeline</Text>
                <Pressable hitSlop={20} onPress={toggleStatusModal}>
                  <Text style={[styles.reg14, { color: updateLinkColor }]}>
                    Update timeline
                  </Text>
                </Pressable>
              </View>
              <View style={[styles.box, { backgroundColor: boxBg }]}>
                <View style={styles.statusStands}>
                  {order?.status === "cancelled" ? (
                    <View style={styles.statusStands}>
                      <StatusStand title="Order Cancelled" active isDark={isDark} />
                    </View>
                  ) : (
                    ORDER_FLOW.map((status, index) => (
                      <StatusStand
                        key={status}
                        title={CapitalizeFirstName(status.replace("-", " "))}
                        active={index <= currentStatusIndex}
                        isDark={isDark}
                      />
                    ))
                  )}
                </View>
              </View>
            </View>

          </View>
        </ScrollView>
      </View>
      {statusModal && (
        <SelectFilterModal
          data={orderStatusList}
          visible={statusModal}
          handleOption={(option) => setOrderStatus(option as OrderStatus)}
          selected={orderStatus}
          onClose={() => setStatusModal(false)}
        />
      )}
    </>
  );
};

export default OrderDetailScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: spacing(8),
  },
  col: {
    gap: spacing(4),
  },
  reg14: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  reg16: {
    fontFamily: "regular",
    fontSize: scaleFontSize(14),
  },
  reg24: {
    fontFamily: "regular",
    fontSize: scaleFontSize(24),
    lineHeight: 32,
  },
  reg30: {
    fontFamily: "regular",
    fontSize: scaleFontSize(30),
    color: "white",
    lineHeight: 36,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: spacing(16),
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
    gap: spacing(12),
  },
  red: {
    color: "rgba(251, 44, 54, 1)",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing(8),
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(8),
    borderRadius: 100,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 100,
  },
  bgView: {
    width: 48,
    aspectRatio: 1,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
  section: {
    gap: spacing(12),
  },
  box: {
    padding: spacing(16),
    gap: spacing(12),
    borderRadius: 16,
  },
  measurements: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing(12),
  },
  measure: {
    width: `${90 / 3}%`,
    gap: spacing(5),
    justifyContent: "center",
    alignItems: "center",
  },
  stand: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  iconWrapper: {
    width: 32,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
  stick: {
    width: 2,
    height: 32,
  },
  statusStands: {
    gap: spacing(15),
  },
});
