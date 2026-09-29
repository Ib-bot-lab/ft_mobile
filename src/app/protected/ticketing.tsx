/**
 * TicketingPage — mobile equivalent of the web TicketingWidget.
 * Views: home → subissues → form → created → thread
 */
import { Colors } from "@/src/constants/theme";
import { useTheme } from "@/src/context/ThemeContext";
import { API_BASE_URL, getStoredToken } from "@/src/lib/apiClient";
import { readCache, writeCache } from "@/src/utils/storeCache";
import { scale, scaleFontSize, spacing } from "@/src/utils/random";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  ChevronRight,
  Headphones,
  Paperclip,
  Send,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubIssue = { id: string; title: string };
type Category = { id: string; title: string; description: string; subIssues: SubIssue[] };
type Message  = { sender: "user" | "support"; text: string; createdAt?: string };
type Ticket   = {
  id: string; category: string; subIssue: string; description: string;
  status: "open" | "in_progress" | "resolved"; messages: Message[];
  attachments?: string[]; createdAt: string;
};

// ── Categories (same as web) ──────────────────────────────────────────────────

const TOP_CATEGORIES: Category[] = [
  {
    id: "subscription", title: "Subscription & Billing",
    description: "Issues with your plan, payments, upgrades, or cancellations.",
    subIssues: [
      { id: "sub-upgrade",  title: "Upgrade / downgrade plan" },
      { id: "sub-cancel",   title: "Cancel subscription" },
      { id: "sub-payment",  title: "Payment failed" },
      { id: "sub-invoice",  title: "Invoice / receipt request" },
    ],
  },
  {
    id: "subadmin", title: "Sub-Admin & Permissions",
    description: "Issues with sub-admin accounts, roles, and access permissions.",
    subIssues: [
      { id: "sa-create", title: "Cannot create sub-admin" },
      { id: "sa-perm",   title: "Permission not working" },
      { id: "sa-remove", title: "Remove sub-admin access" },
    ],
  },
];

const MAIN_CATEGORIES: Category[] = [
  { id: "dashboard",    title: "Dashboard & Analytics",  description: "Issues with dashboard overview, charts, or statistics.", subIssues: [{ id: "dash-load", title: "Dashboard not loading" }, { id: "dash-stats", title: "Incorrect statistics" }] },
  { id: "clients",      title: "Client Management",      description: "Problems adding, editing, or viewing client profiles.",    subIssues: [{ id: "cl-add", title: "Cannot add client" }, { id: "cl-edit", title: "Edit client not saving" }, { id: "cl-delete", title: "Client deletion issue" }] },
  { id: "orders",       title: "Orders & Invoices",       description: "Issues with creating, updating, or tracking orders.",      subIssues: [{ id: "ord-create", title: "Cannot create order" }, { id: "ord-invoice", title: "Invoice not generating" }, { id: "ord-status", title: "Order status stuck" }] },
  { id: "inventory",    title: "Inventory & Designs",    description: "Problems with inventory tracking or design uploads.",       subIssues: [{ id: "inv-stock", title: "Stock not updating" }, { id: "inv-design", title: "Design upload failing" }] },
  { id: "appointments", title: "Appointments",            description: "Issues scheduling or receiving appointment notifications.", subIssues: [{ id: "apt-book", title: "Cannot book appointment" }, { id: "apt-notify", title: "No notification received" }] },
  { id: "finances",     title: "Finances & Reports",     description: "Issues with financial reports or exports.",                  subIssues: [{ id: "fin-report", title: "Report not generating" }, { id: "fin-export", title: "Export failing" }] },
  { id: "crm",          title: "CRM & Loyalty",          description: "Problems with CRM campaigns, loyalty points, or rewards.",  subIssues: [{ id: "crm-camp", title: "Campaign not sending" }, { id: "crm-loyalty", title: "Loyalty points issue" }] },
  { id: "settings",     title: "Account & Settings",     description: "Issues with brand settings, profile, or integrations.",     subIssues: [{ id: "set-brand", title: "Brand settings not saving" }, { id: "set-notif", title: "Notifications not working" }] },
];

const BOTTOM_CATEGORIES: Category[] = [
  { id: "other", title: "Other", description: "Any issue that doesn't fit the categories above.", subIssues: [{ id: "oth-general", title: "General question" }, { id: "oth-bug", title: "Bug report" }, { id: "oth-suggest", title: "Feature suggestion" }] },
];

