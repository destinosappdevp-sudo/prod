"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { categoryItems } from "../lib/categoryItems";

function MapFilter() {
  const searchParams = useSearchParams();
  const search = searchParams.get("filter");
  const pathname = usePathname();
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const allCategoryIcon =
    categoryItems.find((item) => item.name === "vuelos")?.imageUrl ??
    categoryItems[0]?.imageUrl ??
    "";

  const visibleCategories = categoryItems.filter(
    (item) => item.name !== "vuelos"
  );

  return (
    <div className="flex gap-x-10 mt-5 w-full overflow-x-scroll hide-scrollbar">
      <Link
        href={pathname + "?" + createQueryString("filter", "todos")}
        passHref
        className={cn(
          !search || search === "todos"
            ? "border-b-2 border-black pb-2 flex-shrink-0"
            : "opacity-70 flex-shrink-0",
          "flex flex-col gap-y-3 items-center"
        )}
      >
        <div className="relative w-6 h-6">
          {allCategoryIcon ? (
            <Image
              src={allCategoryIcon}
              alt="Todos"
              className="w-6 h-6"
              width={24}
              height={24}
            />
          ) : null}
        </div>
        <p className="text-xs font-medium">Todos</p>
      </Link>

      {visibleCategories.map((item) => (
        <Link
          key={item.id}
          href={pathname + "?" + createQueryString("filter", item.name)}
          passHref
          className={cn(
            search === item.name
              ? "border-b-2 border-black pb-2 flex-shrink-0"
              : "opacity-70 flex-shrink-0",
            "flex flex-col gap-y-3 items-center"
          )}
        >
          <div className="relative w-6 h-6">
            <Image
              src={item.imageUrl}
              alt={item.title.es}
              className="w-6 h-6"
              width={24}
              height={24}
            />
          </div>
          <p className="text-xs font-medium">{item.title.es}</p>
        </Link>
      ))}
    </div>
  );
}

export default MapFilter;
