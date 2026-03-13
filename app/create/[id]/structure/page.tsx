"use client";

import { createCategoryPage } from "@/app/action";
import CategorySelector from "@/app/components/CategorySelector";
import CreateButtonBar from "@/app/components/CreateButtonBar";
import { useSearchParams } from "next/navigation";

function RouteIStruktures({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const hasCategoryError = searchParams.get("error") === "category-required";

  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight transition-colors">
          ¿Cuál de estas describe mejor tu hogar?
        </h2>
        {hasCategoryError && (
          <p className="mt-3 text-sm text-red-600">
            Debes seleccionar una categoría para continuar.
          </p>
        )}
      </div>
      <form action={createCategoryPage}>
        <input type="hidden" name="homeId" value={params.id} />
        <CategorySelector hasError={hasCategoryError} />

        <CreateButtonBar />
      </form>
    </>
  );
}

export default RouteIStruktures;
