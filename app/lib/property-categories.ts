function normalizeRawCategoryValue(rawValue: string): string[] {
  const raw = rawValue.trim();
  if (!raw) {
    return [];
  }

  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean);
      }
    } catch {
      // keep legacy parsing below
    }
  }

  if (raw.includes(",")) {
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [raw];
}

export function normalizeCategoryNames(
  categoryName: string[] | string | null | undefined,
  legacyCategoryName?: string | null | undefined
): string[] {
  const sourceValues: string[] = [];

  if (Array.isArray(categoryName)) {
    sourceValues.push(...categoryName);
  } else if (typeof categoryName === "string") {
    sourceValues.push(categoryName);
  }

  if (typeof legacyCategoryName === "string") {
    sourceValues.push(legacyCategoryName);
  }

  return Array.from(
    new Set(
      sourceValues
        .flatMap((value) => normalizeRawCategoryValue(value))
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export function getPrimaryCategoryName(
  categoryName: string[] | string | null | undefined,
  legacyCategoryName?: string | null | undefined
): string | null {
  const normalized = normalizeCategoryNames(categoryName, legacyCategoryName);
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



