import { generateInvoiceId } from "@/src/lib/invoice";
import { useUserStore } from "@/src/stores/userSlice";
import { InvoiceData } from "@/src/types/Invoice";

import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { Timestamp } from "firebase/firestore";

export type AnyDate =
  | string
  | number
  | Date
  | Timestamp
  | { seconds: number; nanoseconds: number }
  | undefined
  | null;

// ALWAYS return Date
export const toDate = (input: AnyDate): Date => {
  if (!input) return new Date();

  // Firestore Timestamp instance
  if (input instanceof Timestamp) return input.toDate();

  // Firestore plain object
  if (typeof input === "object" && "seconds" in input) {
    return new Date(input.seconds * 1000);
  }

  if (input instanceof Date) return input;

  if (typeof input === "number") return new Date(input);

  if (typeof input === "string") {
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
};

// ALWAYS return ISO
export const toISO = (input: AnyDate): string => {
  return toDate(input).toISOString();
};

// ALWAYS return display
export const toDisplay = (input: AnyDate): string => {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(toDate(input));
};

export const createAndShareInvoice = async (invoice: InvoiceData) => {
  const html = generateInvoiceHTML(invoice);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  await Sharing.shareAsync(uri);
};

export function formatFirestoreTimestamp(ts?: {
  seconds: number;
  nanoseconds: number;
}): string {
  if (!ts?.seconds) return "";

  const date = new Date(ts.seconds * 1000);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
export function formatFirestoreTimestampToISO(ts?: {
  seconds: number;
  nanoseconds: number;
}): string {
  if (!ts?.seconds) return ts ? String(ts) : new Date().toISOString();

  const date = new Date(ts.seconds * 1000);
  return date.toISOString();
}

export const generateInvoiceHTML = (data: InvoiceData) => {
  const brandSetting = useUserStore.getState().brandSetting;

  const subtotal = data.items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.price) || 0), 0);
  const total = subtotal;
  const balanceDue = total;

  const formatMoney = (n: number) =>
    `${data.currency ?? "NGN"} ${(Number(n) || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
    })}`;

  const invoiceNumber =
    data?.invoiceNumber ?? generateInvoiceId();

  const logoUrl = brandSetting?.logoUrl ?? data.logoUrl ?? "";
  const companyName = brandSetting?.businessName ?? data.businessName ?? "";
  const companyAddress = brandSetting?.businessAddress ?? data.businessAddress ?? "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Arial, sans-serif;
          padding: 48px;
          color: #333;
          font-size: 14px;
          line-height: 1.6;
          background: #fff;
        }

        /* HEADER */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 48px;
        }
        .logo {
          height: 80px;
          object-fit: contain;
          display: block;
        }
        .invoice-title {
          text-align: right;
        }
        .invoice-title h1 {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }
        .invoice-title .invoice-num {
          font-size: 18px;
          font-weight: 600;
        }

        /* BALANCE DUE (top right) */
        .balance-due-header {
          text-align: right;
          margin-bottom: 32px;
        }
        .balance-due-header .label {
          color: #666;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .balance-due-header .amount {
          font-size: 24px;
          font-weight: bold;
        }

        /* COMPANY DETAILS */
        .company-details {
          margin-bottom: 48px;
        }
        .company-details .name {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .company-details .address-line {
          font-size: 14px;
          color: #333;
          margin-bottom: 4px;
        }

        /* BILL TO + DATES */
        .bill-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 48px;
        }
        .bill-to .label {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .bill-to .client-name {
          font-weight: 600;
        }
        .dates {
          text-align: right;
          min-width: 240px;
        }
        .date-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 32px;
        }
        .date-row .date-label { color: #666; }
        .date-row .date-value { font-weight: 600; }

        /* TABLE */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 32px;
        }
        thead tr {
          background-color: #1f2937;
          color: white;
        }
        th {
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        th.right { text-align: right; }
        th.center { text-align: center; }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        td.right { text-align: right; }
        td.center { text-align: center; }

        /* TOTALS */
        .totals {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-bottom: 48px;
        }
        .totals-row {
          display: flex;
          gap: 64px;
          margin-bottom: 12px;
        }
        .totals-row .totals-label {
          font-weight: 600;
          color: #374151;
        }
        .totals-row .totals-value {
          width: 160px;
          text-align: right;
        }
        .totals-row.grand-total {
          font-size: 18px;
          font-weight: bold;
        }
        .balance-box {
          width: 100%;
          border-top: 2px solid #d1d5db;
          border-bottom: 2px solid #d1d5db;
          padding: 12px 16px;
          display: flex;
          gap: 64px;
          background-color: #f9fafb;
          margin-top: 4px;
        }
        .balance-box .totals-label { font-weight: bold; }
        .balance-box .totals-value { font-weight: bold; }

        /* NOTES */
        .notes {
          margin-bottom: 32px;
        }
        .notes h4 {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .notes p {
          font-size: 14px;
          white-space: pre-line;
          color: #374151;
        }

        /* TERMS */
        .terms {
          padding-top: 24px;
          border-top: 1px solid #d1d5db;
        }
        .terms h4 {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .terms p {
          font-size: 14px;
          color: #374151;
        }
      </style>
    </head>
    <body>

      <!-- HEADER: logo left, INVOICE title right -->
      <div class="header">
        <div>
          ${logoUrl ? `<img src="${logoUrl}" class="logo" alt="Logo" />` : ""}
        </div>
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <div class="invoice-num">#${invoiceNumber}</div>
        </div>
      </div>

      <!-- BALANCE DUE (top right, below header) -->
      <div class="balance-due-header">
        <div class="label">Balance Due</div>
        <div class="amount">${formatMoney(balanceDue)}</div>
      </div>

      <!-- COMPANY DETAILS -->
      <div class="company-details">
        <div class="name">${companyName}</div>
        ${companyAddress
          .split("\n")
          .map((line: string) => `<div class="address-line">${line}</div>`)
          .join("")}
      </div>

      <!-- BILL TO & DATES -->
      <div class="bill-section">
        <div class="bill-to">
          <div class="label">Bill To</div>
          <div class="client-name">${data.clientName ?? "—"}</div>
          ${data.clientPhone ? `<div>${data.clientPhone}</div>` : ""}
          ${data.clientEmail ? `<div>${data.clientEmail}</div>` : ""}
        </div>
        <div class="dates">
          <div class="date-row">
            <span class="date-label">Invoice Date :</span>
            <span class="date-value">${toDisplay(data.invoiceDate as any)}</span>
          </div>
          ${data.terms ? `
          <div class="date-row">
            <span class="date-label">Terms :</span>
            <span class="date-value">${data.terms}</span>
          </div>` : ""}
          <div class="date-row">
            <span class="date-label">Due Date :</span>
            <span class="date-value">${toDisplay(data.dueDate as any)}</span>
          </div>
        </div>
      </div>

      <!-- ITEMS TABLE -->
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item &amp; Description</th>
            <th class="center">Qty</th>
            <th class="right">Rate</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.items
            .map(
              (item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${item.description}</td>
              <td class="center">${(Number(item.quantity) || 0).toFixed(2)}</td>
              <td class="right">${formatMoney(Number(item.price) || 0)}</td>
              <td class="right">${formatMoney((Number(item.quantity) || 0) * (Number(item.price) || 0))}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <!-- TOTALS -->
      <div class="totals">
        <div class="totals-row">
          <span class="totals-label">Sub Total</span>
          <span class="totals-value">${formatMoney(subtotal)}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total</span>
          <span class="totals-value">${formatMoney(total)}</span>
        </div>
        <div class="balance-box">
          <span class="totals-label">Balance Due</span>
          <span class="totals-value">${formatMoney(balanceDue)}</span>
        </div>
      </div>

      ${
        data.notes?.length
          ? `
      <div class="notes">
        <h4>Notes</h4>
        <p>${data.notes.join("\n")}</p>
      </div>`
          : ""
      }

      ${
        data.termsAndConditions
          ? `
      <div class="terms">
        <h4>Terms &amp; Conditions</h4>
        <p>${data.termsAndConditions}</p>
      </div>`
          : ""
      }

    </body>
    </html>
  `;
};
