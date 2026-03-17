import { categoryItems } from "../lib/categoryItems";
import { normalizeCategoryNames } from "@/app/lib/property-categories";

function ShowCaseCategory({
  categoryName,
  categoryNames,
}: {
  categoryName?: string | null;
  categoryNames?: string[] | null;
}) {
  const normalizedCategories = normalizeCategoryNames(categoryNames, categoryName);
  const primaryCategory = normalizedCategories[0] || "";
  const category = categoryItems.find((item) => item.name === primaryCategory);
  const categoryTitle = (category?.title.es || primaryCategory || "Categoría").trim();
  const categoryDescription =
    category?.description.es || "Categoría del alojamiento";
  const extraCategories = normalizedCategories.slice(1);

  return (
    <div className="flex items-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
        {categoryTitle.slice(0, 2).toUpperCase()}
      </div>

      <div className="ml-4 flex flex-col">
        <h3 className="font-medium">
          {categoryTitle}
          {extraCategories.length > 0 ? ` +${extraCategories.length}` : ""}
        </h3>
        <p className="text-sm text-muted-foreground">{categoryDescription}</p>
        {extraCategories.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Tambien: {extraCategories.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

export default ShowCaseCategory;
