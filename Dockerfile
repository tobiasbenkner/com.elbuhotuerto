# Statischer Astro-Build → nginx. Angepasst aus dem Monorepo
# pulpo.cloud.websites: dort war die Seite über den `WEBSITE`-Build-Arg und
# `pnpm --filter` ausgewählt; hier ist sie das einzige Ziel, deshalb ohne Arg.
FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable

# Erst nur die Dateien, die pnpm zum Installieren braucht — solange sich die
# Abhängigkeiten nicht ändern, bleibt dieser Layer im Cache. `packages/` gehört
# dazu, weil die beiden Workspace-Pakete sonst nicht auflösbar sind.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

# Danach der Rest der Seite (node_modules/dist sind über .dockerignore außen vor).
COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
