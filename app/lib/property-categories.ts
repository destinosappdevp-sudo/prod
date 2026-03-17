export function normalizeCategoryNames(
  categoryNames: string[] | null | undefined,
  categoryName: string | null | undefined
): string[] {
  const fromArray = Array.isArray(categoryNames)
    ? categoryNames.map((value) => value.trim()).filter(Boolean)
    : [];

  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray));
  }

  if (!categoryName) {
    return [];
  }

  const raw = categoryName.trim();
  if (!raw) {
    return [];
  }

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Array.from(
          new Set(
            parsed
              .map((value) => (typeof value === "string" ? value.trim() : ""))
              .filter(Boolean)
          )
        );
      }
    } catch {
      // keep legacy parsing below
    }
  }

  if (raw.includes(",")) {
    return Array.from(
      new Set(
        raw
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );
  }

  return [raw];
}

export function getPrimaryCategoryName(
  categoryNames: string[] | null | undefined,
  categoryName: string | null | undefined
): string | null {
  const normalized = normalizeCategoryNames(categoryNames, categoryName);
  return normalized[0] ?? null;
}

export function parseMultiCategoryFilter(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(",")
        .map((token) => token.trim())
        .filter((token) => token.length > 0 && token !== "todos")
    )
  );
}
