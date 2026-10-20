# Production image: one Node process serves the API and the built web app (see apps/api/src/app.ts).
# Used by Render (render.yaml) and for running the production build locally.
FROM node:24-alpine AS base
# Bake pnpm into the image so the container does not download it on every start.
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS build
# Prisma 7 reads DATABASE_URL while loading its config, even for `generate`. Build-time placeholder only.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/web apps/web
RUN pnpm build

FROM base
ENV NODE_ENV=production
ENV WEB_DIST_DIR=/app/apps/web/dist
# Full node_modules are kept on purpose: `prisma migrate deploy` (and `pnpm db:seed`) run in this image.
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 4000
# Render injects PORT; migrations run on every start and are a no-op when the schema is current.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/index.js"]
