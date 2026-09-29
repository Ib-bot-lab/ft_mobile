import * as Burnt from "burnt";
import { ToastOptions } from "burnt/build/types";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Timestamp } from "firebase/firestore";
import { Dimensions, PixelRatio, Platform } from "react-native";
import { getCurrentUserEmail } from "../lib/auth-utils";
import { BrandSettings } from "../types/auth";
import { Client, ClientMeasurements } from "../types/client";

// Extend dayjs with the parsing plugin
dayjs.extend(customParseFormat);

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions that we're designing for
// Change these values to match your design specifications
const baseWidth = 375; // iPhone X width
const baseHeight = 812; // iPhone X height

// Determine scale ratio based on current device width vs. base width
const widthRatio = SCREEN_WIDTH / baseWidth;
const heightRatio = SCREEN_HEIGHT / baseHeight;

// We'll use a combination of width and height scaling
// This prevents excessive scaling on tablets
const ratio = Math.min(widthRatio, heightRatio);

/**
 * Scale a value based on the device screen size
 * @param size - The original size in pixels
 * @param factor - Optional factor to adjust the scaling (default: 0.5)
 * @returns The scaled size
 */
export const scale = (size: number, factor: number = 0.5): number => {
  // We apply a factor to prevent too aggressive scaling
  const scaledSize = size + size * (ratio - 1) * factor;
  return Math.round(scaledSize);
};

/**
 * Scale font size with platform specific adjustments
 * @param size - The original font size
 * @returns The scaled font size
 */
export const scaleFontSize = (size: number): number => {
  const newSize = scale(size, 0.4);

  // Different pixel densities on Android vs iOS
  if (Platform.OS === "ios") {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Android sometimes needs slightly larger fonts
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) + 1;
  }
};

/**
 * Horizontal scale - scales values specifically for horizontal dimensions
 * @param size - The original size
 * @returns The horizontally scaled size
 */
export const scaleWidth = (size: number): number => {
  return Math.round(size * widthRatio);
};

/**
 * Vertical scale - scales values specifically for vertical dimensions
 * @param size - The original size
 * @returns The vertically scaled size
 */
export const scaleHeight = (size: number): number => {
  return Math.round(size * heightRatio);
};

/**
 * Calculate appropriate spacing for different screen sizes
 * @param size - Original spacing value
 * @returns The scaled spacing
 */
export const spacing = (size: number): number => {
  return scale(size, 0.3);
};

/**
 * Extracts the initials from a person's name
 *
 * @param name - The full name to extract initials from
 * @param maxInitials - Maximum number of initials to return (default: 2)
 * @param fallback - Fallback character if no valid initials can be extracted (default: '?')
 * @returns The extracted initials (uppercase)
 */
export const GetInitials = (
  name: string | null | undefined,
  maxInitials: number = 2,
  fallback: string = "N/A",
): string => {
  // Return fallback if name is null, undefined, or empty after trimming
  if (!name?.trim()) {
    return fallback;
  }

  // Split the name into parts and filter out empty parts
  const nameParts = name
    .trim()
    .split(/[\s-]+/) // Split by spaces and hyphens
    .filter((part) => part.length > 0);

  if (nameParts.length === 0) {
    return fallback;
  }

  // If there's only one name part, use the first two characters or just the first
  if (nameParts.length === 1) {
    const singleName = nameParts[0];
    // If the name is just one character, return it
    if (singleName.length === 1) {
      return singleName.toUpperCase();
    }
    // Otherwise take the first character
    return singleName.charAt(0).toUpperCase();
  }

  // For multiple name parts, get initials based on maxInitials preference
  let initials = "";

  // Determine which parts to use (prefer first and last name)
  const partsToUse =
    nameParts.length <= maxInitials
      ? nameParts
      : [
          ...nameParts.slice(0, Math.ceil(maxInitials / 2)),
          ...nameParts.slice(-Math.floor(maxInitials / 2)),
        ];

  // Extract first character from each selected part
  for (let i = 0; i < Math.min(partsToUse.length, maxInitials); i++) {
    const initial = partsToUse[i].charAt(0);
    if (initial.match(/[a-z]/i)) {
      // Only use alphabetic characters
      initials += initial.toUpperCase();
    }
  }

  // If no valid initials found, return fallback
  return initials || fallback;
};

interface BoxWidthConfig {
  gap?: number;
  padding?: number;
  boxCount: number;
}

