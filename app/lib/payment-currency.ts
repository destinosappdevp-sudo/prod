export type WalletCurrency = "USD" | "VES";

type PaymentLike = {
  amount: number;
  subtotal: number;
  serviceFee: number;
  paymentMethod?: string | null;
  paymentDetails?: unknown;
};

type PaymentDetailsObject = Record<string, unknown>;

export type ParsedPaymentFinancials = {
  currency: WalletCurrency;
  amount: number;
  subtotal: number;
  serviceFee: number;
  amountUsd: number;
  amountBs: number;
  subtotalUsd: number;
  subtotalBs: number;
  serviceFeeUsd: number;
  serviceFeeBs: number;
  bcvRateUsed: number | null;
  bcvRateDate: string | null;
  paymentDate: string | null;
};

export function getPaymentMethodLabel(
  method?: string | null,
  paymentDetails?: unknown
): string {
  const details = getDetailsObject(paymentDetails);
  const checkoutMode = typeof details?.checkoutMode === "string" ? details.checkoutMode : null;
  const explicitLabel =
    typeof details?.displayMethodLabel === "string" ? details.displayMethodLabel : null;

  if (checkoutMode === "SAVINGS") {
    return "Saldo de Ahorros";
  }

  if (checkoutMode === "MIXED") {
    return "Pago Mixto";
  }

  if (explicitLabel) {
    return explicitLabel;
  }

  const methods: Record<string, string> = {
    PAGO_MOVIL: "Pago Móvil",
    ZELLE: "Zelle",
    ZILLI: "Zilli",
    TARJETA_INTERNACIONAL: "Tarjeta Internacional",
    TRANSFERENCIA_BANCARIA: "Transferencia Bancaria",
  };

  return method ? methods[method] || method : "-";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getDetailsObject(value: unknown): PaymentDetailsObject | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as PaymentDetailsObject;
}

function hasPositiveNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function currencyForPaymentMethod(method?: string | null): WalletCurrency {
  if (method === "PAGO_MOVIL") {
    return "VES";
  }

  return "USD";
}

export function getCurrencySymbol(currency: WalletCurrency): string {
  return currency === "VES" ? "Bs" : "$";
}

export function parsePaymentFinancials(payment: PaymentLike): ParsedPaymentFinancials {
  const details = getDetailsObject(payment.paymentDetails);

  const currencyRaw = typeof details?.currency === "string" ? details.currency : null;
  const fallbackCurrency = currencyForPaymentMethod(payment.paymentMethod);
  const currency: WalletCurrency =
    currencyRaw === "USD" || currencyRaw === "VES" ? currencyRaw : fallbackCurrency;

  const bcvRateUsed = toNumber(details?.bcvRateUsed);

  const amountUsdFromDetails = toNumber(details?.amountUsd);
  const amountBsFromDetails = toNumber(details?.amountBs);
  const subtotalUsdFromDetails = toNumber(details?.subtotalUsd);
  const subtotalBsFromDetails = toNumber(details?.subtotalBs);
  const serviceFeeUsdFromDetails = toNumber(details?.serviceFeeUsd);
  const serviceFeeBsFromDetails = toNumber(details?.serviceFeeBs);

  let amountUsd = amountUsdFromDetails;
  let amountBs = amountBsFromDetails;
  let subtotalUsd = subtotalUsdFromDetails;
  let subtotalBs = subtotalBsFromDetails;
  let serviceFeeUsd = serviceFeeUsdFromDetails;
  let serviceFeeBs = serviceFeeBsFromDetails;

  if (!hasPositiveNumber(amountUsd) || !hasPositiveNumber(subtotalUsd) || !hasPositiveNumber(serviceFeeUsd)) {
    if (currency === "USD") {
      amountUsd = hasPositiveNumber(amountUsd) ? amountUsd : payment.amount;
      subtotalUsd = hasPositiveNumber(subtotalUsd) ? subtotalUsd : payment.subtotal;
      serviceFeeUsd = hasPositiveNumber(serviceFeeUsd)
        ? serviceFeeUsd
        : payment.serviceFee;
    }
  }

  if (!hasPositiveNumber(amountBs) || !hasPositiveNumber(subtotalBs) || !hasPositiveNumber(serviceFeeBs)) {
    if (currency === "VES") {
      amountBs = hasPositiveNumber(amountBs) ? amountBs : payment.amount;
      subtotalBs = hasPositiveNumber(subtotalBs) ? subtotalBs : payment.subtotal;
      serviceFeeBs = hasPositiveNumber(serviceFeeBs)
        ? serviceFeeBs
        : payment.serviceFee;
    }
  }

  if (!hasPositiveNumber(amountBs) && hasPositiveNumber(amountUsd) && hasPositiveNumber(bcvRateUsed)) {
    amountBs = Number((amountUsd * bcvRateUsed).toFixed(2));
  }

  if (!hasPositiveNumber(subtotalBs) && hasPositiveNumber(subtotalUsd) && hasPositiveNumber(bcvRateUsed)) {
    subtotalBs = Number((subtotalUsd * bcvRateUsed).toFixed(2));
  }

  if (!hasPositiveNumber(serviceFeeBs) && hasPositiveNumber(serviceFeeUsd) && hasPositiveNumber(bcvRateUsed)) {
    serviceFeeBs = Number((serviceFeeUsd * bcvRateUsed).toFixed(2));
  }

  if (!hasPositiveNumber(amountUsd) && hasPositiveNumber(amountBs) && hasPositiveNumber(bcvRateUsed)) {
    amountUsd = Number((amountBs / bcvRateUsed).toFixed(2));
  }

  if (!hasPositiveNumber(subtotalUsd) && hasPositiveNumber(subtotalBs) && hasPositiveNumber(bcvRateUsed)) {
    subtotalUsd = Number((subtotalBs / bcvRateUsed).toFixed(2));
  }

  if (!hasPositiveNumber(serviceFeeUsd) && hasPositiveNumber(serviceFeeBs) && hasPositiveNumber(bcvRateUsed)) {
    serviceFeeUsd = Number((serviceFeeBs / bcvRateUsed).toFixed(2));
  }

  return {
    currency,
    amount: payment.amount,
    subtotal: payment.subtotal,
    serviceFee: payment.serviceFee,
    amountUsd: hasPositiveNumber(amountUsd) ? amountUsd : 0,
    amountBs: hasPositiveNumber(amountBs) ? amountBs : 0,
    subtotalUsd: hasPositiveNumber(subtotalUsd) ? subtotalUsd : 0,
    subtotalBs: hasPositiveNumber(subtotalBs) ? subtotalBs : 0,
    serviceFeeUsd: hasPositiveNumber(serviceFeeUsd) ? serviceFeeUsd : 0,
    serviceFeeBs: hasPositiveNumber(serviceFeeBs) ? serviceFeeBs : 0,
    bcvRateUsed: hasPositiveNumber(bcvRateUsed) ? bcvRateUsed : null,
    bcvRateDate:
      typeof details?.bcvRateDate === "string" && details.bcvRateDate
        ? details.bcvRateDate
        : null,
    paymentDate:
      typeof details?.paymentDate === "string" && details.paymentDate
        ? details.paymentDate
        : null,
  };
}

export function formatCurrencyAmount(value: number, currency: WalletCurrency): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${safeValue.toFixed(2)}`;
}
