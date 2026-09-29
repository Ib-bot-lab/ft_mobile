import CampaignItem from "@/src/components/campaign/Item";
import GlassCard from "@/src/components/dashboard/boxes/GlassBox";
import CrmItem from "@/src/components/member/Item";
import BGScreenBG from "@/src/components/shared/BGScreenBG";
import { Styles } from "@/src/constants/styles";
import { Colors } from "@/src/constants/theme";
import { useCrmStore } from "@/src/stores/crmSlice";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import { Gift, Mail, Search, UsersIcon } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BOXWIDTH = SCREEN_WIDTH / 2 - 20 - 16;

const RowBoxes = () => {
  const members = useCrmStore((state) => state.loyaltyMembers);
  const campaigns = useCrmStore((state) => state.campaigns);

  // const fetchCampaigns = useCrmStore((state) => state.getCampaigns);
  // const fetchMembers = useCrmStore((state) => state.getLoyaltyMembers);

  // const fetchData = useCallback(async () => {
  //   try {
  //     await Promise.all([fetchCampaigns(), fetchMembers()]);
  //   } catch (error) {
  //     console.error("error fetching data", error);
  //   }
  // }, []);

  // useEffect(() => {
  //   fetchData();
  // }, []);

  return (
    <View style={styles.row}>
      <GlassCard style={styles.box}>
        <View style={[styles.startRow, { paddingBottom: spacing(12) }]}>
          <UsersIcon size={scale(15)} color={"white"} />
          <Text style={[Styles.med12, { color: "white", lineHeight: 16 }]}>
            Members
          </Text>
        </View>

        <Text style={styles.sm18}>{members.length}</Text>
      </GlassCard>

      <GlassCard style={styles.box}>
        <View style={[styles.startRow, { paddingBottom: spacing(12) }]}>
          <Mail size={scale(15)} color={"white"} />
          <Text style={[Styles.med12, { color: "white", lineHeight: 16 }]}>
            Campaigns
          </Text>
        </View>

        <Text style={styles.sm18}>{campaigns.length}</Text>
      </GlassCard>
    </View>
  );
};

type TAB = "loyalty" | "campaign";

const TabsList = [
  {
    label: "Loyalty",
    icon: Gift,
    value: "loyalty",
  },
  {
    label: "Campaigns",
    icon: Mail,
    value: "campaign",
  },
];

const CRMScreen = () => {
  const [selectedTab, setSelectedTab] = useState<TAB>("loyalty");

  const members = useCrmStore((state) => state.loyaltyMembers);
  const campaigns = useCrmStore((state) => state.campaigns);

  const [searchValue, setSearchValue] = useState("");

  const filteredListData = useMemo(() => {
    const q = searchValue.trim().toLowerCase();

    if (selectedTab === "loyalty") {
      return members.filter(
        (m: any) =>
          q === "" ||
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)),
      );
    }

    if (selectedTab === "campaign") {
      return campaigns.filter(
        (c: any) =>
          q === "" ||
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.subject && c.subject.toLowerCase().includes(q)),
      );
    }

    return [];
  }, [selectedTab, searchValue, members, campaigns]);

  //   const saveCampaign = useCrmStore((state) => state.addLoyaltyMember);
  //   const saveCampaign = useCrmStore((state) => state.addCampaign);

  //   useEffect(() => {
  //     saveCampaign({
  //       content: "Email content here",
  //       name: "Year-End Appreciation",
  //       createdAt: Timestamp.now(),
  //       updatedAt: Timestamp.now(),
  //       subject: "Thank You for an Amazing 2025! 🎉",
  //       status: "scheduled",
  //       recipients: [],
  //       recipientCount: 10,
  //     });
  //   }, []);

  return (
    <SafeAreaView edges={["left","right","bottom"]}
      style={{ flex: 1, backgroundColor: "white" }}
      edges={["bottom"]}
    >
      <BGScreenBG
        title="CRM"
        canGoBack
        rightIcon={() => (
          // <HapticTab style={{}}>
          //   <Entypo name="notification" size={24} color="white" />
          // </HapticTab>
          <View></View>
        )}
        headerChildren={RowBoxes}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, gap: spacing(32) }}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          //   scrollEnabled={false}
        >
          <View style={styles.content}>
            <View style={styles.tabs}>
              {TabsList.map((tab, index) => {
                const Icon = tab.icon;
                const isSelected = selectedTab === tab.value;
                const textStyle = isSelected
                  ? [Styles.reg14, styles.selectedText]
                  : [Styles.reg14, { color: Colors.grey }];
                const buttonStyle = isSelected
                  ? [styles.tabBtn, styles.selectedTab]
                  : [styles.tabBtn];
                return (
                  <Pressable
                    style={buttonStyle}
                    key={index}
                    onPress={() => setSelectedTab(tab.value as TAB)}
                  >
                    <Icon
                      size={scale(15)}
                      color={isSelected ? "white" : Colors.grey}
                    />
                    <Text style={textStyle}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={[
                styles.searchContainer,
                styles.startRow,
                { gap: spacing(12) },
              ]}
            >
              <Search
                size={scale(20)}
                color={"rgba(153, 161, 175, 1)"}
                strokeWidth={2}
              />
              <TextInput
                value={searchValue}
                onChangeText={setSearchValue}
                placeholder={`Search ${selectedTab}...`}
                placeholderTextColor={Colors.grey}
                style={styles.input}
              />
            </View>

            <View style={{ gap: spacing(24) }}>
              {selectedTab === "campaign" ? (
                <Text style={[Styles.reg16, { color: "rgba(16, 24, 40, 1)" }]}>
                  {campaigns.length} Email Campaigns
                </Text>
              ) : (
                <Text style={[Styles.reg16, { color: "rgba(16, 24, 40, 1)" }]}>
                  {members.length} Loyalty Members
                </Text>
              )}
              <FlatList
                data={filteredListData as any}
                keyExtractor={(item: any) => item.id}
                style={{ flex: 1 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  gap: spacing(16),
                  paddingBottom: spacing(40),
                }}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                renderItem={({ item }: { item: any }) => {
                  if (selectedTab === "loyalty") {
                    return <CrmItem item={item} />;
                  }

                  return <CampaignItem item={item} />;
                }}
                ListEmptyComponent={() => (
                  <View style={styles.emptyContainer}>
                    <Text
                      style={[Styles.med12, { color: Colors.text.gray }]}
                    >{`No ${selectedTab} found.`}</Text>
                  </View>
                )}
              />
            </View>
          </View>
        </ScrollView>
      </BGScreenBG>
    </SafeAreaView>
  );
};

export default CRMScreen;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing(15),
    paddingVertical: spacing(26),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  box: {
    width: BOXWIDTH,
    height: 120,
    padding: spacing(16),
  },
  startRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: spacing(4),
  },
  sm18: {
    fontFamily: "semibold",
    fontSize: scaleFontSize(20),
    lineHeight: 28,
    color: "white",
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing(12),
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing(8),
    backgroundColor: "white",
  },
  selectedTab: {
    backgroundColor: Colors.primary,
  },
  selectedText: {
    color: "white",
  },
  searchContainer: {
    backgroundColor: "rgba(249, 250, 251, 1)",
    borderWidth: 1,
    borderColor: "rgba(229, 231, 235, 1)",
    borderRadius: 14,
    paddingVertical: spacing(12),
    paddingHorizontal: spacing(16),
  },
  input: {
    flex: 1,
    // backgroundColor: "red",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
