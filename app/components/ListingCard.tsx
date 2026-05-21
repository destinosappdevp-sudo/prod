"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Calendar } from "lucide-react";
import { buildHomeUrl } from "@/app/lib/slug";
import { AddToFavorite, RemoveFromFavorite } from "../action";
import { useVenezuelaStates } from "../lib/venezuelaStates";
import { useVenezuelaMunicipalities } from "../lib/venezuelaMunicipalities";
import { AddToFavoriteButton, DeleteFromFavorite } from "./SubmitButtons";
import { SupabaseImage } from "./SupabaseImage";
import { Button } from "@/components/ui/button";
import { normalizeCategoryNames } from "@/app/lib/property-categories";
import { AuthDialog } from "./AuthDialog";

interface iAppProps {
  imagePath: string;
  description: string;
  stateValue: string;
  municipalityValue?: string | null;
  price: number;
  title: string;
  userId: string | undefined;
  isInFavoriteList: boolean;
  favoriteId?: string;
  homeId: string;
  pathName: string;
  categoryName?: string | null;
  categoryNames?: string[] | null;
  guests?: string | null;
  bedrooms?: string | null;
  reviews?: { rating: number }[];
  reviewCount?: number;
  contactNumber?: string | null;
  checkInTime?: string | null;
  bcvRate?: number | null;
  slug?: string | null;
}

function ListingCard({
  imagePath,
  description,
  stateValue,
  municipalityValue,
  price,
  title,
  userId,
  favoriteId,
  isInFavoriteList,
  homeId,
  pathName,
  categoryName,
  categoryNames,
  guests,
  bedrooms,
  reviews,
  reviewCount,
  contactNumber,
  checkInTime,
  bcvRate,
  slug,
}: iAppProps) {
  const router = useRouter();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogMode, setAuthDialogMode] = useState<"login" | "register">("login");
  const { getStateByValue } = useVenezuelaStates();
  const { getMunicipalityByValue } = useVenezuelaMunicipalities();
  const state = getStateByValue(stateValue);
  const municipality = municipalityValue
    ? getMunicipalityByValue(stateValue, municipalityValue)
    : null;
  const ratingCount = reviewCount ?? reviews?.length ?? 0;
  const avgRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;
  const normalizedCategories = normalizeCategoryNames(categoryNames, categoryName);
  const primaryCategory = normalizedCategories[0] || null;
  const primaryCategoryLabel = primaryCategory
    ? primaryCategory === "apartment"
      ? "Apartamento"
      : primaryCategory === "house"
      ? "Casa"
      : primaryCategory === "villa"
      ? "Villa"
      : primaryCategory.replace(/_/g, " ")
    : null;
  const categoryLabel = primaryCategoryLabel
    ? normalizedCategories.length > 1
      ? `${primaryCategoryLabel} +${normalizedCategories.length - 1}`
      : primaryCategoryLabel
    : null;
  const homeDetailPath = buildHomeUrl(slug, homeId, categoryNames ?? categoryName);

  // Fecha de salida - viene de checkInTime (formato YYYY-MM-DDTHH:MM)
  const departureDate = (() => {
    const raw = checkInTime;
    if (!raw) return null;
    // datetime-local: "2026-04-09T10:00" o solo fecha "2026-04-09"
    const d = new Date(raw.includes("T") ? raw : raw + "T12:00:00");
    return isNaN(d.getTime()) ? null : d;
  })();

  const formattedDeparture = departureDate
    ? departureDate
        .toLocaleDateString("es-VE", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\.$/, "")
    : null;

  const bsPrice =
    bcvRate && bcvRate > 0
      ? (price * bcvRate).toLocaleString("es-VE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const handleCardClick = () => {
    if (userId) {
      router.push(homeDetailPath);
      return;
    }
    setAuthDialogMode("login");
    setAuthDialogOpen(true);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick();
          }
        }}
        className="group rounded-2xl border bg-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
          <SupabaseImage
            imagePath={imagePath}
            alt="Image of House"
            fill
            className="h-full w-full object-cover object-top transition duration-300 group-hover:scale-[1.02]"
          />

          {categoryLabel && (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black shadow">
              {categoryLabel}
            </span>
          )}

          {avgRating && ratingCount > 0 && (
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-black shadow">
              <span className="text-orange-500">★</span>
              {avgRating} ({ratingCount})
            </span>
          )}

          <div
            className="z-10 absolute right-3 top-3"
            onClick={(event) => event.stopPropagation()}
          >
            {userId ? (
              isInFavoriteList ? (
                <form action={RemoveFromFavorite}>
                  <input type="hidden" name="favoriteId" value={favoriteId} />
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="pathName" value={pathName} />
                  <DeleteFromFavorite />
                </form>
              ) : (
                <form action={AddToFavorite}>
                  <input type="hidden" name="homeId" value={homeId} />
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="pathName" value={pathName} />
                  <AddToFavoriteButton />
                </form>
              )
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="bg-primary-foreground"
                onClick={() => { setAuthDialogMode("login"); setAuthDialogOpen(true); }}
              >
                <Heart className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <h3 className="text-base font-semibold line-clamp-1">{title}</h3>
          {formattedDeparture && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{formattedDeparture}</span>
            </div>
          )}

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Desde</p>
            <p className="text-2xl font-bold text-gray-900">${price}</p>
            {bsPrice && (
              <p className="text-xs text-gray-400">Bs. {bsPrice}</p>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
            className="mt-3 w-full rounded-full bg-[#E1B042] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#E8C86F]"
          >
            Reservar Cupo
          </button>
        </div>
      </div>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        nextPath={homeDetailPath}
        initialMode={authDialogMode}
        initialRole="GUEST"
      />
    </>
  );
}

export default ListingCard;



