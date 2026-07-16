import prisma from "./db";

export type PagoMovilMode = "MANUAL" | "R4";

export interface PagoMovilMerchantData {
  phone: string;
  bank: string;
  cedula: string;
}

export interface PagoMovilCredentials {
  commerceId: string;
  hmacSecret: string;
  authToken: string;
  allowedIps: string[];
}

export interface PagoMovilCreditoCredentials {
  commerceId: string;
  hmacSecret: string;
  authToken: string;
}

export interface PagoMovilFullConfig {
  mode: PagoMovilMode;
  merchant: PagoMovilMerchantData;
  credentials: PagoMovilCredentials;
  credito: PagoMovilCreditoCredentials;
}

const DEFAULT_MODE: PagoMovilMode = "MANUAL";

async function ensurePlatformConfig() {
  const prismaAny = prisma as any;
  let config = await prismaAny.platformConfig.findFirst();
  if (!config) {
    config = await prismaAny.platformConfig.create({
      data: {
        commissionPercent: 10,
        maintenanceMode: false,
        pagomovilMode: DEFAULT_MODE,
      },
    });
  }
  return config;
}

export async function getPagoMovilConfig(): Promise<PagoMovilFullConfig> {
  const config = await ensurePlatformConfig();

  return {
    mode: config.pagomovilMode === "R4" ? "R4" : "MANUAL",
    merchant: {
      phone: config.pagomovilPhone || "",
      bank: config.pagomovilBank || "",
      cedula: config.pagomovilCedula || "",
    },
    credentials: {
      commerceId: config.pagomovilIdComercio || "",
      hmacSecret: config.pagomovilHmacSecret || "",
      authToken: config.pagomovilAuthToken || "",
      allowedIps: (config.pagomovilAllowedIps || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
    },
    credito: {
      commerceId: config.pagomovilCreditoIdComercio || "",
      hmacSecret: config.pagomovilCreditoHmacSecret || "",
      authToken: config.pagomovilCreditoAuthToken || "",
    },
  };
}

export async function getPagoMovilMode(): Promise<PagoMovilMode> {
  const config = await getPagoMovilConfig();
  return config.mode;
}

export async function getPagoMovilMerchantData(): Promise<PagoMovilMerchantData> {
  const config = await getPagoMovilConfig();
  return config.merchant;
}

export async function getPagoMovilCredentials(): Promise<PagoMovilCredentials> {
  const config = await getPagoMovilConfig();
  return config.credentials;
}

export async function getPagoMovilCreditoCredentials(): Promise<PagoMovilCreditoCredentials> {
  const config = await getPagoMovilConfig();
  return config.credito;
}

export function isPagoMovilManualEnabled(mode: PagoMovilMode): boolean {
  return mode === "MANUAL";
}

export function isPagoMovilR4Enabled(mode: PagoMovilMode): boolean {
  return mode === "R4";
}
