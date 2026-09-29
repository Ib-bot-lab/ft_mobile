const ACCOUNT_SID = "AC55b7acd57e2343cb36b421ba44b7b2c2";
const AUTH_TOKEN = "f339b4c170c3f2fc9ff398e0a405f8b0";
const FROM = "whatsapp:+2347070274857";
const OTP_TEMPLATE_SID = "HXc2dbba757cf7bf7b1893bc1309e2099b";

const normalizePhone = (phone: string): string | null => {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) cleaned = "+" + cleaned.slice(2);
  if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
  if (cleaned.replace("+", "").length < 7) return null;
  return cleaned;
};

export const generateOTP = (): string => {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
};

export type WhatsAppOTPResult =
  | { success: true; otp: string; sid: string }
  | { success: false; error: string };

export const sendWhatsAppOTP = async (phone: string): Promise<WhatsAppOTPResult> => {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM || !OTP_TEMPLATE_SID) {
    const error = "WhatsApp OTP not configured. Check .env for Twilio keys.";
    console.warn(error);
    return { success: false, error };
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    return { success: false, error: `Invalid phone number: ${phone}` };
  }

  const otp = generateOTP();
  const toFormatted = `whatsapp:${normalized}`;
  const auth = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);

  const body = new URLSearchParams({
    From: FROM,
    To: toFormatted,
    ContentSid: OTP_TEMPLATE_SID,
    ContentVariables: JSON.stringify({ "1": otp }),
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      const reason =
        data?.message || data?.error_message || `Error code ${data?.code || res.status}`;
      console.error("WhatsApp OTP failed:", data);
      return { success: false, error: reason };
    }

    console.log("WhatsApp OTP sent:", data.sid);
    return { success: true, otp, sid: data.sid };
  } catch (err: any) {
    console.error("WhatsApp OTP error:", err);
    return { success: false, error: err.message || "Network error" };
  }
};

export const sendWhatsAppWelcome = async (
  phone: string,
  name: string,
): Promise<void> => {
  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM) {
    console.warn("WhatsApp welcome not configured. Check Twilio keys.");
    return;
  }

  const TEMPLATE_SID = "HXd1d1a23abaeef24ef6d78b326c1b752b";

  const normalized = normalizePhone(phone);
  if (!normalized) {
    console.warn(`Invalid phone number for welcome message: ${phone}`);
    return;
  }

  const toFormatted = `whatsapp:${normalized}`;
  const auth = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);

  const body = new URLSearchParams({
    From: FROM,
    To: toFormatted,
    ContentSid: TEMPLATE_SID,
    ContentVariables: JSON.stringify({ "1": name }),
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      console.warn("WhatsApp welcome failed:", data?.message || data?.error_message);
    } else {
      console.log("WhatsApp welcome sent:", data.sid);
    }
  } catch (err: any) {
    console.warn("WhatsApp welcome error:", err.message);
  }
};
