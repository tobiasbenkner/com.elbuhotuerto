# El Búho Tuerto

Öffentliche Website des Restaurants — **Astro**, statisch gebaut, ausgeliefert über Cloudflare Pages.
Inhalte kommen aus **Paula** (PocketBase) unter `pulpo.cloud`.

## Entwickeln

```sh
pnpm install
pnpm dev                                        # gegen die Produktiv-Instanz
PUBLIC_PAULA_URL=http://127.0.0.1:8081 pnpm dev # gegen eine lokale Paula
pnpm build                                      # → dist/
```

### Umgebungsvariablen

| Variable                | Default               | Zweck                                      |
|-------------------------|-----------------------|--------------------------------------------|
| `PUBLIC_PAULA_URL`      | `https://pulpo.cloud` | Basis-URL der Paula-Instanz                |
| `PUBLIC_RESTAURANT_ID`  | `u5h14zh46xghjuo`     | Record-ID des Restaurants in `restaurants` |

**Das Restaurant wird über die ID adressiert, nicht über den Host.** Paula löst den
Tenant sonst per `restaurants.domain == host` auf — beim statischen Build gibt es
aber keinen Host.

Zugangsdaten braucht der Build **keine**: alle gelesenen Collections
(`restaurants`, `site_settings`, `categories`, `products`) sind öffentlich lesbar.
Reservierungen, Abrechnung und Webhooks sind es nicht und daher hier unerreichbar.

## Aufbau

```
src/content.config.ts   die Inhalts-Collections: Loader (Paula → Seite) + Schema
src/lib/cms.ts          die Abfragen darauf (getTenant, getCategoriesWithProducts)
src/                    die restliche Astro-Seite (die Wurzel ist zugleich der Workspace)
packages/i18n/          Sprach-Auflösung (t, Resolver, Locales)
```

Die Inhalte sind **Astro-Collections** (`tenant`, `categories`, `products`). Ihre
Loader holen die Records beim Build aus Paula und legen sie in Astros
Content-Store; die Komponenten lesen danach nur noch über `src/lib/cms.ts`.
Ein Paula-Client als eigenes Paket ist dafür nicht mehr nötig.

Der Content-Store unter `.astro/` ist reiner Cache und nicht eingecheckt. Die Loader
leeren ihn bei jedem Sync und holen komplett neu — ein Inhalts-Rebuild sieht also
immer den aktuellen Stand, nie einen halb alten.

Die Loader sind zugleich die **Übersetzungsschicht**: sie halten die Sprache der Seite
stabil (`postcode`, `opening_hours`, `maps`, `price_gross`), auch wo Paula anders
benennt (`zip`, `openingHours`, `mapHref`, `price`). Reine Umbenennungen werden dort
abgebildet, damit das Markup unangetastet bleibt. Das Schema daneben beschreibt nur
die fertige Form — schlägt es fehl, hat sich Paulas Datenmodell bewegt, und der Build
sagt es beim Sync, statt die Seite still halb leer zu rendern.

Wo sich die Daten **wirklich** unterscheiden, steht die neue Form:

- **Bilder** — Paula liefert eine Datei-URL plus einen **normalisierten** Fokuspunkt
  (`focalX`/`focalY`, 0..1); Directus lieferte Pixel-Koordinaten plus Bildmaße. Daher
  `image: { url, focalX, focalY }` und der Helfer `focalPosition()` statt Rechnerei in
  der Komponente.
- **Allergene** — Paulas Schlüssel weichen von den Icon-Dateinamen dieser Seite ab
  (`eggs`→`egg`, `milk`→`dairy`, `sulphites`→`sulfites`). Die Zuordnung sitzt in
  `allergenIcon()`; ohne sie zeigte die Karte stumm kaputte Bilder.

