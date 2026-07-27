import { defineCollection, z } from "astro:content";
import { PAULA_URL, TENANT_ID } from "./config";

/**
 * Die Inhalte dieser Seite als Astro-Collections.
 *
 * Jede Collection lädt beim Build ihre Records aus Paula (PocketBase) und legt
 * sie in Astros Content-Store ab; die Seite selbst liest danach nur noch über
 * `astro:content` (siehe `src/lib/cms.ts`).
 *
 * Die Loader sind zugleich die **Übersetzungsschicht** zu Paula: sie halten die
 * Sprache dieser Seite stabil (`postcode`, `opening_hours`, `maps`,
 * `price_gross`), auch wo Paula anders benennt (`zip`, `openingHours`,
 * `mapHref`, `price`). Das Schema darunter beschreibt ausschließlich die
 * fertige Form — schlägt es fehl, hat sich Paulas Datenmodell bewegt, und der
 * Build sagt es beim Sync statt die Seite still halb leer zu rendern.
 *
 * Alle gelesenen Collections sind öffentlich lesbar — der Build braucht keine
 * Zugangsdaten. Nicht öffentlich und hier folglich unerreichbar:
 * Reservierungen, Abrechnung, Webhooks.
 */

// ---------------------------------------------------------------------------
// Lesezugriff auf Paulas REST-API
// ---------------------------------------------------------------------------

/**
 * Bewusst `fetch` statt des PocketBase-SDK: die Seite liest zur Build-Zeit
 * anonym vier Listen — dafür lohnt keine zusätzliche Abhängigkeit, und es gibt
 * weder Auth- noch Realtime- noch Schreibpfade, zu denen das SDK etwas
 * beitragen könnte.
 */
type PbRecord = Record<string, unknown>;

/** PocketBase-Record-IDs bestehen aus `[a-z0-9]`. Alles andere ist keine gültige
 *  ID — und hätte in einem Filter-Ausdruck nichts zu suchen. */
function assertRecordId(id: string): string {
  if (!/^[a-z0-9]+$/i.test(id)) throw new Error(`Ungültige Restaurant-ID: ${id}`);
  return id;
}

const RESTAURANT = assertRecordId(TENANT_ID);
const OF_RESTAURANT = `restaurant='${RESTAURANT}'`;

/** Eine Liste holen (PocketBase-Filtersyntax). */
async function pbList(
  collection: string,
  params: { filter?: string; sort?: string; perPage?: number } = {},
): Promise<PbRecord[]> {
  const url = new URL(`${PAULA_URL}/api/collections/${collection}/records`);
  url.searchParams.set("perPage", String(params.perPage ?? 500));
  if (params.filter) url.searchParams.set("filter", params.filter);
  if (params.sort) url.searchParams.set("sort", params.sort);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Paula GET ${collection} → ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { items?: PbRecord[] };
  return json.items ?? [];
}

// ---------------------------------------------------------------------------
// Feld-Helfer
// ---------------------------------------------------------------------------

const str = (value: unknown): string => (typeof value === "string" ? value : "");
const num = (value: unknown): number => (typeof value === "number" ? value : 0);

/** Nicht-leere String-Werte einer lokalisierten Map (PB validiert `json` nicht). */
function asL10n(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [lang, text] of Object.entries(value as Record<string, unknown>)) {
      if (typeof text === "string" && text.trim()) out[lang] = text;
    }
  }
  return out;
}

/** Zeilen eines wiederholbaren JSON-Felds (PB validiert `json` nicht). */
function asRows(value: unknown): PbRecord[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => (entry ?? {}) as PbRecord);
}

/** Datei-URL eines PB-Records bauen. Leeres Dateifeld → kein Bild. */
function imageOf(record: PbRecord, collection: string) {
  const file = str(record.image);
  if (!file) return null;
  return {
    url: `${PAULA_URL}/api/files/${collection}/${str(record.id)}/${file}`,
    // Paula speichert den Fokuspunkt normalisiert; fehlt er, ist die Mitte richtig.
    // Achtung: 0 ist ein GÜLTIGER Wert (linker/oberer Rand) — deshalb wird auf
    // `undefined`/`null` geprüft und nicht auf Falsy.
    focalX: record.focalX == null ? 0.5 : num(record.focalX),
    focalY: record.focalY == null ? 0.5 : num(record.focalY),
  };
}

/**
 * Paulas Allergen-Schlüssel → Dateinamen der Icons dieser Seite
 * (`public/icons/allergies/*.svg`). Nur die abweichenden stehen hier; alles
 * andere heißt in beiden Welten gleich.
 *
 * Ohne diese Zuordnung liefen `eggs`, `milk` und `sulphites` ins Leere und die
 * Karte zeigte kaputte Bilder — der Rest der Seite hätte trotzdem gebaut.
 */
const ALLERGEN_ICON: Record<string, string> = {
  eggs: "egg",
  milk: "dairy",
  sulphites: "sulfites",
};

function allergenIcon(key: string): string {
  return ALLERGEN_ICON[key] ?? key;
}

// ---------------------------------------------------------------------------
// Schema-Bausteine
// ---------------------------------------------------------------------------

/** Lokalisierter Text: Sprachcode → Text (in Paula die JSON-Felder). */
const l10n = z.record(z.string(), z.string());

