// Currency utilities for the application
export const commonCurrencies = ["USD", "EUR", "GBP"] as const

export type Currency = (typeof commonCurrencies)[number]

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
  }
  return symbols[currency] || "$"
}

export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${amount.toFixed(2)}`
}