Bildgrößen macht PocketBase per `?thumb=<Breite>x0`. Die freigegebenen Hosts in
`astro.config.mjs` (`image.domains`) sorgen dafür, dass Astro die Bilder **beim Build
herunterlädt und mit ausliefert** — die fertige Seite hängt zur Laufzeit also nicht an
Paulas Erreichbarkeit. Ein nicht freigegebener Host würde ohne Fehlermeldung
unoptimiert durchgereicht und bliebe eine Laufzeit-Abhängigkeit.

## Deployment

**Cloudflare Pages**, statisches Upload von `dist/`. Kein Adapter, kein Server:
Astro baut reines HTML, Cloudflare liefert es aus (Routing, Kompression und
Cache-Header kommen von Pages selbst — das frühere `nginx.conf` entfällt).

`.github/workflows/deploy.yml` baut mit pnpm und veröffentlicht über
`wrangler pages deploy dist`. Drei Auslöser: Push auf `main`, manuell, und
`repository_dispatch` vom Paula-Webhook.

Benötigte Repository-Secrets:

| Secret                  | Zweck                                              |
|-------------------------|----------------------------------------------------|
| `CLOUDFLARE_API_TOKEN`  | Token mit der Berechtigung **Cloudflare Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Account-ID aus dem Cloudflare-Dashboard            |

Das Pages-Projekt heißt **`elbuhotuerto`** (`--project-name` im Workflow); der
erste Lauf legt es an, falls es noch nicht existiert.

`wrangler` steht als devDependency in der `package.json` — nicht weil die
GitHub-Action es bräuchte (sie installiert sich sonst selbst das neueste v4),
sondern damit die Deploy-Version über den Lockfile festliegt und lokal
dieselbe ist:

```sh
pnpm build && pnpm preview                                  # Ergebnis ansehen
pnpm exec wrangler pages deploy dist --project-name=elbuhotuerto  # von Hand deployen
```

> **Nur der pnpm-Store wird gecacht, nicht das Build-Ergebnis — mit Absicht.**
> Die Seite holt ihre Inhalte *während* des Builds aus Paula. Würde man den
> Build cachen, veröffentlichte ein reiner Inhalts-Rebuild (gleicher Commit!)
> den alten Stand — der Webhook liefe ins Leere.

## Automatischer Rebuild bei Inhaltsänderungen

In Paula unter **Einstellungen → Webhooks** einen Webhook anlegen:

| Feld       | Wert                                                                    |
|------------|-------------------------------------------------------------------------|
| Name       | `Website-Build`                                                          |
| Ziel-URL   | `https://api.github.com/repos/tobiasbenkner/<REPO>/dispatches`           |
| Auslöser   | Produkte, Kategorien (bei Bedarf zusätzlich Bilder, Seiten, Einstellungen) |
| Bündeln    | leer = 60 s                                                              |
| Zusatz-Header | `{"Authorization": "Bearer <TOKEN>", "Accept": "application/vnd.github+json"}` |
| Eigener Body  | `{"event_type": "rebuild"}`                                          |

`<TOKEN>` ist ein GitHub-Token mit Schreibrecht auf **Contents** dieses
Repositories (fein granular) bzw. dem `repo`-Scope (klassisch). Der `event_type`
muss `rebuild` heißen — darauf hört `repository_dispatch` im Workflow.

Zwei Dinge, die beim ersten Einrichten irritieren:

- GitHub antwortet mit **204 No Content**. Das ist Erfolg; im Zustellungs-Protokoll
  steht dann „HTTP 204" ohne Antworttext.
- Die **Bündelung** sorgt dafür, dass 20 Preisänderungen hintereinander **einen**
  Build auslösen, nicht zwanzig. Das Fenster startet mit der ersten Änderung und
  wird von späteren nicht verlängert.

## Herkunft

Herausgelöst aus dem Monorepo `pulpo.cloud.websites` (`websites/com.elbuhotuerto`) ohne
Historie. Die zuvor dort geteilten Pakete `@pulpo/cms` und `@pulpo/i18n` sind
mitgekommen; `@pulpo/i18n` ist geblieben, `@pulpo/cms` ist in den Collections
aufgegangen.