/** Ein Bild aus Paula: fertige Datei-URL + normalisierter Fokuspunkt (0..1).
 *  Bewusst kein `image()`-Helfer: der gilt nur für Dateien im Repo. Astro lädt
 *  die entfernten Bilder trotzdem beim Build herunter — dafür sorgen die
 *  freigegebenen `image.domains` in `astro.config.mjs`. */
const cmsImage = z
  .object({
    url: z.string(),
    focalX: z.number(),
    focalY: z.number(),
  })
  .nullable();

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

/**
 * Stammdaten des Restaurants — genau ein Eintrag. Der Name kommt aus
 * `restaurants`, alles Übrige aus der 1:1-Präsentations-Config `site_settings`.
 */
const tenant = defineCollection({
  loader: async () => {
    const [settings, restaurants] = await Promise.all([
      pbList("site_settings", { filter: OF_RESTAURANT, perPage: 1 }),
      pbList("restaurants", { filter: `id='${RESTAURANT}'`, perPage: 1 }),
    ]);

    const config = settings[0];
    if (!config) {
      throw new Error(`Keine site_settings für Restaurant ${RESTAURANT} gefunden`);
    }

    const social = config.social;
    return [
      {
        id: RESTAURANT,
        name: str(restaurants[0]?.name),
        street: str(config.street),
        postcode: str(config.zip),
        city: str(config.city),
        maps: str(config.mapHref),
        social:
          social && typeof social === "object" && !Array.isArray(social)
            ? Object.fromEntries(
                Object.entries(social as Record<string, unknown>).filter(
                  ([, url]) => typeof url === "string" && url,
                ),
              )
            : {},
        opening_hours: asRows(config.openingHours).map((row) => ({
          days_label: asL10n(row.daysLabel),
          hours_text: asL10n(row.hoursText),
          additional_info: asL10n(row.additionalInfo),
        })),
        contacts: asRows(config.contacts).map((row) => ({
          type: str(row.type),
          url: str(row.url),
          label: asL10n(row.label),
          title: asL10n(row.title),
          subtitle: asL10n(row.subtitle),
          action: asL10n(row.action),
        })),
        contactEmail: str(config.contactEmail),
        contactPhone: str(config.contactPhone),
      },
    ];
  },
  schema: z.object({
    id: z.string(),
    name: z.string(),
    street: z.string(),
    postcode: z.string(),
    city: z.string(),
    /** Karten-Link (Paula: `mapHref`) — wird als Einbettung genutzt. */
    maps: z.string(),
    social: z.record(z.string(), z.string()),
    opening_hours: z.array(
      z.object({
        days_label: l10n,
        hours_text: l10n,
        additional_info: l10n,
      }),
    ),
    contacts: z.array(
      z.object({
        type: z.string(),
        url: z.string(),
        label: l10n,
        title: l10n,
        subtitle: l10n,
        action: l10n,
      }),
    ),
    contactEmail: z.string(),
    contactPhone: z.string(),
  }),
});

/** Die Kategorien der Speisekarte, in Paulas Reihenfolge (`position`). */
const categories = defineCollection({
  loader: async () => {
    const records = await pbList("categories", { filter: OF_RESTAURANT, sort: "position" });
    return records.map((record) => ({
      id: str(record.id),
      name: asL10n(record.name),
      description: asL10n(record.description),
      image: imageOf(record, "categories"),
      sort: num(record.position),
    }));
  },
  schema: z.object({
    id: z.string(),
    name: l10n,
    description: l10n,
    image: cmsImage,
    sort: z.number(),
  }),
});

/**
 * Die Produkte der Speisekarte.
 *
 * `category` ist bewusst eine schlichte ID und keine `reference("categories")`:
 * ein Produkt, dessen Kategorie es nicht (mehr) gibt, soll auf der Seite
 * schlicht nicht auftauchen — nicht den Build der Restaurantseite kippen.
 * Zusammengeführt wird in `getCategoriesWithProducts()`.
 */
const products = defineCollection({
  loader: async () => {
    const records = await pbList("products", { filter: OF_RESTAURANT, sort: "position" });
    return records
      // `available=false` blendet ein Produkt auf der Seite aus (Paula-Feld).
      .filter((record) => record.available !== false)
      .map((record) => ({
        id: str(record.id),
        name: asL10n(record.name),
        description: asL10n(record.description),
        note: asL10n(record.note),
        image: imageOf(record, "products"),
        allergies: Array.isArray(record.allergens)
          ? record.allergens.filter((a): a is string => typeof a === "string").map(allergenIcon)
          : [],
        category: str(record.category),
        sort: num(record.position),
        // Als String, damit `formatPrice` unverändert bleibt (Directus lieferte
        // ebenfalls einen String); leer, wenn kein Preis gepflegt ist.
        price_gross: typeof record.price === "number" ? String(record.price) : "",
      }));
  },
  schema: z.object({
    id: z.string(),
    name: l10n,
    description: l10n,
    note: l10n,
    image: cmsImage,
    /** Bereits auf die Icon-Namen dieser Seite gemappt (siehe `allergenIcon`). */
    allergies: z.array(z.string()),
    category: z.string(),
    sort: z.number(),
    price_gross: z.string(),
  }),
});

export const collections = { tenant, categories, products };
