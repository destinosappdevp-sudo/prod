"use client";

import { createCategoryPage } from "@/app/action";
import CategorySelector from "@/app/components/CategorySelector";
import CreateButtonBar from "@/app/components/CreateButtonBar";

function RouteIStruktures({ params }: { params: { id: string } }) {
  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight transition-colors">
          ¿Cuál de estas describe mejor tu hogar?
        </h2>
      </div>
      <form action={createCategoryPage}>
        <input type="hidden" name="homeId" value={params.id} />
        <CategorySelector />

        <CreateButtonBar />
      </form>
    </>
  );
}

export default RouteIStruktures;
