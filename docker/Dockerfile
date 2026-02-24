# syntax=docker/dockerfile:1.7

########################################################
# Development stage (with pnpm + secret npmrc)
########################################################

FROM node:22.12.0-alpine AS development
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENTRYPOINT ["sh", "-c", "pnpm run migration:run && exec pnpm run dev"]

########################################################
# Builder stage for production
########################################################

FROM node:22.12.0-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

########################################################
# Runner stage for production
########################################################

FROM node:24.13.1-alpine3.22 AS runner
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Instala pnpm, instala dependências em produção e depois remove pnpm para otimizar a imagem final
RUN npm install -g pnpm \
  && pnpm install --frozen-lockfile --prod \
  && npm uninstall -g pnpm \
  && rm -rf ~/.pnpm-store

ENTRYPOINT ["sh", "-c", "\
node ./node_modules/typeorm/cli.js migration:run -d ./dist/data-source.js && \
pnpm run seed && \
exec \"$@\""]

CMD ["node", "dist/main.js"]
