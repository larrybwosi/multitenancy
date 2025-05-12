import { Prisma } from "@/prisma/client";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @param locale The locale to use for formatting (default: en-US)
 * @param options Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | Prisma.Decimal | string,
  currency: string = "ksh",
  locale: string = "en-KE",
  options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...options,
  }).format(amount);
}

/**
 * Format a number with commas
 * @param num The number to format
 * @returns Formatted number string with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Calculate the profit margin percentage
 * @param costPrice The cost price
 * @param sellingPrice The selling price
 * @returns The profit margin as a percentage
 */
export function calculateProfitMargin(
  costPrice: number,
  sellingPrice: number
): number {
  if (costPrice <= 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Calculate the selling price based on cost and desired margin
 * @param costPrice The cost price
 * @param marginPercent The desired profit margin percentage
 * @returns The calculated selling price
 */
export function calculateSellingPrice(
  costPrice: number,
  marginPercent: number
): number {
  return costPrice * (1 + marginPercent / 100);
}

/**
 * Truncate text with ellipsis
 * @param text The text to truncate
 * @param maxLength Maximum length before truncating
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Format a date with options
 * @param date The date to format
 * @param options Date formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Parse a string as a float with a fallback
 * @param value The string value to parse
 * @param fallback The fallback value if parsing fails
 * @returns The parsed number or fallback
 */
export function parseFloatSafe(value: string, fallback: number = 0): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

export function formatShortDate(date: Date | string): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}


/**
 * Helper function to get currency code for a region
 * Note: This is a simplified version - you might want to expand it
 * or use a proper library like currency-codes
 */
function getCurrencyCodeForRegion(region: string): string {
  const regionToCurrency: Record<string, string> = {
    US: "USD",
    GB: "GBP",
    EU: "EUR",
    DE: "EUR",
    FR: "EUR",
    JP: "JPY",
    IN: "INR",
    CN: "CNY",
    BR: "BRL",
    CA: "CAD",
    AU: "AUD",
    MX: "MXN",
    KE: "KSH",
    NG: "NGN",
    ZA: "ZAR",
    // Add more regions and their corresponding currencies as needed
  };

  return regionToCurrency[region] || "USD";
}

/**
 * Get the user's local currency and locale from browser
 * @returns { currency: string, locale: string } The detected currency and locale
 */
export function getLocalCurrencyValues(): { currency: string; locale: string } {
  // Default values
  let locale = "en-US";
  let currency = "USD";

  // Try to detect from browser if available
  if (typeof window !== 'undefined' && window.navigator) {
    try {
      locale = window.navigator.language;
      
      // Get the currency for the detected locale
      const region = locale.split('-')[1] || 'US';
      
      currency = getCurrencyCodeForRegion(region);
    } catch (e) {
      console.warn("Could not detect local currency values", e);
    }
  }

  return { currency, locale };
}

