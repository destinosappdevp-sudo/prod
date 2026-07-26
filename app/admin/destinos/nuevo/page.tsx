import prisma from "@/app/lib/db";
import { getAllStates } from "@/app/lib/venezuelaStates";
import DestinationEditForm from "@/app/admin/components/DestinationEditForm";

export default async function NewDestinationPage() {
  const states = getAllStates().map((s) => ({ value: s.value, label: s.label }));

  const propertyTypes = await prisma.property_types.findMany({
    orderBy: [{ name: "asc" }],
  });
  const categoriesForForm = propertyTypes.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    title: cat.title_es || cat.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nuevo Destino</h1>
        <p className="text-muted-foreground mt-1">
          Crea un destino/categoría padre. Luego podrás agregar paquetes/fechas dentro de él.
        </p>
      </div>

      <DestinationEditForm
        destination={{
          id: "",
          title: null,
          subtitle: null,
          description: null,
          photo: null,
          price: null,
          priceVip: null,
          vipSeats: null,
          standardSeats: null,
          country: null,
          municipality: null,
          exactAddress: null,
          contactNumber: null,
          latitude: null,
          longitude: null,
          checkInTime: null,
          propertyTypeIds: [],
          publishStatus: "APPROVED",
        }}
        categories={categoriesForForm}
        states={states}
        createMode={true}
      />
    </div>
  );
}
