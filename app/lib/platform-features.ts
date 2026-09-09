import prisma from "./db";

export type TransportKey = "ENC32" | "VAN20" | "VAN20_PASILLO";

export const TRANSPORT_KEYS: TransportKey[] = ["ENC32", "VAN20", "VAN20_PASILLO"];

export const TRANSPORT_LABELS: Record<TransportKey, string> = {
  ENC32: "Encava 32 (31 pasajeros + copiloto)",
  VAN20: "Van 20 (19 pasajeros + copiloto)",
  VAN20_PASILLO: "Van 20 Pasillo (19 pasajeros + copiloto)",
};

export interface PlatformFeatures {
  allowPrivatePackages: boolean;
  multiDatesPerDestinationEnabled: boolean;
  transports: Record<TransportKey, boolean>;
}

const DEFAULTS: PlatformFeatures = {
  allowPrivatePackages: false,
  multiDatesPerDestinationEnabled: false,
  transports: { ENC32: true, VAN20: false, VAN20_PASILLO: false },
};

export async function getPlatformFeatures(): Promise<PlatformFeatures> {
  try {
    const prismaAny = prisma as any;
    const config = await prismaAny.platformConfig.findFirst();
    if (!config) return DEFAULTS;
    return {
      allowPrivatePackages: config.allowPrivatePackages ?? false,
      multiDatesPerDestinationEnabled: config.multiDatesPerDestinationEnabled ?? false,
      transports: {
        ENC32: config.transportEnc32Enabled ?? true,
        VAN20: config.transportVan20Enabled ?? false,
        VAN20_PASILLO: config.transportVan20PasilloEnabled ?? false,
      },
    };
  } catch {
    return DEFAULTS;
  }
}

/** Transportes habilitados; garantiza al menos ENC32. */
export function enabledTransports(features: PlatformFeatures): TransportKey[] {
  const list = TRANSPORT_KEYS.filter((k) => features.transports[k]);
  return list.length > 0 ? list : ["ENC32"];
}

/** Si el tipo recibido está deshabilitado, cae a ENC32. */
export function sanitizeTransportType(
  value: unknown,
  features: PlatformFeatures,
): TransportKey {
  const allowed = enabledTransports(features);
  return allowed.includes(value as TransportKey)
    ? (value as TransportKey)
    : "ENC32";
}
