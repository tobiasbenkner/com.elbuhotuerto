import type { RouteDefinition } from "../../lib/types";

/**
 * Die 404-Seite ist als Route registriert, damit Canonical, hreflang und der
 * Sprachumschalter auf ihr die richtigen Pfade bilden (`/404`, `/de/404`, …).
 *
 * Erzeugt wird sie aber NICHT vom Catch-all (`src/pages/[...slug]`), sondern von
 * den eigenen Dateien `src/pages/404.astro` und `src/pages/[lang]/404.astro` —
 * nur die schreiben `404.html` statt `404/index.html`, und genau nach dieser
 * Datei sucht Cloudflare Pages, wenn ein Pfad ins Leere läuft.
 */
export const route: RouteDefinition = {
  key: "notfound",
  slugs: { es: "404", "es-ar": "404", en: "404", de: "404" },
};
