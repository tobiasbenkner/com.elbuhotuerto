# El Búho Tuerto

Website des Restaurants — **Astro**, statisch gebaut, ausgeliefert über **GitHub Pages**.
Inhalte kommen beim Build aus **Paula** (PocketBase) unter `pulpo.cloud`.

## Entwickeln

```sh
pnpm install
pnpm dev                                        # gegen die Produktiv-Instanz
PUBLIC_PAULA_URL=http://127.0.0.1:8081 pnpm dev # gegen eine lokale Paula
pnpm build && pnpm preview                      # Build ansehen
```

| Variable               | Default               | Zweck                                      |
|------------------------|-----------------------|--------------------------------------------|
| `PUBLIC_PAULA_URL`     | `https://pulpo.cloud` | Basis-URL der Paula-Instanz                |
| `PUBLIC_RESTAURANT_ID` | `u5h14zh46xghjuo`     | Record-ID des Restaurants in `restaurants` |

## Aufbau

```
src/content.config.ts   Inhalts-Collections: Loader (Paula → Seite) + Schema
src/lib/cms.ts          Abfragen darauf
packages/i18n/          Sprach-Auflösung
```

Bilder von freigegebenen Hosts (`image.domains` in `astro.config.mjs`) werden beim
Build heruntergeladen — die Seite hängt zur Laufzeit nicht an Paula.

## Deployment

`.github/workflows/deploy.yml` baut und veröffentlicht auf GitHub Pages — bei Push auf
`main`, manuell oder per Paula-Webhook.

Einmalig einrichten:

1. **Settings → Pages → Source:** „GitHub Actions“
2. **Settings → Pages → Custom domain:** `elbuhotuerto.com`, danach „Enforce HTTPS“
3. **DNS:** `A`-Records auf `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
   `185.199.111.153`; `www` als `CNAME` auf `tobiasbenkner.github.io`

## Rebuild bei Inhaltsänderungen

In Paula unter **Einstellungen → Webhooks**:

| Feld          | Wert                                                                    |
|---------------|-------------------------------------------------------------------------|
| Ziel-URL      | `https://api.github.com/repos/tobiasbenkner/com.elbuhotuerto/actions/workflows/deploy.yml/dispatches` |
| Auslöser      | Produkte, Kategorien                                                    |
| Zusatz-Header | `{"Authorization": "Bearer <TOKEN>", "Accept": "application/vnd.github+json"}` |
| Eigener Body  | `{"ref": "main"}`                                                       |

`<TOKEN>`: fein granularer GitHub-Token für dieses Repo mit Schreibrecht auf
**Actions**. GitHub antwortet bei Erfolg mit **204**.
