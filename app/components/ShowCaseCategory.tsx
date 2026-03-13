import { categoryItems } from "../lib/categoryItems";

function ShowCaseCategory({ categoryName }: { categoryName: string }) {
  const category = categoryItems.find((item) => item.name === categoryName);
  const categoryTitle = (category?.title.es || categoryName || "Categoría").trim();
  const categoryDescription =
    category?.description.es || "Categoría del alojamiento";

  return (
    <div className="flex items-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
        {categoryTitle.slice(0, 2).toUpperCase()}
      </div>

      <div className="ml-4 flex flex-col">
        <h3 className="font-medium">{categoryTitle}</h3>
        <p className="text-sm text-muted-foreground">{categoryDescription}</p>
      </div>
    </div>
  );
}

export default ShowCaseCategory;
