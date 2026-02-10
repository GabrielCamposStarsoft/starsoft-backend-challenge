# syntax=docker/dockerfile:1.7

########################################################
# Development stage (with pnpm + secret npmrc)
########################################################
# syntax=docker/dockerfile:1.7

# syntax=docker/dockerfile:1.7
FROM node:22.12.0-alpine AS development
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "run", "dev"]


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
FROM node:22.12.0-alpine AS runner
WORKDIR /app

# Apenas o build final e deps de produção
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

CMD ["node", "dist/index.js"]
