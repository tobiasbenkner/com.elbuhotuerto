import { getCollection, type CollectionEntry } from "astro:content";

/**
 * Die Lese-Seite der Inhalte: was die Komponenten von Paula sehen.
 *
 * Geholt wird nichts mehr hier — das erledigen die Loader in
 * `src/content.config.ts` beim Build. Diese Datei stellt nur die Abfragen und
 * die Darstellungs-Helfer bereit, die daraus folgen.
 */

export type Tenant = CollectionEntry<"tenant">["data"];
export type Product = CollectionEntry<"products">["data"];
export type Category = CollectionEntry<"categories">["data"];

/** Eine Kategorie samt ihrer Produkte — die Form, in der die Karte sie rendert. */
export type ProductCategory = Category & { products: Product[] };

export type CmsImage = NonNullable<Product["image"]>;
export type OpeningHour = Tenant["opening_hours"][number];
export type Contact = Tenant["contacts"][number];

/** Stammdaten des Restaurants. Die Collection hält per Definition genau einen
 *  Eintrag (siehe `content.config.ts`). */
export async function getTenant(): Promise<Tenant> {
  const [entry] = await getCollection("tenant");
  if (!entry) throw new Error("Keine Restaurant-Stammdaten im Content-Store");
  return entry.data;
}

/**
 * Speisekarte: Kategorien mit ihren Produkten, jeweils nach `sort` geordnet.
 *
 * Die Zuordnung passiert hier und nicht schon in Paula: PocketBase expandiert
 * nur von der Kind- zur Elternseite (`product.category`), nicht umgekehrt.
 * Produkte ohne existierende Kategorie fallen dabei still heraus.
 */
export async function getCategoriesWithProducts(): Promise<ProductCategory[]> {
  const [categories, products] = await Promise.all([
    getCollection("categories"),
    getCollection("products"),
  ]);

  const byCategory = new Map<string, Product[]>();
  for (const { data: product } of products) {
    const list = byCategory.get(product.category);
    if (list) list.push(product);
    else byCategory.set(product.category, [product]);
  }

  return categories
    .map(({ data: category }) => ({
      ...category,
      products: (byCategory.get(category.id) ?? []).sort((a, b) => a.sort - b.sort),
    }))
    .sort((a, b) => a.sort - b.sort);
}

/**
 * Bild-URL mit Breitenbegrenzung. PocketBase erzeugt Vorschaubilder über den
 * `thumb`-Parameter; `<Breite>x0` heißt „Breite vorgeben, Höhe proportional".
 * Die Originale liegen bereits als WebP ≤1000 px in Paula.
 */
export function imageUrl(image: CmsImage | string | null | undefined, width = 800): string {
  const base = typeof image === "string" ? image : (image?.url ?? "");
  if (!base) return "";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}thumb=${Math.round(width)}x0`;
}

/** CSS-`object-position` aus dem normalisierten Fokuspunkt (0..1). */
export function focalPosition(image: CmsImage | null | undefined): string {
  if (!image) return "center";
  const x = (image.focalX ?? 0.5) * 100;
  const y = (image.focalY ?? 0.5) * 100;
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}
