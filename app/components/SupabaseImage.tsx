"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveImageSrc } from "@/app/lib/image-url";

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



