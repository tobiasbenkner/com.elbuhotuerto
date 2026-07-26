/**
 * Das Restaurant, dessen Inhalte diese Seite zeigt — die Record-ID aus Paulas
 * `restaurants`-Collection.
 *
 * Bewusst die ID und NICHT der Host: Paula löst den Tenant sonst über
 * `restaurants.domain == host` auf, aber beim statischen Build gibt es keinen
 * Host. Überschreibbar per `PUBLIC_RESTAURANT_ID`.
 */
const ENV = (typeof import.meta !== "undefined" ? import.meta.env : undefined) as
  | Record<string, string | undefined>
  | undefined;

export const TENANT_ID = ENV?.PUBLIC_RESTAURANT_ID ?? "u5h14zh46xghjuo";
