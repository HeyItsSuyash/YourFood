import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountInCents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amountInCents / 100);
}

export function generateQrToken(): string {
  return "qr_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

export function generateSessionToken(): string {
  return "ses_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function generateOrderNumber(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = letters.charAt(Math.floor(Math.random() * letters.length));
  const num = Math.floor(100 + Math.random() * 900);
  return `${letter}-${num}`;
}

export function generateRewardCode(prefix: string = "YF"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}
