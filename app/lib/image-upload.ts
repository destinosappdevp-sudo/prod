import sharp from "sharp";

type OptimizeImageOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

type PreparedImageUpload = {
  file: File;
  contentType: string;
  extension: string;
  wasOptimized: boolean;
};

const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_QUALITY = 82;

const OPTIMIZABLE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
};

function normalizeMimeType(contentType: string) {
  const normalized = contentType.toLowerCase();
  return normalized === "image/jpg" ? "image/jpeg" : normalized;
}

function getExtensionFromName(fileName: string) {
  const parts = fileName.split(".");
  if (parts.length < 2) {
    return "";
  }

  return parts.pop()?.toLowerCase() || "";
}

function resolveExtension(file: File, contentType: string) {
  const fromName = getExtensionFromName(file.name);
  if (fromName) {
    return fromName;
  }

  return MIME_TO_EXTENSION[contentType] || "bin";
}

function toPreparedOriginal(file: File): PreparedImageUpload {
  const contentType = normalizeMimeType(file.type || "application/octet-stream");

  return {
    file,
    contentType,
    extension: resolveExtension(file, contentType),
    wasOptimized: false,
  };
}

export async function optimizeImageForUpload(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<PreparedImageUpload> {
  const original = toPreparedOriginal(file);

  if (!original.contentType.startsWith("image/") || !OPTIMIZABLE_MIME_TYPES.has(original.contentType)) {
    return original;
  }

  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT;
  const quality = options.quality ?? DEFAULT_QUALITY;

  try {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const baseImage = sharp(inputBuffer, { failOn: "none" }).rotate();
    const metadata = await baseImage.metadata();

    const shouldResize =
      (metadata.width || 0) > maxWidth || (metadata.height || 0) > maxHeight;

    const transformer = shouldResize
      ? baseImage.resize({
          width: maxWidth,
          height: maxHeight,
          fit: "inside",
          withoutEnlargement: true,
        })
      : baseImage;

    let optimizedBuffer: Buffer;
    let optimizedContentType = original.contentType;

    switch (original.contentType) {
      case "image/jpeg":
        optimizedBuffer = await transformer
          .jpeg({ quality, mozjpeg: true, progressive: true })
          .toBuffer();
        break;
      case "image/png":
        optimizedBuffer = await transformer
          .png({ compressionLevel: 9, adaptiveFiltering: true })
          .toBuffer();
        break;
      case "image/webp":
        optimizedBuffer = await transformer.webp({ quality }).toBuffer();
        break;
      case "image/avif":
        optimizedBuffer = await transformer.avif({ quality }).toBuffer();
        break;
      default:
        return original;
    }

    if (!shouldResize && optimizedBuffer.length >= file.size) {
      return original;
    }

    const optimizedFileName = `${file.name.replace(/\.[^.]+$/, "") || "image"}.${MIME_TO_EXTENSION[optimizedContentType] || original.extension}`;
    const optimizedFile = new File([optimizedBuffer], optimizedFileName, {
      type: optimizedContentType,
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      contentType: optimizedContentType,
      extension: MIME_TO_EXTENSION[optimizedContentType] || original.extension,
      wasOptimized: true,
    };
  } catch (error) {
    console.warn("No se pudo optimizar imagen, se usará el archivo original", error);
    return original;
  }
}



