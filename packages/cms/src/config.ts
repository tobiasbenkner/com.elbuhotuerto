/**
 * Basis-URL der Paula-Instanz (PocketBase). Alles, was diese Seite liest, ist
 * öffentlich lesbar — es braucht keinerlei Zugangsdaten im Build.
 *
 * Überschreibbar per `PUBLIC_PAULA_URL` (z. B. `http://127.0.0.1:8081` für die
 * lokale Entwicklung). Astro/Vite ersetzt `import.meta.env` zur Build-Zeit; der
 * Zugriff ist defensiv, damit das Paket auch außerhalb eines Vite-Builds lädt.
 */
const ENV = (typeof import.meta !== "undefined" ? import.meta.env : undefined) as
  | Record<string, string | undefined>
  | undefined;

export const PAULA_URL = (ENV?.PUBLIC_PAULA_URL ?? "https://pulpo.cloud").replace(/\/+$/, "");
