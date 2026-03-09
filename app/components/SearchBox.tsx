"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVenezuelaStates } from "../lib/venezuelaStates";
import Counter from "./Counter";
import HomeMap from "./HomeMap";
import SelectCalendar from "./SelectCalendar";

function SearchBox() {
  const router = useRouter();
  const { getAllStates, getStateByValue } = useVenezuelaStates();
  const [locationValue, setLocationValue] = useState("");
  const [availableStates, setAvailableStates] = useState<{ value: string; label: string }[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    fetch("/api/states-with-homes")
      .then((r) => r.json())
      .then((stateValues: string[]) => {
        const all = getAllStates();
        const withHomes = all.filter((s) => stateValues.includes(s.value));
        // Sort: Caracas first (CC), then alphabetically
        const caracas = withHomes.find((s) => s.value === "CC");
        const rest = withHomes
          .filter((s) => s.value !== "CC")
          .sort((a, b) => a.label.localeCompare(b.label, "es"));
        setAvailableStates(caracas ? [caracas, ...rest] : rest);
      })
      .catch(() => setAvailableStates(getAllStates()));
  }, [getAllStates]);

  function handleNearMe() {
    if (!navigator.geolocation) return;
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoadingLocation(false);
        // Use CC (Caracas) as nearest fallback — real reverse geocoding would need an API key
        // For now, set location to nearest known state via lat/lng distance
        const { latitude, longitude } = pos.coords;
        const all = getAllStates();
        let nearest = all[0];
        let minDist = Infinity;
        for (const s of all) {
          const [slat, slng] = s.latLng as [number, number];
          const d = Math.hypot(slat - latitude, slng - longitude);
          if (d < minDist) { minDist = d; nearest = s; }
        }
        setLocationValue(nearest.value);
      },
      () => setLoadingLocation(false)
    );
  }
  const [guests, setGuests] = useState(0);
  const [rooms, setRooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(0);
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setStep(1);
    }
  }

  function handleSearch() {
    const params = new URLSearchParams();
    
    if (locationValue) {
      params.set("country", locationValue);
    }
    if (guests > 0) {
      params.set("guest", guests.toString());
    }
    if (rooms > 0) {
      params.set("rooms", rooms.toString());
    }
    if (bathrooms > 0) {
      params.set("bathrooms", bathrooms.toString());
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
    setIsOpen(false);
  }

  function SubmitStep() {
    if (step === 1) {
      return (
        <Button onClick={() => setStep(step + 1)} type="button">
          Siguiente
        </Button>
      );
    } else if (step === 2) {
      return (
        <Button onClick={() => setStep(step + 1)} type="button">
          Siguiente
        </Button>
      );
    } else if (step === 3) {
      return (
        <Button onClick={handleSearch} type="button">
          Buscar
        </Button>
      );
    }
  }

  const locationLabel = locationValue
    ? getStateByValue(locationValue)?.label
    : undefined;
  const mobileSearchLabel = locationLabel
    ? `Buscar en ${locationLabel}`
    : "Buscar destino, ciudad...";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <div className="w-full">
        <button
          type="button"
          className="lg:hidden w-full flex items-center gap-3 rounded-full border border-gray-200 bg-white py-3 px-4 shadow-sm hover:shadow-md transition-shadow"
          onClick={() => {
            setStep(1);
            setIsOpen(true);
          }}
          aria-label="Abrir busqueda"
        >
          <Search className="h-4 w-4 text-gray-500" />
          <span className="truncate text-sm text-gray-500">{mobileSearchLabel}</span>
        </button>

        <div className="hidden lg:flex rounded-full py-2 px-2 border border-gray-200 shadow-sm hover:shadow-md transition-shadow items-center bg-white cursor-pointer w-full">
          <div
            className="flex h-full min-w-0 divide-x divide-gray-300 flex-1"
            ref={triggerRef}
          >
          <div 
            className="px-5 py-2 hover:bg-gray-50 rounded-full transition cursor-pointer flex flex-col justify-center min-w-[120px]" 
            onClick={() => { setStep(1); setIsOpen(true); }}
          >
            <p className="text-xs font-semibold text-gray-800">Dónde</p>
            <p className="text-sm text-gray-500 truncate">
              {locationLabel ?? "Explora destinos"}
            </p>
          </div>
          <div 
            className="px-5 py-2 hover:bg-gray-50 rounded-full transition cursor-pointer flex flex-col justify-center min-w-[120px]" 
            onClick={() => { setStep(2); setIsOpen(true); }}
          >
            <p className="text-xs font-semibold text-gray-800">Fechas</p>
            <p className="text-sm text-gray-500">Agrega fechas</p>
          </div>
          <div 
            className="px-5 py-2 hover:bg-gray-50 rounded-full transition cursor-pointer flex flex-col justify-center min-w-[115px]" 
            onClick={() => { setStep(3); setIsOpen(true); }}
          >
            <p className="text-xs font-semibold text-gray-800">Quién</p>
            <p className="text-sm text-gray-500">
              {guests > 0 ? `${guests} huésped${guests > 1 ? 'es' : ''}` : "¿Cuántos?"}
            </p>
          </div>
        </div>
        <button 
          className="bg-primary hover:bg-primary/90 flex justify-center items-center rounded-full h-11 w-11 ml-2 transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <Search className="text-white h-4 w-4" />
        </button>
      </div>
      </div>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[425px]">
        <form className="gap-4 flex flex-col">
          <input type="hidden" name="country" value={locationValue} />
          {step === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>Selecciona un estado</DialogTitle>
                <DialogDescription>
                  Por favor selecciona un estado de Venezuela que desees visitar
                </DialogDescription>
              </DialogHeader>

              <Select
                required
                value={locationValue}
                onValueChange={(value) => setLocationValue(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un estado"></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__near__" onPointerDown={(e) => { e.preventDefault(); handleNearMe(); }}>
                      <span className="flex items-center gap-2">
                        <MapPin size={14} className="text-orange-500" />
                        {loadingLocation ? "Detectando ubicación..." : "Cerca de mí"}
                      </span>
                    </SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Estados con alojamientos</SelectLabel>
                    {availableStates.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <HomeMap stateValue={locationValue} />
            </>
          ) : step === 2 ? (
            <>
              <DialogHeader>
                <DialogTitle>Selecciona las fechas</DialogTitle>
                <DialogDescription>
                  Por favor selecciona las fechas de tu estadía
                </DialogDescription>
              </DialogHeader>

              <SelectCalendar reservation={undefined} />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Selecciona toda la información</DialogTitle>
                <DialogDescription>
                  Por favor selecciona los detalles de tu búsqueda
                </DialogDescription>
              </DialogHeader>

              <Card>
                <CardHeader className="flex flex-col gap-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="underline font-medium">Huéspedes</h3>
                      <p className="text-muted-foreground text-sm">
                        ¿Cuántos huéspedes deseas?
                      </p>
                    </div>
                    <Counter 
                      name="guests" 
                      value={guests} 
                      onChange={setGuests} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="underline font-medium">Dormitorios</h3>
                      <p className="text-muted-foreground text-sm">
                        ¿Cuántos dormitorios necesitas?
                      </p>
                    </div>
                    <Counter 
                      name="rooms" 
                      value={rooms} 
                      onChange={setRooms} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="underline font-medium">Baños</h3>
                      <p className="text-muted-foreground text-sm">
                        ¿Cuántos baños necesitas?
                      </p>
                    </div>
                    <Counter 
                      name="bathrooms" 
                      value={bathrooms} 
                      onChange={setBathrooms} 
                    />
                  </div>
                </CardHeader>
              </Card>
            </>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full gap-2">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(step - 1)} 
                  type="button"
                >
                  Anterior
                </Button>
              )}
              <div className="ml-auto">
                <SubmitStep />
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SearchBox;
