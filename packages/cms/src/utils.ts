import type { CmsImage, ReducedTranslations } from "./types";

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

export function allergenIcon(key: string): string {
  return ALLERGEN_ICON[key] ?? key;
}

/** Nicht-leere String-Werte einer lokalisierten Map (PB validiert `json` nicht). */
export function asL10n(value: unknown): ReducedTranslations {
  const out: ReducedTranslations = {};
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [lang, text] of Object.entries(value as Record<string, unknown>)) {
      if (typeof text === "string" && text.trim()) out[lang] = text;
    }
  }
  return out;
}
