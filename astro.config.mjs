// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from "astro-icon";


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
    icon()
  ]
});