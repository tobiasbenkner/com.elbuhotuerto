// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from "astro-icon";
import { readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Sprachspezifische 404-Seiten dorthin legen, wo Cloudflare Pages sie sucht.
 *
 * Pages sucht bei einer unbekannten URL die nächstgelegene `404.html` — vom
 * angefragten Pfad aus nach oben. Astro schreibt aber nur die oberste
 * 404-Seite als `404.html`; die aus `src/pages/[lang]/404.astro` landen wegen
 * des Verzeichnis-Formats als `de/404/index.html` und würden nie als
 * Fehlerseite ausgeliefert. Dieser Schritt macht daraus `de/404.html` — der
 * Pfad `/de/404` bleibt derselbe (und damit die Canonical-URL der Seite).
 */
function localized404Pages() {
  return {
    name: 'localized-404-pages',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        for (const entry of await readdir(root, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const from = join(root, entry.name, '404', 'index.html');
          try {
            await rename(from, join(root, entry.name, '404.html'));
          } catch (error) {
            if (error.code === 'ENOENT') continue; // kein 404 in dieser Sprache
            throw error;
          }
          await rm(join(root, entry.name, '404'), { recursive: true });
          logger.info(`${entry.name}/404.html`);
        }
      },
    },
  };
}

export default defineConfig({
  site: "https://elbuhotuerto.com",
  image: {
    // Bild-Quelle ist jetzt Paula (PocketBase-Dateien) statt Directus.
    // Freigegebene Hosts werden von Astro beim Build heruntergeladen und
    // optimiert mit ausgeliefert — die fertige Seite hängt zur Laufzeit also
    // NICHT an der Erreichbarkeit von Paula. Ein nicht freigegebener Host würde
    // ohne Fehler einfach unoptimiert durchgereicht (und bliebe eine
    // Laufzeit-Abhängigkeit) — deshalb steht hier auch der Dev-Host.
    domains: ['pulpo.cloud', '127.0.0.1', 'localhost'],
  },
  vite: {
    plugins: [tailwindcss()]
  },
  integrations: [
    icon(),
    localized404Pages()
  ]
});