/**
 * Currency utilities for the apparel supply chain tracker
 */

// Common currency symbols
export const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  HKD: "HK$",
  SGD: "S$",
  NZD: "NZ$",
  ZAR: "R",
  BRL: "R$",
  MXN: "Mex$",
  KRW: "₩",
  TWD: "NT$",
  RUB: "₽",
  TRY: "₺",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  THB: "฿",
  IDR: "Rp",
  MYR: "RM",
  PHP: "₱",
  VND: "₫",
  PKR: "₨",
  AED: "د.إ",
  SAR: "﷼",
  EGP: "E£",
  // Add more as needed
}

// Get symbol for a currency code
export function getCurrencySymbol(currencyCode: string): string {
  return currencySymbols[currencyCode] || currencyCode
}

// List of common currencies
export const commonCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "INR",
  "AUD",
  "CAD",
  "CHF",
  "HKD",
  "SGD",
  "NZD",
  "ZAR",
  "BRL",
  "MXN",
  "KRW",
]

// Fetch currencies from an API
export async function fetchCurrencies(): Promise<string[]> {
  try {
    // In a real app, you would use an API key
    const response = await fetch("https://openexchangerates.org/api/currencies.json")

    if (!response.ok) {
      throw new Error("Failed to fetch currencies")
    }

    const data = await response.json()
    return Object.keys(data)
  } catch (error) {
    console.error("Error fetching currencies:", error)
    // Fallback to common currencies if API fails
    return commonCurrencies
  }
}

// Format a number as currency
export function formatCurrency(amount: number | string, currencyCode = "USD"): string {
  if (amount === null || amount === undefined || amount === "") {
    return ""
  }

  const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  if (isNaN(numericAmount)) {
    return ""
  }

  const symbol = getCurrencySymbol(currencyCode)

  // Format based on currency
  if (currencyCode === "JPY" || currencyCode === "KRW" || currencyCode === "VND") {
    // These currencies typically don't use decimal places
    return `${symbol}${Math.round(numericAmount).toLocaleString()}`
  }

  return `${symbol}${numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Currency input component helper
export function getCurrencyInputPrefix(currencyCode: string): string {
  return getCurrencySymbol(currencyCode)
}
