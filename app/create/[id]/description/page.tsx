"use client";

import { createDescription } from "@/app/action";
import Counter from "@/app/components/Counter";
import CreateButtonBar from "@/app/components/CreateButtonBar";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function DescriptionPage({ params }: { params: { id: string } }) {
  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tighter transition-colors">
          Por favor describe tu hogar lo mejor que puedas.
        </h2>
      </div>
      <form action={createDescription}>
        <input type="hidden" name="homeId" value={params.id} />
        <div className="mx-auto w-3/5 mt-10 flex flex-col gap-y-5 mb-36">
          <div className="flex flex-col gap-y-2">
            <Label>Título</Label>
            <Input
              name="title"
              type="text"
              required
              placeholder="Nombre de tu propiedad..."
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Descripción</Label>
            <Textarea
              name="description"
              required
              placeholder="Por favor describe tu hogar..."
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Precio del Paquete</Label>
            <Input
              name="price"
              type="number"
              required
              placeholder="Precio del Paquete"
              min={10}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Imagen</Label>
            <Input name="image" type="file" required />
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-y-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="underline font-medium">Cupos</h3>
                  <p className="text-muted-foreground text-sm">
                    ¿Cuántos cupos disponibles?
                  </p>
                </div>
                <Counter name="guests" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="underline font-medium">Zona VIP</h3>
                  <p className="text-muted-foreground text-sm">
                    ¿Cuántas zonas VIP tiene el paquete?
                  </p>
                </div>
                <Counter name="rooms" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="underline font-medium">Zona Estándar</h3>
                  <p className="text-muted-foreground text-sm">
                    ¿Cuántas zonas estándar tiene el paquete?
                  </p>
                </div>
                <Counter name="bathrooms" />
              </div>
            </CardHeader>
          </Card>
        </div>
        <CreateButtonBar />
      </form>
    </>
  );
}

export default DescriptionPage;
