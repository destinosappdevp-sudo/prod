export const IMAGE_BUCKET_MARKER = "/storage/v1/object/public/images/";

export function extractStoragePath(value?: string | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  const idx = v.indexOf(IMAGE_BUCKET_MARKER);
  if (idx < 0) return null;
  const path = v.slice(idx + IMAGE_BUCKET_MARKER.length).split("?")[0].replace(/^\/+/, "");
  return path || null;
}

export function resolveImageSrc(value?: string | null): string {
  if (!value) return "/placeholder.webp";
  const v = value.trim();
  if (!v) return "/placeholder.webp";

  const idx = v.indexOf(IMAGE_BUCKET_MARKER);
  if (idx >= 0) {
    const path = v.slice(idx + IMAGE_BUCKET_MARKER.length).split("?")[0].replace(/^\/+/, "");
    return path ? `/api/images/${path}` : "/placeholder.webp";
  }

  if (v.startsWith("/")) return v;

  if (/^https?:\/\//i.test(v)) return v;

  return `/api/images/${v}`;
}
