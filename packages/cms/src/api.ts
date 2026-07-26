import { assertRecordId, pbList, type CmsClient, type PbRecord } from "./client";
import { asL10n, allergenIcon } from "./utils";
import type {
  CmsImage,
  Contact,
  OpeningHour,
  Product,
  ProductCategory,
  Tenant,
} from "./types";

// ---------------------------------------------------------------------------
// Lesezugriffe auf Paula. Alle genutzten Collections sind öffentlich lesbar
// (restaurants, site_settings, categories, products) — der Build braucht keine
// Zugangsdaten. Nicht öffentlich und hier folglich unerreichbar: Reservierungen,
// Abrechnung, Webhooks.
// ---------------------------------------------------------------------------

const str = (value: unknown): string => (typeof value === "string" ? value : "");
const num = (value: unknown): number => (typeof value === "number" ? value : 0);

/** Datei-URL eines PB-Records bauen. Leeres Dateifeld → kein Bild. */
function imageOf(record: PbRecord, collection: string, base: string): CmsImage | null {
  const file = str(record.image);
  if (!file) return null;
  return {
    url: `${base}/api/files/${collection}/${str(record.id)}/${file}`,
    // Paula speichert den Fokuspunkt normalisiert; fehlt er, ist die Mitte richtig.
    // Achtung: 0 ist ein GÜLTIGER Wert (linker/oberer Rand) — deshalb wird auf
    // `undefined`/`null` geprüft und nicht auf Falsy.
    focalX: record.focalX == null ? 0.5 : num(record.focalX),
    focalY: record.focalY == null ? 0.5 : num(record.focalY),
  };
}

function toProduct(record: PbRecord, base: string): Product {
  const price = record.price;
  return {
    id: str(record.id),
    name: asL10n(record.name),
    description: asL10n(record.description),
    note: asL10n(record.note),
    image: imageOf(record, "products", base),
    allergies: Array.isArray(record.allergens)
      ? record.allergens.filter((a): a is string => typeof a === "string").map(allergenIcon)
      : [],
    category: str(record.category),
    sort: num(record.position),
    price_gross: typeof price === "number" ? String(price) : "",
  };
}

/**
 * Speisekarte: Kategorien mit ihren Produkten, jeweils nach `position` sortiert.
 *
 * Zwei Abfragen statt einer mit `expand`: PocketBase expandiert nur von der
 * Kind- zur Elternseite (`product.category`), nicht umgekehrt — die Zuordnung
 * passiert deshalb hier.
 */
export async function getCategoriesWithProducts(
  client: CmsClient,
  query: { tenant: string },
): Promise<ProductCategory[]> {
  const restaurant = assertRecordId(query.tenant);
  const filter = `restaurant='${restaurant}'`;

  const [categories, products] = await Promise.all([
    pbList(client, "categories", { filter, sort: "position" }),
    pbList(client, "products", { filter, sort: "position" }),
  ]);

  const byCategory = new Map<string, Product[]>();
  for (const record of products) {
    // `available=false` blendet ein Produkt auf der Seite aus (Paula-Feld).
    if (record.available === false) continue;
    const product = toProduct(record, client.url);
    const list = byCategory.get(product.category);
    if (list) list.push(product);
    else byCategory.set(product.category, [product]);
  }

  return categories.map((record) => {
    const id = str(record.id);
    return {
      id,
      name: asL10n(record.name),
      description: asL10n(record.description),
      image: imageOf(record, "categories", client.url),
      sort: num(record.position),
      products: byCategory.get(id) ?? [],
    };
  });
}

/** Die 1:1-Präsentations-Config des Restaurants (`site_settings`). */
async function loadSettings(client: CmsClient, restaurant: string): Promise<PbRecord> {
  const rows = await pbList(client, "site_settings", {
    filter: `restaurant='${assertRecordId(restaurant)}'`,
    perPage: 1,
  });
  if (rows.length !== 1) {
    throw new Error(`Keine site_settings für Restaurant ${restaurant} gefunden`);
  }
  return rows[0]!;
}

function toOpeningHours(value: unknown): OpeningHour[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const row = (entry ?? {}) as PbRecord;
    return {
      days_label: asL10n(row.daysLabel),
      hours_text: asL10n(row.hoursText),
      additional_info: asL10n(row.additionalInfo),
    };
  });
}

function toContacts(value: unknown): Contact[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const row = (entry ?? {}) as PbRecord;
    return {
      type: str(row.type),
      url: str(row.url),
      label: asL10n(row.label),
      title: asL10n(row.title),
      subtitle: asL10n(row.subtitle),
      action: asL10n(row.action),
    };
  });
}

/** Stammdaten des Restaurants: Name kommt aus `restaurants`, der Rest aus
 *  `site_settings` (SCHEMA.md §0/§0a). */
export async function getTenant(client: CmsClient, tenantId: string): Promise<Tenant> {
  const restaurant = assertRecordId(tenantId);
  const [settings, restaurants] = await Promise.all([
    loadSettings(client, restaurant),
    pbList(client, "restaurants", { filter: `id='${restaurant}'`, perPage: 1 }),
  ]);

  const social = settings.social;
  return {
    id: restaurant,
    name: str(restaurants[0]?.name),
    street: str(settings.street),
    postcode: str(settings.zip),
    city: str(settings.city),
    maps: str(settings.mapHref),
    social:
      social && typeof social === "object" && !Array.isArray(social)
        ? (Object.fromEntries(
            Object.entries(social as Record<string, unknown>).filter(
              ([, url]) => typeof url === "string" && url,
            ),
          ) as Record<string, string>)
        : {},
    opening_hours: toOpeningHours(settings.openingHours),
    contacts: toContacts(settings.contacts),
    contactEmail: str(settings.contactEmail),
    contactPhone: str(settings.contactPhone),
  };
}

/** Nur die Öffnungszeiten (eigener Aufruf, weil manche Seiten sonst nichts brauchen). */
export async function getOpeningHours(
  client: CmsClient,
  tenantId: string,
): Promise<OpeningHour[]> {
  const settings = await loadSettings(client, assertRecordId(tenantId));
  return toOpeningHours(settings.openingHours);
}