/**
 * Generates the width for individual boxes based on screen size and layout constraints.
 * * @param config - The layout parameters (screenWidth, gap, padding, boxCount)
 * @returns The calculated width for a single box
 */
export const CalculateBoxWidth = ({
  gap = 30,
  padding = 20,
  boxCount = 4,
}: BoxWidthConfig): number => {
  const contentWidth = SCREEN_WIDTH - padding * 2;
  const totalGapWidth = gap * (boxCount - 1);
  const totalBoxWidth = contentWidth - totalGapWidth;

  const boxWidth = totalBoxWidth / boxCount;

  return boxWidth;
};

/**
 * Determines if a given 24-hour time string is AM or PM.
 * * @param time - A string in the format "HH:MM" (e.g., "22:44")
 * @returns "AM" or "PM"
 */
export const GetAmPm = (isoDate: string): "AM" | "PM" => {
  if (!isoDate) return "AM";

  const date = new Date(isoDate);
  const hours = date.getHours(); // 0–23

  return hours >= 12 ? "PM" : "AM";
};

/**
 * Get current date in "Thursday, 8 January 2026" format
 */
export const GetFormattedDate = (): string => {
  const date = new Date();

  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
};

/**
 * Helper to remove ".0" from formatted numbers (e.g., "1.0m" -> "1m")
 */
const cleanDecimal = (val: string): string => {
  return val.endsWith(".0") ? val.slice(0, -2) : val;
};

/**
 * Formats a numeric string into a shorthand Naira representation.
 * @param value - The currency string (e.g., "1,500,000")
 * @returns A formatted string (e.g., "₦1.5m")
 */
export const FormatNairaShorthand = (value: string): string => {
  // 1. Remove commas and convert to a number
  const numericValue = parseFloat(value.replace(/,/g, ""));

  // Handle cases where the input isn't a valid number
  if (isNaN(numericValue)) return "₦0";

  const nairaSymbol = "₦";

  // 2. Determine formatting based on size
  if (numericValue >= 1_000_000_000) {
    // Billions
    const formatted = (numericValue / 1_000_000_000).toFixed(1);
    return `${nairaSymbol}${cleanDecimal(formatted)}b`;
  }

  if (numericValue >= 1_000_000) {
    // Millions
    const formatted = (numericValue / 1_000_000).toFixed(1);
    return `${nairaSymbol}${cleanDecimal(formatted)}m`;
  }

  if (numericValue >= 1_000) {
    // Thousands
    const formatted = (numericValue / 1_000).toFixed(1);
    return `${nairaSymbol}${cleanDecimal(formatted)}k`;
  }

  // Under 1000, just return the number with the symbol
  return `${nairaSymbol}${numericValue}`;
};

/**
 * Formats a date string into a readable shorthand.
 * @param dateString - Example: "10 January 2026 at 12:46:43 UTC+1"
 * @param showYear - Boolean to determine if the year should be included
 * @returns Formatted string like "10 Jan 2026" or "10 Jan"
 */
export const FormatOrderDate = (
  dateString: string | any,
  showYear: boolean = true,
): string => {
  if (!dateString) return "—";

  // Handle Firestore Timestamp objects
  if (typeof dateString === "object" && typeof dateString.toDate === "function") {
    const date = dateString.toDate();
    if (isNaN(date.getTime())) return "Invalid Date";
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      ...(showYear && { year: "numeric" }),
    };
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  }

  // Ensure it's a string before calling .replace
  const str = typeof dateString === "string" ? dateString : String(dateString);

  // 1. Remove the word "at" which often breaks the Date parser
  const sanitizedDate = str.replace(/\bat\b/g, "");

  const date = new Date(sanitizedDate);

  // Check if the date is invalid
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  // 2. Configure the formatter
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short", // "Jan", "Feb", etc.
    ...(showYear && { year: "numeric" }), // Only add year if showYear is true
  };

  // 3. Format to "10 Jan 2026"
  return new Intl.DateTimeFormat("en-GB", options).format(date);
};

/**
 * Capitalizes the first letter of the first name in a full name string.
 * @param fullName - The full name to process
 * @returns The full name with the first name capitalized
 */
export const CapitalizeFirstName = (fullName: string | undefined): string => {
  if (!fullName || !fullName.trim()) return "Unnamed";

  const nameParts = fullName.trim().split(" ");
  if (nameParts.length === 0) return fullName;

  // Capitalize the first name
  nameParts[0] = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);

  return nameParts.join(" ");
};

