"use client";

import Image from "next/image";

interface HomeHostInfoProps {
  firstName: string | null | undefined;
  userPicture: string | null | undefined;
  createdAt: Date | null | undefined;
}

export function HomeHostInfo({
  firstName,
  userPicture,
  createdAt,
}: HomeHostInfoProps) {
  return (
    <div className="flex items-center">
      <Image
        src={
          userPicture ||
          "https://static.vecteezy.com/system/resources/previews/009/292/244/large_2x/default-avatar-icon-of-social-media-user-vector.jpg"
        }
        alt={firstName as string}
        width={11}
        height={11}
        className="w-11 h-11 rounded-full"
      />
      <div className="flex flex-col ml-4">
        <h3 className="font-medium">
          Anfitrión: {firstName}
        </h3>
        <p className="text-sm text-muted-foreground">
          Anfitrión desde {createdAt ? createdAt.getFullYear() : ""}
        </p>
      </div>
    </div>
  );
}
