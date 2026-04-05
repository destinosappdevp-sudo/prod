"use client";
import { createLocation, getUserProfile } from "@/app/action";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";

function AddressRoute({ params }: { params: { id: string } }) {
  const { getAllStates } = useVenezuelaStates();
  const { getMunicipalitiesByState, getDefaultMunicipalityByState } =
    useVenezuelaMunicipalities();
  const [stateValue, setStateValue] = useState("CC");
  const [municipalityValue, setMunicipalityValue] = useState(
    getDefaultMunicipalityByState("CC")?.value || ""
  );
  const [departureDate, setDepartureDate] = useState<Date | undefined>(undefined);

  // Cargar datos del usuario (estado, municipio)
  useEffect(() => {
    (async () => {
      try {
        const userProfile = await getUserProfile();
        if (userProfile) {
          if (userProfile.stateCode) {
            setStateValue(userProfile.stateCode);
            if (userProfile.municipalityCode) {
              setMunicipalityValue(userProfile.municipalityCode);
            } else {
              setMunicipalityValue(
                getDefaultMunicipalityByState(userProfile.stateCode)?.value || ""
              );
            }
          }
        }
      } catch (error) {
        console.error("Error cargando perfil del usuario:", error);
      }
    })();
  }, [getDefaultMunicipalityByState]);

  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tighter transition-colors mb-10">
          Destino
        </h2>
      </div>

      <form action={createLocation}>
        <input type="hidden" name="homeId" value={params.id} />
        <input type="hidden" name="stateValue" value={stateValue} />
        <input type="hidden" name="municipalityValue" value={municipalityValue} />
        <input type="hidden" name="latitude" value="" />
        <input type="hidden" name="longitude" value="" />
        <input
          type="hidden"
          name="contactNumber"
          value={departureDate ? format(departureDate, "yyyy-MM-dd") : ""}
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
              <Label htmlFor="exactAddress">Punto de Partida</Label>
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
                <Label htmlFor="checkInTime">Hora de Partida</Label>
                <Input
                  id="checkInTime"
                  name="checkInTime"
                  type="time"
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <Label>Fecha de Salida</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {departureDate
                        ? format(departureDate, "d 'de' MMMM, yyyy", { locale: es })
                        : <span className="text-muted-foreground">Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={departureDate}
                      onSelect={setDepartureDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        <CreateButtonBar />
      </form>
    </>
  );
}

export default AddressRoute;