// ── API helpers ───────────────────────────────────────────────────────────────

async function authHeader() {
  const token = await getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeader();
  const res  = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { ...headers, ...(options.headers as any) } });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Request failed");
  return data as T;
}

async function fetchTickets(): Promise<{ data: Ticket[] }> {
  return apiFetch("/support-ticket/list");
}

async function fetchTicket(id: string): Promise<{ data: Ticket }> {
  return apiFetch(`/support-ticket/get/${id}`);
}

// Upload a single image URI to Cloudinary using XMLHttpRequest.
// XHR uses the native RN network layer — no Blob/ArrayBuffer issues.
function uploadToCloudinary(uri: string, index: number): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset    = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const ext      = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const mimeType = ext === "png" ? "image/png" : "image/jpeg";

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file",          { uri, name: `attachment_${index}.${ext}`, type: mimeType } as any);
    form.append("upload_preset", preset);
    form.append("folder",        "support_tickets");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data?.error?.message || "Cloudinary upload failed"));
        }
      } catch {
        reject(new Error("Failed to parse Cloudinary response"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
    xhr.send(form);
  });
}

async function createTicket(params: {
  category: string; subIssue: string; description: string;
  dateNoticed: string; images: ImagePicker.ImagePickerAsset[];
}): Promise<{ data: Ticket }> {
  // 1. Upload each image to Cloudinary first, get back URLs
  const attachmentUrls: string[] = [];
  for (let i = 0; i < params.images.length; i++) {
    const url = await uploadToCloudinary(params.images[i].uri, i);
    attachmentUrls.push(url);
  }

  // 2. Send ticket data + Cloudinary URLs as JSON to backend
  //    The backend's createTicket also checks req.body.attachmentUrls
  //    (we patch it to fall back to that array when req.files is empty)
  return apiFetch("/support-ticket/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category:       params.category,
      subIssue:       params.subIssue,
      description:    params.description,
      dateNoticed:    params.dateNoticed,
      attachmentUrls, // pre-uploaded Cloudinary URLs
    }),
  });
}

