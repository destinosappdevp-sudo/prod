"use client";

import Image from "next/image";
import { useState } from "react";

interface SupabaseImageProps {
  imagePath: string;
  alt: string;
  fill?: boolean;
  className?: string;
  width?: number;
  height?: number;
}

export function SupabaseImage({
  imagePath,
  alt,
  fill = false,
  className = "",
  width,
  height,
}: SupabaseImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    `https://gnygijwemqkfceqfmmie.supabase.co/storage/v1/object/public/images/${imagePath}`
  );

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill={fill}
      className={className}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      onError={() => setImgSrc('/placeholder.webp')}
    />
  );
}
