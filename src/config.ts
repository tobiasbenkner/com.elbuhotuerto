/**
 * Woher die Inhalte kommen und für wen. Beide Werte sind zur Build-Zeit
 * überschreibbar; Astro/Vite ersetzt `import.meta.env` dabei.
 */
const ENV = (typeof import.meta !== "undefined" ? import.meta.env : undefined) as
  | Record<string, string | undefined>
  | undefined;

/**
 * Basis-URL der Paula-Instanz (PocketBase). Alles, was diese Seite liest, ist
 * öffentlich lesbar — es braucht keinerlei Zugangsdaten im Build.
 *
 * Überschreibbar per `PUBLIC_PAULA_URL` (z. B. `http://127.0.0.1:8081` für die
 * lokale Entwicklung).
 */
export const PAULA_URL = (ENV?.PUBLIC_PAULA_URL ?? "https://pulpo.cloud").replace(/\/+$/, "");

/**
 * Das Restaurant, dessen Inhalte diese Seite zeigt — die Record-ID aus Paulas
 * `restaurants`-Collection.
 *
 * Bewusst die ID und NICHT der Host: Paula löst den Tenant sonst über
 * `restaurants.domain == host` auf, aber beim statischen Build gibt es keinen
 * Host. Überschreibbar per `PUBLIC_RESTAURANT_ID`.
 */
export const TENANT_ID = ENV?.PUBLIC_RESTAURANT_ID ?? "u5h14zh46xghjuo";

/**
 * Kategorie **„Carnes a la brasa"** (`es-ar`: Parrilla) in Paulas
 * `categories`-Collection.
 *
 * An ihr Ende hängt die Karte zwei Dinge, die es nur dort gibt: den Hinweis auf
 * die Beilagen und die Garstufen-Tafel (`assets/punto.webp`). Das ist Inhalt
 * dieser Seite, kein CMS-Feld — deshalb steht die Zuordnung hier und nicht in
 * Paula.
 *
 * ACHTUNG: eine Record-ID, kein sprechender Schlüssel. Beim Wechsel des
 * Backends oder des Restaurants zeigt sie ins Leere; damit das nicht wieder
 * still passiert, warnt `FoodMenu.astro` beim Build, wenn keine Kategorie
 * darauf passt. (Beim Umzug von Directus auf Paula stand hier noch die alte
 * UUID — der Block verschwand kommentarlos von der Karte.)
 */
export const GRILL_CATEGORY_ID = ENV?.PUBLIC_GRILL_CATEGORY_ID ?? "qew0zh9itkrpnao";
