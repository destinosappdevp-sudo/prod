import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeExternalUrl(rawUrl?: string | null) {
  if (!rawUrl) return ""

  const value = rawUrl.trim()

  if (!value) return ""
  if (value.startsWith("/") || value.startsWith("#")) return value
  if (value.startsWith("//")) return `https:${value}`
  if (/^(javascript|data|vbscript):/i.test(value)) return ""
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)) return value

  return `https://${value}`
}
