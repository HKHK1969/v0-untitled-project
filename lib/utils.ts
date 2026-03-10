import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date, format = "yyyy-MM-dd"): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return ""
  }

  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()

  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const seconds = date.getSeconds().toString().padStart(2, "0")

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const monthShort = monthNames[date.getMonth()].substring(0, 3)

  return format
    .replace("yyyy", year.toString())
    .replace("MM", month)
    .replace("dd", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds)
    .replace("MMMM", monthNames[date.getMonth()])
    .replace("MMM", monthShort)
    .replace("M", (date.getMonth() + 1).toString())
    .replace("d", date.getDate().toString())
}
