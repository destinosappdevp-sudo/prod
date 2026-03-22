"use client";
import { createLocation } from "@/app/action";
import CreateButtonBar from "@/app/components/CreateButtonBar";
import { useVenezuelaStates } from "@/app/lib/venezuelaStates";
import { useVenezuelaMunicipalities } from "@/app/lib/venezuelaMunicipalities";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useState } from "react";

function AddressRoute({ params }: { params: { id: string } }) {
  const { getAllStates } = useVenezuelaStates();
  const { getMunicipalitiesByState, getDefaultMunicipalityByState } =
    useVenezuelaMunicipalities();
  const [stateValue, setStateValue] = useState("CC");
  const [municipalityValue, setMunicipalityValue] = useState(
    getDefaultMunicipalityByState("CC")?.value || ""
  );
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [coordsInput, setCoordsInput] = useState("");
  const [coordsParsed, setCoordsParsed] = useState(false);
  const [contactNumber, setContactNumber] = useState("");

  const normalizeContactNumber = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 10);
  };

  const parseCoords = (value: string) => {
    setCoordsInput(value);
    // Acepta formato: "7.80878, -72.23072" o "7.80878 -72.23072"
    const match = value.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (match) {
      setLatitude(match[1]);
      setLongitude(match[2]);
      setCoordsParsed(true);
    } else {
      setLatitude("");
      setLongitude("");
      setCoordsParsed(false);
    }
  };
  const LazyMap = dynamic(() => import("@/app/components/Map"), {
    ssr: false,
    loading: () => <Skeleton className="h-[50vh] w-full" />,
  });

  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tighter transition-colors mb-10">
          ¿Dónde está ubicado tu hogar?
        </h2>
      </div>

      <form action={createLocation}>
        <input type="hidden" name="homeId" value={params.id} />
        <input type="hidden" name="stateValue" value={stateValue} />
        <input type="hidden" name="municipalityValue" value={municipalityValue} />
        <input type="hidden" name="latitude" value={latitude} />
        <input type="hidden" name="longitude" value={longitude} />
        <div className="w-3/5 mx-auto mb-36">
          <div className="mb-5">
            <Select
              value={stateValue}
              required
              onValueChange={(value) => {
                setStateValue(value);
                setMunicipalityValue(
                  getDefaultMunicipalityByState(value)?.value || ""
                );
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue></SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Estados de Venezuela</SelectLabel>
                  {getAllStates().map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-5">
            <Select
              value={municipalityValue}
              required
              onValueChange={(value) => setMunicipalityValue(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un municipio"></SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Municipios</SelectLabel>
                  {getMunicipalitiesByState(stateValue).map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="exactAddress">Direccion exacta</Label>
              <Input
                id="exactAddress"
                name="exactAddress"
                type="text"
                required
                placeholder="Ej: Av. Principal, calle 10, casa 2"
                className="text-sm"
              />
            </div>            <div>
              <Label className="text-sm font-medium">Coordenadas GPS <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <p className="text-xs text-muted-foreground mb-2">
                En <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">openstreetmap.org</a>: clic derecho sobre el lugar → copia las coordenadas → pégalas aquí
              </p>
              <Input
                type="text"
                value={coordsInput}
                onChange={(e) => parseCoords(e.target.value)}
                placeholder="Pega aquí: 7.80878, -72.23072"
                className={`text-sm ${
                  coordsInput && !coordsParsed ? "border-red-400 focus-visible:ring-red-400" : ""
                }`}
              />
              {coordsParsed && (
                <p className="text-xs text-green-600 mt-1">✓ Lat: {latitude} · Lng: {longitude}</p>
              )}
              {coordsInput && !coordsParsed && (
                <p className="text-xs text-red-500 mt-1">Formato no reconocido. Ejemplo: 7.80878, -72.23072</p>
              )}
            </div>            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkInTime">Hora de ingreso</Label>
                <Input
                  id="checkInTime"
                  name="checkInTime"
                  type="time"
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="contactNumber">Número de contacto</Label>
                <input
                  type="hidden"
                  name="contactNumber"
                  value={contactNumber ? `+58${contactNumber}` : ""}
                />
                <div className="flex items-center border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                  <span className="px-3 py-2 bg-muted text-sm font-medium border-r select-none">
                    +58
                  </span>
                  <Input
                    id="contactNumber"
                    type="tel"
                    required
                    value={contactNumber}
                    onChange={(e) =>
                      setContactNumber(normalizeContactNumber(e.target.value))
                    }
                    maxLength={10}
                    pattern="^\\d+$"
                    title="Usa solo números"
                    placeholder="Ej: 4121234567"
                    className="text-sm border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <LazyMap
            stateValue={stateValue}
            municipalityValue={municipalityValue}
          />
        </div>

        <CreateButtonBar />
      </form>
    </>
  );
}

export default AddressRoute;
