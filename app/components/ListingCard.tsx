"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { AddToFavorite, RemoveFromFavorite } from "../action";
import { useVenezuelaStates } from "../lib/venezuelaStates";
import { useVenezuelaMunicipalities } from "../lib/venezuelaMunicipalities";
import { AddToFavoriteButton, DeleteFromFavorite } from "./SubmitButtons";
import { SupabaseImage } from "./SupabaseImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  guests?: string | null;
  bedrooms?: string | null;
  reviews?: { rating: number }[];
  reviewCount?: number;
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
  guests,
  bedrooms,
  reviews,
  reviewCount,
}: iAppProps) {
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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
  const categoryLabel = categoryName
    ? categoryName === "apartment"
      ? "Apartamento"
      : categoryName === "house"
      ? "Casa"
      : categoryName === "villa"
      ? "Villa"
      : categoryName.replace(/_/g, " ")
    : null;

  const handleCardClick = () => {
    if (userId) {
      router.push(`/home/${homeId}`);
      return;
    }
    setIsAuthOpen(true);
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
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
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
                onClick={() => setIsAuthOpen(true)}
              >
                <Heart className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 pb-4 pt-3">
          <h3 className="text-base font-semibold line-clamp-1">{title}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span>{municipality ? municipality.label : state?.label}</span>
          </p>
          {(guests || bedrooms) && (
            <p className="mt-1 text-xs text-gray-500">
              {guests ? `${guests} huésped${parseInt(guests, 10) === 1 ? "" : "es"}` : ""}
              {guests && bedrooms ? " · " : ""}
              {bedrooms ? `${bedrooms} hab.` : ""}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="text-lg font-bold text-orange-600">$ {price}</span> / noche por persona
            </p>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              Ver detalles
            </span>
          </div>
        </div>
      </div>

      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inicia sesion para continuar</DialogTitle>
            <DialogDescription>
              Necesitas una cuenta para ver los detalles o reservar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Link href="/login" className="w-full" onClick={() => setIsAuthOpen(false)}>
              <Button className="w-full">Iniciar sesion o registrarse</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ListingCard;
