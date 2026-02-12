# syntax=docker/dockerfile:1.7

########################################################
# Development stage (with pnpm + secret npmrc)
########################################################

# Use the official Node.js 22 Alpine-based image for a lightweight and up-to-date environment
FROM node:22.12.0-alpine AS development

# Set working directory for subsequent commands
WORKDIR /app

# Globally install pnpm package manager to leverage efficient, fast node_modules management
RUN npm install -g pnpm

# Copy only lockfile and manifest for efficient layer caching and faster install on unchanged deps
COPY package.json pnpm-lock.yaml ./

# Install dependencies strictly following lockfile to ensure deterministic builds
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code into the container
COPY . .

# Run database migrations before starting development server.
# This prevents "relation does not exist" errors when starting API with docker-compose,
# ensuring the DB schema is always up-to-date in development.
ENTRYPOINT ["sh", "-c", "pnpm run migration:run && exec pnpm run dev"]

########################################################
# Builder stage for production
########################################################

# Use a dedicated build environment for reproducible production builds
FROM node:22.12.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy only package manifests for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install pnpm and all dependencies (dev+prod) for building the application
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy complete source tree for build
COPY . .

# Build the project for production (typically outputs to /dist)
RUN pnpm run build

########################################################
# Runner stage for production
########################################################

# Prepare a minimal image for running the built application
FROM node:22.12.0-alpine AS runner

# Set application working directory
WORKDIR /app

# Copy only build output and package.json for a lean runtime container
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Install pnpm and only production dependencies for minimal footprint and faster start
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod

# Run DB migrations at container startup to ensure schema is up-to-date,
# then start the API. All DATABASE_* env vars should be supplied by docker-compose.
ENTRYPOINT ["sh", "-c", "node ./node_modules/typeorm/cli.js migration:run -d ./dist/data-source.js && exec \"$@\"", "sh"]

# Default command: launch the main server using the built outputs
CMD ["node", "dist/main.js"]
