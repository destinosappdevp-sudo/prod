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
        <input
          type="hidden"
          name="municipalityValue"
          value={municipalityValue}
        />
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="contactNumber">Numero de contacto</Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  required
                  placeholder="Ej: +58 412 123 4567"
                  className="text-sm"
                />
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
