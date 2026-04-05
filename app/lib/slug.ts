/**
 * Convierte un texto en un slug URL-friendly
 * Elimina acentos, caracteres especiales, etc.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar diacríticos (á→a, é→e, etc.)
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/**
 * Genera un slug único para un Home combinando el título y los primeros 6 chars del ID
 * Ejemplo: "Los Roques" + "a1b2c3..." → "los-roques-a1b2c3"
 */
export function generateHomeSlug(title: string, id: string): string {
  const base = slugify(title);
  const shortId = id.slice(0, 6);
  return `${base}-${shortId}`;
}

/**
 * Convierte un nombre de categoría en un slug de URL
 * Ejemplo: "Playas" → "playas", "Zona VIP" → "zona-vip"
 */
export function toCategorySlug(
  categoryName: string | string[] | null | undefined
): string {
  const name = Array.isArray(categoryName) ? categoryName[0] : categoryName;
  if (!name) return "paquetes";
  return slugify(name);
}

/**
 * Construye la URL canónica de un paquete/home
 * Si tiene slug: /destinos/{categorySlug}/{slug}
 * Fallback a /home/{id} para retrocompatibilidad
 */
export function buildHomeUrl(
  slug: string | null | undefined,
  id: string,
  categoryName?: string | string[] | null
): string {
  if (slug) {
    const cat = toCategorySlug(categoryName);
    return `/destinos/${cat}/${slug}`;
  }
  return `/home/${id}`;
}
