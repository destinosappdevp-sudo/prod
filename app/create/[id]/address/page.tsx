"use client";
import { createLocation } from "@/app/action";
import CreateButtonBar from "@/app/components/CreateButtonBar";
import { useVenezuelaStates } from "@/app/lib/venezuelaStates";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { useState } from "react";

function AddressRoute({ params }: { params: { id: string } }) {
  const { getAllStates } = useVenezuelaStates();
  const [locationValue, setLocationValue] = useState("CC");
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
        <input type="hidden" name="countryValue" value={locationValue} />
        <div className="w-3/5 mx-auto mb-36">
          <div className="mb-5">
            <Select value={locationValue} required onValueChange={(value) => setLocationValue(value)}>
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

          <LazyMap locationValue={locationValue} />
        </div>

        <CreateButtonBar />
      </form>
    </>
  );
}

export default AddressRoute;
