import type { Resend } from "resend";

function normalizeFromEmail(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  const withoutDoubleQuotes =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1)
      : trimmed;
  const withoutSingleQuotes =
    withoutDoubleQuotes.startsWith("'") && withoutDoubleQuotes.endsWith("'")
      ? withoutDoubleQuotes.slice(1, -1)
      : withoutDoubleQuotes;
  const normalized = withoutSingleQuotes.trim();

  return normalized.length > 0 ? normalized : undefined;
}

export const FROM_EMAIL =
  normalizeFromEmail(process.env.RESEND_FROM_EMAIL) || "onboarding@resend.dev";

let resendClient: Resend | null = null;

// Build-safe lazy initialization: avoid throwing at import time when env vars are missing.
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    // Use a dynamic require to avoid static ESM imports that some
    // bundlers (or deployment environments) may fail to resolve.
    // The `import type` above keeps type checking without forcing
    // the runtime to statically import the package.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Resend: ResendCtor } = require("resend");
    resendClient = new ResendCtor(apiKey);
  }

  return resendClient;
}