/**
 * Converts a measurements object into a displayable array
 */
export const FormatMeasurementsForUI = (measurements?: ClientMeasurements) => {
  if (!measurements) return [];
  return Object.entries(measurements)
    .filter(([key, value]) => {
      const excluded = ["notes", "sleeveType", "dressType"];
      return !excluded.includes(key) && value !== "" && value !== undefined;
    })
    .map(([key, value]) => {
      return {
        label: key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase()),
        value: value,
        key: key,
      };
    });
};

/**
 * Formats a value into a currency string with the Naira symbol and commas.
 * @param value - The number or string to format (e.g., 25000 or "25000")
 * @returns A formatted string (e.g., ₦25,000)
 */
export const FormatCurrency = (value: string | number): string => {
  // 1. If it's a string, remove any non-numeric characters (like existing commas)
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.]/g, ""))
      : value;

  // 2. Handle invalid numbers
  if (isNaN(numericValue)) {
    return "₦0";
  }

  // 3. Use the Intl formatter for Nigeria
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0, // Set to 0 if you don't want kobo (.00)
    maximumFractionDigits: 0,
  })
    .format(numericValue)
    .replace("NGN", "₦"); // Replace the currency code with the symbol if necessary
};

/**
 * Returns the current date in "Month Year" format.
 * @returns A string like "December 2025"
 */
export const GetCurrentMonthYear = (): string => {
  const now = new Date();

  // We use 'en-GB' or 'en-US' for English month names
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(now);
};

export const GetDetailedDate = (date: Date | string | any): string => {
  const now = convertToDate(date);

  console.log("date detailed date", date);

  // We use 'en-GB' or 'en-US' for English month names
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
};

/**
 * Formats an ISO date string into "Month Day, Year at Hour:Minute AM/PM"
 * Example: "2026-03-20T22:59:18" -> "March 20, 2026 at 10:59 PM"
 */
export const formatFintechDate = (dateString: string | Date): string => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) return "N/A";

  // 1. Format the Date part (March 7, 2024)
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  const datePart = new Intl.DateTimeFormat("en-US", dateOptions).format(date);

  // 2. Format the Time part (07:00 PM)
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const timePart = new Intl.DateTimeFormat("en-US", timeOptions).format(date);

  // 3. Combine with "at"
  return `${datePart} at ${timePart}`;
};

export const ConvertToISO = (
  input?: string | Date | Timestamp | number | null,
  form?: string,
): string => {
  try {
    if (!input) {
      console.warn("Missing date:", form);
      return new Date().toISOString();
    }

    // Firestore Timestamp
    if (input instanceof Timestamp) {
      return input.toDate().toISOString();
    }

    // Date object
    if (input instanceof Date) {
      return input.toISOString();
    }

    // number (epoch)
    if (typeof input === "number") {
      return new Date(input).toISOString();
    }

    // string handling
    if (typeof input === "string") {
      // ISO string
      if (!isNaN(Date.parse(input))) {
        return new Date(input).toISOString();
      }

      // legacy "DD MMM YYYY"
      const parsed = dayjs(input, "DD MMM YYYY", true);
      if (parsed.isValid()) {
        return parsed.toISOString();
      }
    }

    console.warn("Invalid date provided:", form, input);
    return new Date().toISOString();
  } catch (e) {
    console.error("error in convertISO", e);
    console.warn("Date conversion failed:", form, input);
    return new Date().toISOString();
  }
};

export const normalizeToISODateTime = (
  dateISO: string,
  timeOrISO: string,
): string => {
  if (!timeOrISO) return new Date(dateISO).toISOString();

  // NEW FORMAT → already ISO
  if (timeOrISO.includes("T")) {
    const d = new Date(timeOrISO);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  // LEGACY FORMAT → "HH:mm"
  const [hours, minutes] = timeOrISO.split(":").map(Number);

  const base = new Date(dateISO);

  base.setHours(hours || 0);
  base.setMinutes(minutes || 0);
  base.setSeconds(0);
  base.setMilliseconds(0);

  return base.toISOString();
};

export const GetDetailedTime = (date: Date | string | any): string => {
  const now = convertToDate(date);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(now)
    .toLowerCase(); // makes AM/PM → am/pm
};

export const convertToDate = (date: Date | string | any): Date => {
  if (
    typeof date === "object" &&
    date !== null &&
    "seconds" in date &&
    "nanoseconds" in date
  ) {
    return new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
  }

  return new Date(date);
};

/**
 * Takes an ISO string and returns the date in YYYY-MM-DD format
 * @param isoString - e.g., "2025-12-16T21:13:04.778Z"
 * @returns "2025-12-16"
 */
export const FormatDateToYYYYMMDD = (isoString: string): string => {
  if (!isoString) return "";

  // ISO strings are always formatted as YYYY-MM-DDTHH:mm:ss...
  // We simply split at the "T" and take the first part.
  return isoString.split("T")[0];
};

export const formatPrice = (value: string) => {
  if (!value) return "";

  // remove everything except digits and dot
  const cleaned = value.replace(/[^0-9.]/g, "");

  // prevent multiple dots
  const parts = cleaned.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1]?.slice(0, 2); // max 2 decimals

  const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart !== undefined
    ? `${formattedInt}.${decimalPart}`
    : formattedInt;
};

