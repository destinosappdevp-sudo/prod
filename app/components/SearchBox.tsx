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
import { Search } from "lucide-react";
import { useState, useRef } from "react";
import { useVenezuelaStates } from "../lib/venezuelaStates";
import Counter from "./Counter";
import HomeMap from "./HomeMap";
import SelectCalendar from "./SelectCalendar";
import { SubmitButtons } from "./SubmitButtons";

function SearchBox() {
  const { getAllStates } = useVenezuelaStates();
  const [locationValue, setLocationValue] = useState("");
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

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
      return <SubmitButtons />;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-full py-2 px-5 border flex items-center cursor-pointer">
        <div className="flex h-full divide-x font-medium" ref={triggerRef}>
          <p 
            className="px-4 text-sm hover:bg-gray-100 rounded transition" 
            onClick={() => { setStep(1); setIsOpen(true); }}
          >
            Cualquier lugar
          </p>
          <p 
            className="px-4 text-sm hover:bg-gray-100 rounded transition" 
            onClick={() => { setStep(2); setIsOpen(true); }}
          >
            Cualquier semana
          </p>
          <p 
            className="px-4 text-sm hover:bg-gray-100 rounded transition" 
            onClick={() => { setStep(3); setIsOpen(true); }}
          >
            Agregar huéspedes
          </p>
        </div>
        <div className="bg-primary flex justify-center items-center rounded-full h-10 w-10">
          <Search className="text-white" />
        </div>
      </div>
      <DialogContent className="sm:max-w-[425px]">
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
                onValueChange={(value) => setLocationValue(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un estado"></SelectValue>
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
              <HomeMap locationValue={locationValue} />
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
                    <Counter name="guests" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="underline font-medium">Dormitorios</h3>
                      <p className="text-muted-foreground text-sm">
                        ¿Cuántos dormitorios tienes?
                      </p>
                    </div>
                    <Counter name="rooms" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h3 className="underline font-medium">Baños</h3>
                      <p className="text-muted-foreground text-sm">
                        ¿Cuántos baños tienes?
                      </p>
                    </div>
                    <Counter name="bathrooms" />
                  </div>
                </CardHeader>
              </Card>
            </>
          )}

          <DialogFooter>
            <SubmitStep />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SearchBox;
