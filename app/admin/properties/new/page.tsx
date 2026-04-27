import { notFound } from "next/navigation";
import prisma from "@/app/lib/db";
import { Card } from "@/components/ui/card";
import PropertyEditForm from "@/app/admin/components/PropertyEditForm";
import { getAllStates } from "@/app/lib/venezuelaStates";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";

const prismaAny = prisma as any;

export default async function NewPropertyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (!userRecord || (userRecord.role !== "ADMIN" && userRecord.role !== "SUPERADMIN")) {
    redirect("/admin");
  }

  const propertyTypes = await prisma.property_types.findMany({
    orderBy: [{ name: "asc" }],
  });
  const categoriesForForm = propertyTypes.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    title: cat.title_es || cat.name,
  }));

  const amenityCategories = await prismaAny.amenityCategory.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      Amenity: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          HomeAmenity: { where: { homeId: "___none___" } },
        },
      },
    },
  });

  const amenityCategoriesForForm = amenityCategories.map((category: any) => ({
    id: category.id,
    name: category.name,
    amenities: category.Amenity.map((amenity: any) => ({
      id: amenity.id,
      name: amenity.name,
      iconKey: amenity.iconKey,
      iconUrl: amenity.iconUrl,
      status: "UNSPECIFIED",
    })),
  }));

  const states = getAllStates();
  const statesForForm = states.map((s) => ({ value: s.value, label: s.label }));

  const emptyProperty = {
    id: "",
    title: null,
    description: null,
    guests: null,
    bedrooms: null,
    bathrooms: null,
    country: null,
    municipality: null,
    exactAddress: null,
    checkInTime: null,
    contactNumber: null,
    latitude: null,
    longitude: null,
    photo: null,
    price: null,
    priceVip: null,
    vipSeats: null,
    standardSeats: null,
    propertyTypeId: null,
    propertyTypeIds: [],
    addedCategory: false,
    addedDescription: false,
    addedLocation: false,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/properties"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Paquete</h1>
          <p className="text-gray-600 mt-1">
            Completa los datos para crear un nuevo paquete
          </p>
        </div>
      </div>

      {/* Form */}
      <PropertyEditForm
        property={emptyProperty}
        categories={categoriesForForm}
        states={statesForForm}
        amenityCategories={amenityCategoriesForForm}
        updateEndpoint="/api/admin/properties"
        createMode={true}
      />
    </div>
  );
}
