export const BCV_RATE_DECIMALS = 8;

const BCV_RATE_DISPLAY_FORMATTER = new Intl.NumberFormat("es-VE", {
  minimumFractionDigits: BCV_RATE_DECIMALS,
  maximumFractionDigits: BCV_RATE_DECIMALS,
});

export function parseBcvRateValue(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value && typeof value === "object") {
    const raw = (value as { toString: () => string }).toString();
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function formatBcvRateDisplay(value: unknown): string {
  const parsed = parseBcvRateValue(value);
  return parsed === null ? "—" : BCV_RATE_DISPLAY_FORMATTER.format(parsed);
}

export function formatBcvRateInput(value: unknown): string {
  const parsed = parseBcvRateValue(value);
  if (parsed !== null) {
    return parsed.toFixed(BCV_RATE_DECIMALS).replace(".", ",");
  }

  if (typeof value === "string") {
    return value.replace(".", ",");
  }

  if (value && typeof value === "object") {
    return (value as { toString: () => string }).toString().replace(".", ",");
  }

  return "";
}