async function postMessage(id: string, text: string): Promise<{ data: Ticket }> {
  const headers = await authHeader();
  return apiFetch(`/support-ticket/get/${id}/messages`, {
    method: "POST",
    headers: { ...(headers as any), "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function statusLabel(s: string) {
  if (s === "resolved")   return "Resolved";
  if (s === "in_progress") return "In Progress";
  return "Open";
}

function statusColors(s: string, isDark: boolean): { bg: string; text: string } {
  if (s === "resolved")    return { bg: isDark ? "rgba(22,152,141,0.2)"  : "#dcfce7", text: "#16a34a" };
  if (s === "in_progress") return { bg: isDark ? "rgba(251,191,36,0.15)" : "#fef3c7", text: "#b45309" };
  return                          { bg: isDark ? "rgba(59,130,246,0.15)" : "#dbeafe", text: "#1d4ed8" };
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionLabel({ label, textColor }: { label: string; textColor: string }) {
  return (
    <Text style={[ss.sectionLabel, { color: textColor }]}>{label.toUpperCase()}</Text>
  );
}

function Badge({ status, isDark }: { status: string; isDark: boolean }) {
  const c = statusColors(status, isDark);
  return (
    <View style={[ss.badge, { backgroundColor: c.bg }]}>
      <Text style={[ss.badgeText, { color: c.text }]}>{statusLabel(status)}</Text>
    </View>
  );
}

function Tabs({ active, onChange, isDark, borderColor }: { active: "new"|"my"; onChange: (t: "new"|"my") => void; isDark: boolean; borderColor: string }) {
  const tabBg  = isDark ? "#1a1a1a" : "#f3f4f6";
  const active_ = isDark ? "#2a2a2a" : "#fff";
  const tc      = isDark ? Colors.text.white : Colors.primaryDark;
  const tc2     = isDark ? "rgba(160,160,160,1)" : Colors.label;
  return (
    <View style={[ss.tabs, { backgroundColor: tabBg }]}>
      {(["new","my"] as const).map(t => (
        <TouchableOpacity key={t} style={[ss.tab, active === t && { backgroundColor: active_ }]} onPress={() => onChange(t)}>
          <Text style={[ss.tabText, { color: active === t ? tc : tc2, fontFamily: active === t ? "medium" : "regular" }]}>
            {t === "new" ? "New ticket" : "My tickets"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── VIEW: Home (category list + my tickets) ───────────────────────────────────

function ViewHome({ isDark, bg, textColor, subColor, borderColor, cardBg, activeTab, onTabChange, onSelect, tickets, ticketsLoading, onTicketClick }: any) {
  const renderCat = (cat: Category) => (
    <TouchableOpacity key={cat.id} style={[ss.catCard, { backgroundColor: cardBg, borderColor }]} onPress={() => onSelect(cat)} activeOpacity={0.7}>
      <View style={ss.catCardInner}>
        <Text style={[ss.catTitle, { color: textColor }]}>{cat.title}</Text>
        <Text style={[ss.catDesc,  { color: subColor  }]} numberOfLines={2}>{cat.description}</Text>
      </View>
      <ChevronRight size={scale(16)} color={subColor} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={ss.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Tabs active={activeTab} onChange={onTabChange} isDark={isDark} borderColor={borderColor} />

      {activeTab === "new" && (
        <>
          <SectionLabel label="Account & Plan" textColor={subColor} />
          {TOP_CATEGORIES.map(renderCat)}
          <SectionLabel label="Features" textColor={subColor} />
          {MAIN_CATEGORIES.map(renderCat)}
          <SectionLabel label="Other" textColor={subColor} />
          {BOTTOM_CATEGORIES.map(renderCat)}
        </>
      )}

      {activeTab === "my" && (
        <>
          {ticketsLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: spacing(24) }} />}
          {!ticketsLoading && tickets.length === 0 && (
            <Text style={[ss.emptyText, { color: subColor }]}>No tickets yet.</Text>
          )}
          {!ticketsLoading && tickets.map((t: Ticket) => (
            <TouchableOpacity key={t.id} style={[ss.ticketCard, { backgroundColor: cardBg, borderColor }]} onPress={() => onTicketClick(t)} activeOpacity={0.7}>
              <View style={ss.ticketCardTop}>
                <Text style={[ss.ticketId, { color: textColor }]}>#{t.id}</Text>
                <Badge status={t.status} isDark={isDark} />
              </View>
              <Text style={[ss.ticketSub, { color: textColor }]}>{t.subIssue}</Text>
              <Text style={[ss.ticketPreview, { color: subColor }]} numberOfLines={2}>{t.description}</Text>
              <View style={ss.ticketCardBottom}>
                <Text style={[ss.ticketMeta, { color: subColor }]}>{t.category}</Text>
                <Text style={[ss.ticketMeta, { color: subColor }]}>{formatDate(t.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ── VIEW: Sub-issues ──────────────────────────────────────────────────────────

function ViewSubIssues({ isDark, bg, textColor, subColor, borderColor, cardBg, category, activeTab, onTabChange, onSelect }: any) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={ss.scrollContent} showsVerticalScrollIndicator={false}>
      <Tabs active={activeTab} onChange={onTabChange} isDark={isDark} borderColor={borderColor} />
      {(category as Category).subIssues.map((s: SubIssue) => (
        <TouchableOpacity key={s.id} style={[ss.catCard, { backgroundColor: cardBg, borderColor }]} onPress={() => onSelect(s)} activeOpacity={0.7}>
          <Text style={[ss.catTitle, { color: textColor, flex: 1 }]}>{s.title}</Text>
          <ChevronRight size={scale(16)} color={subColor} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── VIEW: Form ────────────────────────────────────────────────────────────────

function ViewForm({ isDark, textColor, subColor, borderColor, cardBg, inputBg, subIssue, activeTab, onTabChange, onSubmit, submitting }: any) {
  const [date,   setDate]   = useState("");
  const [desc,   setDesc]   = useState("");
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission required", "Please allow photo access to upload files."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.8, selectionLimit: 5 });
    if (!result.canceled) setImages(result.assets.slice(0, 5));
  };

  const handleSubmit = () => {
    if (!date.trim()) { Alert.alert("Required", "Please enter when you noticed this issue."); return; }
    if (!desc.trim()) { Alert.alert("Required", "Please describe the issue."); return; }
    onSubmit({ date, desc, images });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? spacing(60) : 0}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[ss.scrollContent, { paddingBottom: spacing(32) }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Tabs active={activeTab} onChange={onTabChange} isDark={isDark} borderColor={borderColor} />

        {/* Date noticed */}
        <View style={ss.formGroup}>
          <Text style={[ss.formLabel, { color: textColor }]}>When did you notice this? <Text style={{ color: "#ef4444" }}>*</Text></Text>
          <TextInput
            style={[ss.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={subColor}
            value={date}
            onChangeText={setDate}
          />
        </View>

        {/* Description */}
        <View style={ss.formGroup}>
          <Text style={[ss.formLabel, { color: textColor }]}>Describe the issue <Text style={{ color: "#ef4444" }}>*</Text></Text>
          <TextInput
            style={[ss.input, ss.textarea, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder="Describe what happened in detail..."
            placeholderTextColor={subColor}
            value={desc}
            onChangeText={setDesc}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Attachments */}
        <View style={ss.formGroup}>
          <Text style={[ss.formLabel, { color: textColor }]}>Supporting Documents (optional)</Text>
          <TouchableOpacity style={[ss.uploadBtn, { borderColor, backgroundColor: inputBg }]} onPress={pickImages} activeOpacity={0.7}>
            <Paperclip size={scale(22)} color={subColor} />
            <Text style={[ss.uploadTitle, { color: textColor }]}>Upload images</Text>
            <Text style={[ss.uploadHint,  { color: subColor  }]}>JPG or PNG · max 5</Text>
          </TouchableOpacity>
          {images.length > 0 && (
            <View style={ss.thumbRow}>
              {images.map((img, i) => (
                <View key={i} style={ss.thumbWrap}>
                  <Image source={{ uri: img.uri }} style={ss.thumb} />
                  <TouchableOpacity style={ss.thumbRemove} onPress={() => setImages(prev => prev.filter((_,j) => j !== i))}>
                    <X size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Submit */}
        <TouchableOpacity style={[ss.submitBtn, submitting && { opacity: 0.65 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
          {submitting
            ? <View style={{ flexDirection: "row", alignItems: "center", gap: spacing(8) }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={ss.submitText}>{images.length > 0 ? "Uploading & submitting…" : "Submitting…"}</Text>
              </View>
            : <Text style={ss.submitText}>Submit Ticket</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── VIEW: Created ─────────────────────────────────────────────────────────────

function ViewCreated({ isDark, textColor, subColor, borderColor, cardBg, ticket, onNewTicket, onViewThread }: any) {
  const t = ticket as Ticket;
  return (
    <ScrollView contentContainerStyle={[ss.scrollContent, { alignItems: "center", paddingTop: spacing(32) }]} showsVerticalScrollIndicator={false}>
      <View style={[ss.createdIcon, { borderColor: textColor }]}>
        <CheckCircle size={scale(38)} color={textColor} strokeWidth={1.5} />
      </View>
      <Text style={[ss.createdTitle, { color: textColor }]}>Ticket Created</Text>
      <Text style={[ss.createdDesc,  { color: subColor  }]}>Your support ticket has been submitted successfully.</Text>

      <View style={[ss.metaCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={ss.metaRow}><Text style={[ss.metaKey, { color: subColor }]}>Ticket ID</Text><Text style={[ss.metaVal, { color: Colors.primary, fontFamily: "medium" }]}>#{t.id}</Text></View>
        <View style={ss.metaRow}><Text style={[ss.metaKey, { color: subColor }]}>Issue</Text><Text style={[ss.metaVal, { color: textColor }]} numberOfLines={2}>{t.subIssue}</Text></View>
        <View style={ss.metaRow}><Text style={[ss.metaKey, { color: subColor }]}>Status</Text><Badge status={t.status} isDark={isDark} /></View>
      </View>

      <View style={ss.createdActions}>
        <TouchableOpacity style={[ss.outlineBtn, { borderColor, flex: 1 }]} onPress={onNewTicket} activeOpacity={0.7}>
          <Text style={[ss.outlineBtnText, { color: textColor }]}>New Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ss.darkBtn, { flex: 1 }]} onPress={onViewThread} activeOpacity={0.8}>
          <Text style={ss.darkBtnText}>View Thread</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── VIEW: Thread ──────────────────────────────────────────────────────────────

function ViewThread({ isDark, textColor, subColor, borderColor, cardBg, inputBg, ticket, onTicketUpdate }: any) {
  const t = ticket as Ticket;
  const [messages, setMessages] = useState<Message[]>(t.messages || []);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Poll every 15s
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const data = await fetchTicket(t.id);
        setMessages(data.data.messages || []);
        if (onTicketUpdate) onTicketUpdate(data.data);
      } catch { /* silent */ }
    }, 15000);
    return () => clearInterval(poll);
  }, [t.id]);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const data = await postMessage(t.id, text);
      setMessages(data.data.messages || []);
      if (onTicketUpdate) onTicketUpdate(data.data);
      setInput("");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const resolved = t.status === "resolved";
  const sc = statusColors(t.status, isDark);

  return (
    <View style={{ flex: 1 }}>
      {/* Ticket info card */}
      <View style={[ss.threadInfoCard, { backgroundColor: cardBg, borderColor }]}>
        <View style={{ flex: 1 }}>
          <Text style={[ss.ticketId,  { color: textColor }]}>#{t.id}</Text>
          <Text style={[ss.ticketSub, { color: subColor  }]} numberOfLines={1}>{t.subIssue}</Text>
        </View>
        <Badge status={t.status} isDark={isDark} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        style={{ flex: 1 }}
        contentContainerStyle={ss.messagesList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          t.attachments && t.attachments.length > 0 ? (
            <View style={[ss.attachBlock, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[ss.attachLabel, { color: subColor }]}>ATTACHMENTS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing(6) }}>
                {t.attachments.map((url: string, i: number) => (
                  <Image key={i} source={{ uri: url }} style={ss.attachThumb} />
                ))}
              </ScrollView>
            </View>
          ) : null
        }
        ListFooterComponent={
          <Text style={[ss.threadNotice, { color: subColor }]}>Replies from support will appear here.</Text>
        }
        renderItem={({ item: m }) => (
          <View style={[ss.msgWrap, m.sender === "user" ? ss.msgUser : ss.msgSupport]}>
            <Text style={[ss.msgSender, m.sender !== "user" && { color: subColor }]}>
              {m.sender === "user" ? "You" : "Support"}
            </Text>
            <View style={[ss.msgBubble, m.sender === "user" ? ss.msgBubbleUser : [ss.msgBubbleSupport, { backgroundColor: cardBg, borderColor }]]}>
              <Text style={[ss.msgText, m.sender !== "user" && { color: textColor }]}>{m.text}</Text>
            </View>
          </View>
        )}
      />

      {/* Input row */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? spacing(80) : 0}>
        <View style={[ss.inputRow, { borderTopColor: borderColor }]}>
          <TextInput
            style={[ss.chatInput, { backgroundColor: inputBg, borderColor, color: textColor }]}
            placeholder={resolved ? "This ticket is resolved." : "Type your message…"}
            placeholderTextColor={subColor}
            value={input}
            onChangeText={setInput}
            editable={!resolved && !sending}
            returnKeyType="send"
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[ss.sendBtn, (resolved || sending) && { opacity: 0.4 }]}
            onPress={send}
            disabled={resolved || sending}
            activeOpacity={0.8}
          >
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Send size={scale(16)} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TicketingPage() {
  const { isDark } = useTheme();
  const { top }    = useSafeAreaInsets();
  const router     = useRouter();

  type View = "home" | "subissues" | "form" | "created" | "thread";
  const [view,             setView]             = useState<View>("home");
  const [activeTab,        setActiveTab]        = useState<"new"|"my">("new");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubIssue, setSelectedSubIssue] = useState<SubIssue | null>(null);
  const [activeTicket,     setActiveTicket]     = useState<Ticket | null>(null);
  const [tickets,          setTickets]          = useState<Ticket[]>([]);
  const [ticketsLoading,   setTicketsLoading]   = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [error,            setError]            = useState("");

  // Theme colours
  const bg        = isDark ? "#0f0f0f" : "#ffffff";
  const cardBg    = isDark ? "#1a1a1a" : "#f9fafb";
  const inputBg   = isDark ? "rgba(255,255,255,0.06)" : "#ffffff";
  const textColor = isDark ? Colors.text.white : Colors.primaryDark;
  const subColor  = isDark ? "rgba(160,160,160,1)" : Colors.label;
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(22,152,141,0.2)";
  const headerBg  = "#16988d";

  const TICKETS_CACHE_KEY = "store_support_tickets";

  const loadTickets = useCallback(async () => {
    setError("");

    // 1. Show cached tickets immediately if available
    const cached = await readCache<Ticket[]>(TICKETS_CACHE_KEY);
    if (cached) setTickets(cached);

    // 2. Fetch fresh data — show spinner only when cache is empty
    if (!cached) setTicketsLoading(true);
    try {
      const data = await fetchTickets();
      const fresh = data.data || [];
      setTickets(fresh);
      await writeCache(TICKETS_CACHE_KEY, fresh);
    } catch (e: any) {
      // Only surface the error if we have nothing to show
      if (!cached) setError(e.message);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const reset = () => {
    setView("home"); setSelectedCategory(null); setSelectedSubIssue(null);
    setActiveTicket(null); setActiveTab("new"); setError("");
  };

  const handleTabChange = (tab: "new"|"my") => {
    setActiveTab(tab);
    if (view !== "home") { setView("home"); setSelectedCategory(null); setSelectedSubIssue(null); }
    if (tab === "my") loadTickets();
  };

  const handleFormSubmit = async ({ date, desc, images }: { date: string; desc: string; images: ImagePicker.ImagePickerAsset[] }) => {
    if (!selectedCategory || !selectedSubIssue) return;
    setSubmitting(true); setError("");
    try {
      const data = await createTicket({ category: selectedCategory.title, subIssue: selectedSubIssue.title, description: desc, dateNoticed: date, images });
      const updated = [data.data, ...tickets];
      setTickets(updated);
      await writeCache("store_support_tickets", updated);
      setActiveTicket(data.data);
      setView("created");
    } catch (e: any) { setError(e.message || "Failed to submit ticket."); }
    finally { setSubmitting(false); }
  };

  const handleBack = () => {
    if (view === "subissues")    { setView("home"); setSelectedCategory(null); }
    else if (view === "form")    { setView("subissues"); setSelectedSubIssue(null); }
    else if (view === "created") { setView("home"); setSelectedCategory(null); setSelectedSubIssue(null); }
    else if (view === "thread")  { setView("home"); setActiveTab("my"); }
    else router.back();
  };

  const handleTicketUpdate = useCallback((updated: Ticket) => {
    setActiveTicket(updated);
    setTickets(prev => {
      const next = prev.map(t => t.id === updated.id ? updated : t);
      writeCache("store_support_tickets", next);
      return next;
    });
  }, []);

  // Header title/subtitle per view
  const headerInfo: Record<View, { title: string; subtitle: string }> = {
    home:      { title: "Need help?",     subtitle: "Choose what you need help with." },
    subissues: { title: selectedCategory?.title ?? "", subtitle: "Select the issue that best matches." },
    form:      { title: selectedSubIssue?.title ?? "", subtitle: "Fill in the details below." },
    created:   { title: "Ticket created", subtitle: "We have received your request." },
    thread:    { title: "Support thread", subtitle: "Your conversation with support." },
  };
  const { title, subtitle } = headerInfo[view];

  return (
    <View style={[ss.container, { backgroundColor: bg, paddingTop: top }]}>
      {/* Header */}
      <View style={[ss.header, { backgroundColor: headerBg }]}>
        <TouchableOpacity onPress={handleBack} hitSlop={12} style={ss.headerBackBtn}>
          <ArrowLeft size={scale(18)} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <View style={ss.headerTextWrap}>
          <Text style={ss.headerTitle} numberOfLines={1}>{title}</Text>
          <Text style={ss.headerSub}   numberOfLines={1}>{subtitle}</Text>
        </View>
        {view === "home" && <Headphones size={scale(18)} color="rgba(255,255,255,0.6)" />}
      </View>

      {/* Error banner */}
      {!!error && (
        <View style={ss.errorBanner}>
          <Text style={ss.errorText} numberOfLines={2}>{error}</Text>
          <TouchableOpacity onPress={() => setError("")} hitSlop={8}><X size={14} color="#b91c1c" /></TouchableOpacity>
        </View>
      )}

      {/* Views */}
      {view === "home" && (
        <ViewHome isDark={isDark} bg={bg} textColor={textColor} subColor={subColor} borderColor={borderColor} cardBg={cardBg}
          activeTab={activeTab} onTabChange={handleTabChange}
          onSelect={(cat: Category) => { setSelectedCategory(cat); setView("subissues"); }}
          tickets={tickets} ticketsLoading={ticketsLoading}
          onTicketClick={(t: Ticket) => { setActiveTicket(t); setView("thread"); }}
        />
      )}
      {view === "subissues" && selectedCategory && (
        <ViewSubIssues isDark={isDark} bg={bg} textColor={textColor} subColor={subColor} borderColor={borderColor} cardBg={cardBg}
          category={selectedCategory} activeTab={activeTab} onTabChange={handleTabChange}
          onSelect={(s: SubIssue) => { setSelectedSubIssue(s); setView("form"); }}
        />
      )}
      {view === "form" && selectedSubIssue && (
        <ViewForm isDark={isDark} textColor={textColor} subColor={subColor} borderColor={borderColor} cardBg={cardBg} inputBg={inputBg}
          subIssue={selectedSubIssue} activeTab={activeTab} onTabChange={handleTabChange}
          onSubmit={handleFormSubmit} submitting={submitting}
        />
      )}
      {view === "created" && activeTicket && (
        <ViewCreated isDark={isDark} textColor={textColor} subColor={subColor} borderColor={borderColor} cardBg={cardBg}
          ticket={activeTicket}
          onNewTicket={() => { setView("home"); setSelectedCategory(null); setSelectedSubIssue(null); setActiveTab("new"); }}
          onViewThread={() => setView("thread")}
        />
      )}
      {view === "thread" && activeTicket && (
        <ViewThread isDark={isDark} textColor={textColor} subColor={subColor} borderColor={borderColor} cardBg={cardBg} inputBg={inputBg}
          ticket={activeTicket} onTicketUpdate={handleTicketUpdate}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  container:      { flex: 1 },
  header:         { paddingHorizontal: spacing(16), paddingVertical: spacing(16), flexDirection: "row", alignItems: "center", gap: spacing(10) },
  headerBackBtn:  { padding: spacing(2) },
  headerTextWrap: { flex: 1 },
  headerTitle:    { fontFamily: "medium",  fontSize: scaleFontSize(15), color: "#fff",                  lineHeight: 20 },
  headerSub:      { fontFamily: "regular", fontSize: scaleFontSize(11), color: "rgba(255,255,255,0.65)", marginTop: 1 },

  scrollContent:  { paddingHorizontal: spacing(14), paddingVertical: spacing(14), gap: spacing(8) },

  sectionLabel:   { fontFamily: "medium", fontSize: scaleFontSize(10), letterSpacing: 0.8, paddingVertical: spacing(4), paddingHorizontal: spacing(2) },

  tabs:           { flexDirection: "row", borderRadius: 10, padding: 3, gap: 2 },
  tab:            { flex: 1, borderRadius: 8, paddingVertical: spacing(8), alignItems: "center" },
  tabText:        { fontSize: scaleFontSize(13) },

  catCard:        { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, padding: spacing(14), gap: spacing(10) },
  catCardInner:   { flex: 1, gap: spacing(3) },
  catTitle:       { fontFamily: "medium",  fontSize: scaleFontSize(13), lineHeight: 18 },
  catDesc:        { fontFamily: "regular", fontSize: scaleFontSize(11), lineHeight: 16 },

  ticketCard:     { borderWidth: 1, borderRadius: 12, padding: spacing(13), gap: spacing(4) },
  ticketCardTop:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ticketCardBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing(2) },
  ticketId:       { fontFamily: "medium",  fontSize: scaleFontSize(13) },
  ticketSub:      { fontFamily: "medium",  fontSize: scaleFontSize(12) },
  ticketPreview:  { fontFamily: "regular", fontSize: scaleFontSize(11), lineHeight: 16 },
  ticketMeta:     { fontFamily: "regular", fontSize: scaleFontSize(10) },

  badge:          { paddingHorizontal: spacing(8), paddingVertical: spacing(3), borderRadius: 20 },
  badgeText:      { fontFamily: "medium", fontSize: scaleFontSize(10) },

  emptyText:      { fontFamily: "regular", fontSize: scaleFontSize(13), textAlign: "center", paddingTop: spacing(32) },

  // Form
  formGroup:      { gap: spacing(6) },
  formLabel:      { fontFamily: "medium", fontSize: scaleFontSize(12) },
  input:          { borderWidth: 1, borderRadius: 8, paddingHorizontal: spacing(12), paddingVertical: spacing(10), fontFamily: "regular", fontSize: scaleFontSize(13) },
  textarea:       { height: 100, textAlignVertical: "top", paddingTop: spacing(10) },
  uploadBtn:      { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 10, padding: spacing(20), alignItems: "center", gap: spacing(5) },
  uploadTitle:    { fontFamily: "medium",  fontSize: scaleFontSize(13) },
  uploadHint:     { fontFamily: "regular", fontSize: scaleFontSize(11) },
  thumbRow:       { flexDirection: "row", flexWrap: "wrap", gap: spacing(8), marginTop: spacing(8) },
  thumbWrap:      { position: "relative" },
  thumb:          { width: scale(72), height: scale(72), borderRadius: 8 },
  thumbRemove:    { position: "absolute", top: -4, right: -4, backgroundColor: "#ef4444", borderRadius: 10, padding: 3 },
  submitBtn:      { backgroundColor: "#1a1a2e", borderRadius: 10, paddingVertical: spacing(14), alignItems: "center", marginTop: spacing(6) },
  submitText:     { fontFamily: "medium", fontSize: scaleFontSize(14), color: "#fff" },

  // Created
  createdIcon:    { width: scale(64), height: scale(64), borderRadius: scale(32), borderWidth: 2, alignItems: "center", justifyContent: "center", marginBottom: spacing(8) },
  createdTitle:   { fontFamily: "medium",  fontSize: scaleFontSize(18), marginBottom: spacing(4) },
  createdDesc:    { fontFamily: "regular", fontSize: scaleFontSize(12), textAlign: "center", marginBottom: spacing(16) },
  metaCard:       { width: "100%", borderWidth: 1, borderRadius: 10, padding: spacing(14), gap: spacing(10) },
  metaRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing(8) },
  metaKey:        { fontFamily: "regular", fontSize: scaleFontSize(12) },
  metaVal:        { fontFamily: "regular", fontSize: scaleFontSize(12), flexShrink: 1, textAlign: "right" },
  createdActions: { flexDirection: "row", gap: spacing(10), marginTop: spacing(20), paddingHorizontal: spacing(14), width: "100%" },
  outlineBtn:     { borderWidth: 1, borderRadius: 10, paddingVertical: spacing(12), alignItems: "center" },
  outlineBtnText: { fontFamily: "medium", fontSize: scaleFontSize(13) },
  darkBtn:        { backgroundColor: "#1a1a2e", borderRadius: 10, paddingVertical: spacing(12), alignItems: "center" },
  darkBtnText:    { fontFamily: "medium", fontSize: scaleFontSize(13), color: "#fff" },

  // Thread
  threadInfoCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: spacing(12), margin: spacing(12), gap: spacing(10) },
  messagesList:   { paddingHorizontal: spacing(14), paddingVertical: spacing(8), gap: spacing(10) },
  attachBlock:    { borderWidth: 1, borderRadius: 10, padding: spacing(10), marginBottom: spacing(8) },
  attachLabel:    { fontFamily: "medium", fontSize: scaleFontSize(10), letterSpacing: 0.6 },
  attachThumb:    { width: scale(80), height: scale(80), borderRadius: 8, marginRight: spacing(8) },
  msgWrap:        { maxWidth: "80%", gap: spacing(3) },
  msgUser:        { alignSelf: "flex-end" },
  msgSupport:     { alignSelf: "flex-start" },
  msgSender:      { fontFamily: "medium", fontSize: scaleFontSize(10), color: "rgba(255,255,255,0.65)", paddingHorizontal: spacing(2) },
  msgBubble:      { borderRadius: 12, paddingHorizontal: spacing(12), paddingVertical: spacing(9) },
  msgBubbleUser:  { backgroundColor: "#1a1a2e", borderBottomRightRadius: 4 },
  msgBubbleSupport: { borderWidth: 1, borderBottomLeftRadius: 4 },
  msgText:        { fontFamily: "regular", fontSize: scaleFontSize(13), color: "#fff", lineHeight: 19 },
  threadNotice:   { fontFamily: "regular", fontSize: scaleFontSize(11), textAlign: "center", marginTop: spacing(8), lineHeight: 16 },
  inputRow:       { flexDirection: "row", alignItems: "center", gap: spacing(8), paddingHorizontal: spacing(14), paddingVertical: spacing(10), borderTopWidth: 1 },
  chatInput:      { flex: 1, borderWidth: 1, borderRadius: 24, paddingHorizontal: spacing(14), paddingVertical: spacing(9), fontFamily: "regular", fontSize: scaleFontSize(13) },
  sendBtn:        { width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: Colors.label, alignItems: "center", justifyContent: "center" },

  // Error
  errorBanner:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fee2e2", paddingHorizontal: spacing(14), paddingVertical: spacing(8), gap: spacing(8) },
  errorText:      { flex: 1, fontFamily: "regular", fontSize: scaleFontSize(12), color: "#b91c1c" },
});
