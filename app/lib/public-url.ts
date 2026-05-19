const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function withProtocol(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `https://${url}`;
}

function normalizeBaseUrl(url: string) {
  const parsed = new URL(withProtocol(url.trim()));
  return parsed.toString();
}

export function getPublicBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl);
  }

  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (!LOCALHOST_HOSTS.has(hostname)) {
      return origin;
    }
  }

  throw new Error("NEXT_PUBLIC_SITE_URL no esta configurada para generar enlaces publicos.");
}

export function buildPublicUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalizedPath, getPublicBaseUrl()).toString();
}