export const formatInvoiceDate = (dateString: string): string => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString; // fallback if invalid

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Formats Firebase error strings into human-readable text.
 * @param error - The raw error string or object from Firebase
 * @returns A clean string like "User not found"
 */
export const FormatFirebaseError = (error: any): string => {
  const errorString = error?.toString() || "";

  // 1. Extract the code inside the brackets: (auth/user-not-found)
  const match = errorString.match(/\((.*?)\)/);
  if (!match) return "An unexpected error occurred.";

  const fullCode = match[1]; // e.g., "auth/user-not-found"

  // 2. Remove the "auth/" or "storage/" prefix and clean up
  const cleanCode = fullCode.split("/")[1] || fullCode;

  // 3. Replace dashes with spaces and capitalize the first letter
  const formatted = cleanCode.replace(/-/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const ShowToastMessage = (option: ToastOptions) => {
  Burnt.toast({
    preset: "done",
    haptic: "none",
    duration: 2,
    shouldDismissByDrag: true,
    from: "bottom",
    layout: {
      iconSize: {
        height: 24,
        width: 24,
      },
    },
    ...option,
    title: option.title,
  });
};

export const numberize = (value: string): number => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return Number(cleaned);
};

export const extractClientMeasurements = (client: Client) => {
  const measurementFields = [
    "chest",
    "hips",
    "waist",
    "shoulder",
    "sleeveLength",
    "length",
    "knees",
    "shirtLength",
    "skirtLength",
    "trouserLength",
    "blouseLength",
    "dressType",
    // Add any other measurement fields from your Client type
  ];

  // Check if client has a measurements object (new format)
  if (client.measurements && typeof client.measurements === "object") {
    return client.measurements;
  }

  // Legacy format: extract measurements from root level
  const measurements: { [key: string]: string } = {};

  measurementFields.forEach((field) => {
    if (client[field as keyof Client]) {
      measurements[field] = String(client[field as keyof Client]);
    }
  });

  return measurements;
};

export const emptyBrandSettings = (email: string): BrandSettings => ({
  businessName: "",
  businessAddress: "",
  businessEmail: "",
  businessPhone: "",
  businessWebsite: "",
  instagramHandle: "",
  primaryColor: "#000000",
  secondaryColor: "#666666",
  bankName: "",
  accountNumber: "",
  accountName: "",
  logoUrl: "",
  footerText: "",
  termsAndConditions: "",
  updatedAt: "",
  userEmail: email,
});

export const sanitizeBrandSettings = (
  payload: Partial<BrandSettings>,
): BrandSettings => {
  const email = payload.userEmail ?? getCurrentUserEmail();

  const base = emptyBrandSettings(email);

  // Force no null/undefined — safe for both Firebase and MongoDB
  return {
    ...base,
    ...payload,
    businessName: payload.businessName ?? "",
    businessAddress: payload.businessAddress ?? "",
    businessEmail: payload.businessEmail ?? "",
    businessPhone: payload.businessPhone ?? "",
    businessWebsite: payload.businessWebsite ?? "",
    instagramHandle: payload.instagramHandle ?? "",
    primaryColor: payload.primaryColor ?? "#000000",
    secondaryColor: payload.secondaryColor ?? "#666666",
    bankName: payload.bankName ?? "",
    accountNumber: payload.accountNumber ?? "",
    accountName: payload.accountName ?? "",
    logoUrl: payload.logoUrl ?? "",
    footerText: payload.footerText ?? "",
    termsAndConditions: payload.termsAndConditions ?? "",
    updatedAt: payload.updatedAt ?? "",
    userEmail: email,
  };
};
