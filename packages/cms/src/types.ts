/**
 * Die Datenformen, die diese Seite konsumiert.
 *
 * Dieses Paket ist die Übersetzungsschicht zu Paula: es hält die **Sprache der
 * Seite** stabil, auch wenn das Backend anders benennt. Reine Umbenennungen
 * (Paula `zip` → hier `postcode`, `openingHours` → `opening_hours`) werden hier
 * abgebildet, damit das Markup unverändert bleibt. Wo sich die Daten wirklich
 * unterscheiden — Bilder — steht die neue Form, weil ein Nachbauen der alten
 * gelogen wäre (Paula speichert den Fokuspunkt normalisiert, Directus in Pixeln).
 */

/** Lokalisierter Text: Sprachcode → Text (in Paula die JSON-Felder). */
export type ReducedTranslations = Record<string, string>;

/** Ein Bild aus Paula: fertige Datei-URL + normalisierter Fokuspunkt (0..1). */
export type CmsImage = {
  url: string;
  focalX: number;
  focalY: number;
};

export interface Product {
  id: string;
  name: ReducedTranslations;
  description: ReducedTranslations;
  note: ReducedTranslations;
  image: CmsImage | null;
  /** Bereits auf die Icon-Namen dieser Seite gemappt (siehe `allergenIcon`). */
  allergies: string[];
  category: string;
  sort: number;
  /** Als String, damit `formatPrice` unverändert bleibt (Directus lieferte
   *  ebenfalls einen String); leer, wenn kein Preis gepflegt ist. */
  price_gross: string;
}

export interface ProductCategory {
  id: string;
  name: ReducedTranslations;
  description: ReducedTranslations;
  image: CmsImage | null;
  sort: number;
  products: Product[];
}

export type OpeningHour = {
  days_label: ReducedTranslations;
  hours_text: ReducedTranslations;
  additional_info: ReducedTranslations;
};

export type Contact = {
  type: string;
  url: string;
  label: ReducedTranslations;
  title: ReducedTranslations;
  subtitle: ReducedTranslations;
  action: ReducedTranslations;
};

export type Tenant = {
  id: string;
  name: string;
  street: string;
  postcode: string;
  city: string;
  /** Karten-Link (Paula: `mapHref`) — wird als Einbettung genutzt. */
  maps: string;
  social: Record<string, string>;
  opening_hours: OpeningHour[];
  contacts: Contact[];
  contactEmail: string;
  contactPhone: string;
};
