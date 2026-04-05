"use client";
import React, { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Home } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { parseMultiCategoryFilter } from "@/app/lib/property-categories";

type PropertyType = {
  id: number;
  name: string;
  icon: string | null;
};

function normalizeCategoryLabel(name: string) {
  if (!name) return "";

  // Corrige textos mal decodificados tipo "CabaÃ±a" -> "Cabaña" solo cuando aplica.
  if (name.includes("Ã") || name.includes("Â")) {
    try {
      const bytes = Uint8Array.from(name, (char) => char.charCodeAt(0));
      return new TextDecoder("utf-8").decode(bytes);
    } catch {
      return name;
    }
  }

  return name;
}

const iconMap = {
  apartment:
    "https://a0.muscache.com/pictures/bcd1adc0-5cee-4d7a-85ec-f6730b0f8d0c.jpg",
  beach:
    "https://a0.muscache.com/pictures/10ce1091-c854-40f3-a2fb-defc2995bcaf.jpg",
  luxury:
    "https://a0.muscache.com/pictures/c8e2ed05-c666-47b6-99fc-4cb6edcde6b4.jpg",
  view:
    "https://a0.muscache.com/pictures/3b1eb541-46d9-4bef-abc4-c37d77e3c21b.jpg",
  bed:
    "https://a0.muscache.com/pictures/50861fca-582c-4bcc-89d3-857fb7ca6528.jpg",
  glamping:
    "https://a0.muscache.com/pictures/d7445031-62c4-46d0-91c3-4f29f9790f7a.jpg",
  "tiny-house":
    "https://a0.muscache.com/pictures/3271df99-f071-4ecf-9128-eb2d2b1f50f0.jpg",
  "full-house":
    "https://a0.muscache.com/pictures/33dd714a-7b4a-4654-aaf0-f58ea887a688.jpg",
  cabin:
    "https://a0.muscache.com/pictures/3fb523a0-b622-4368-8142-b5e03df7549b.jpg",
  "country-house":
    "https://a0.muscache.com/pictures/6ad4bd95-f086-437d-97e3-14d12155ddfe.jpg",
  star:
    "https://a0.muscache.com/pictures/c5a4f6fc-c92c-4ae8-87dd-57f1ff1b89a6.jpg",
  home:
    "https://a0.muscache.com/pictures/33dd714a-7b4a-4654-aaf0-f58ea887a688.jpg",
} as const;

const allCategoryIcon =
  "https://a0.muscache.com/pictures/3726d94b-534a-42b8-bca0-a0304d912260.jpg";

function MapFilter() {
  const searchParams = useSearchParams();
  const search = searchParams.get("filter");
  const pathname = usePathname();
  const selectedTokens = parseMultiCategoryFilter(search);
  const selectedSet = new Set(selectedTokens);

  const buildFilterHref = useCallback(
    (nextTokens: string[]) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextTokens.length === 0) {
        params.set("filter", "todos");
      } else {
        params.set("filter", nextTokens.join(","));
      }

      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams]
  );

  const [categories, setCategories] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      try {
        const response = await fetch("/api/property-types", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las categorías");
        }

        const data: PropertyType[] = await response.json();
        setCategories(data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    void fetchCategories();
  }, []);

  return (
    <div className="flex gap-x-10 mt-5 w-full overflow-x-scroll hide-scrollbar">
      <Link
        href={buildFilterHref([])}
        className={cn(
          selectedTokens.length === 0
            ? "border-b-2 border-black pb-2 flex-shrink-0"
            : "opacity-70 flex-shrink-0",
          "flex flex-col gap-y-3 items-center"
        )}
      >
        <div className="relative w-6 h-6">
          <Image
            src={allCategoryIcon}
            alt="Todos"
            className="w-6 h-6 object-cover rounded-sm"
            width={24}
            height={24}
          />
        </div>
        <p className="text-xs font-medium text-center">Todos</p>
      </Link>

      {loading ? (
        <span>Cargando...</span>
      ) : categories.map((item) => {
        const categoryId = item.id.toString();
        const isActive = selectedSet.has(categoryId) || selectedSet.has(item.name);
        const withoutCurrent = selectedTokens.filter(
          (token) => token !== categoryId && token !== item.name
        );
        const nextTokens = isActive
          ? withoutCurrent
          : Array.from(new Set([...withoutCurrent, categoryId]));

        return (
          <Link
            key={item.id}
            href={buildFilterHref(nextTokens)}
            className={cn(
              isActive
                ? "border-b-2 border-black pb-2 flex-shrink-0"
                : "opacity-70 flex-shrink-0",
              "flex flex-col gap-y-3 items-center"
            )}
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              {(() => {
                if (!item.icon) {
                  return <Home className="w-6 h-6" />;
                }

                if (item.icon.startsWith("http")) {
                  return (
                    <Image
                      src={item.icon}
                      alt={normalizeCategoryLabel(item.name)}
                      className="w-6 h-6 object-cover rounded-sm"
                      width={24}
                      height={24}
                    />
                  );
                }

                const imageUrl = iconMap[item.icon as keyof typeof iconMap];
                if (imageUrl) {
                  return (
                    <Image
                      src={imageUrl}
                      alt={normalizeCategoryLabel(item.name)}
                      className="w-6 h-6 object-cover rounded-sm"
                      width={24}
                      height={24}
                    />
                  );
                }

                // Emoji u otro carácter
                return <span className="text-xl leading-none">{item.icon}</span>;
              })()}
            </div>
            <p className="text-xs font-medium text-center leading-tight max-w-[88px]">
              {normalizeCategoryLabel(item.name)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

export default MapFilter;
