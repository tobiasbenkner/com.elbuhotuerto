import { PAULA_URL } from "./config";

/**
 * Minimaler Lese-Client für Paulas PocketBase-REST-API.
 *
 * Bewusst `fetch` statt des PocketBase-SDK: die Seite liest zur Build-Zeit
 * anonym drei Listen — dafür lohnt keine zusätzliche Abhängigkeit, und es gibt
 * weder Auth- noch Realtime- noch Schreibpfade, zu denen das SDK etwas
 * beitragen könnte.
 */
export type CmsClient = { url: string };

let _client: CmsClient | undefined;

export function createClient(url: string = PAULA_URL): CmsClient {
  if (_client && _client.url === url) return _client;
  return (_client = { url });
}

export type PbRecord = Record<string, unknown>;

/** PocketBase-Record-IDs bestehen aus `[a-z0-9]`. Alles andere ist keine gültige
 *  ID — und hätte in einem Filter-Ausdruck nichts zu suchen. */
export function assertRecordId(id: string): string {
  if (!/^[a-z0-9]+$/i.test(id)) throw new Error(`Ungültige Restaurant-ID: ${id}`);
  return id;
}

/** Eine Liste holen (PocketBase-Filtersyntax). */
export async function pbList(
  client: CmsClient,
  collection: string,
  params: { filter?: string; sort?: string; perPage?: number } = {},
): Promise<PbRecord[]> {
  const url = new URL(`${client.url}/api/collections/${collection}/records`);
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
