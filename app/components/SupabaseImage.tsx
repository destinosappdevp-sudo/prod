"use client";

import Image from "next/image";
import { useState } from "react";

interface SupabaseImageProps {
  imagePath?: string | null;
  alt: string;
  fill?: boolean;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
}

export function SupabaseImage({
  imagePath,
  alt,
  fill = false,
  className = "",
  width,
  height,
  sizes,
}: SupabaseImageProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resolveImageSrc = (path?: string | null) => {
    if (!path) {
      return "/placeholder.webp";
    }

    const trimmedPath = path.trim();
    if (!trimmedPath) {
      return "/placeholder.webp";
    }

    if (
      trimmedPath.startsWith("http://") ||
      trimmedPath.startsWith("https://") ||
      trimmedPath.startsWith("/")
    ) {
      return trimmedPath;
    }

    if (!supabaseUrl) {
      return "/placeholder.webp";
    }

    return `${supabaseUrl}/storage/v1/object/public/images/${trimmedPath}`;
  };

  const initialSrc = resolveImageSrc(imagePath);
  const [imgSrc, setImgSrc] = useState<string>(initialSrc);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={fill ? (sizes || "100vw") : undefined}
      onError={() => setImgSrc('/placeholder.webp')}
    />
  );
}



