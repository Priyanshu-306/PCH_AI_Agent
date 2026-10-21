# Production image for both websites + admin (one Next.js server).
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
RUN useradd --system --uid 1001 app
COPY --from=build --chown=app /app ./
RUN mkdir -p /app/storage/uploads && chown -R app /app/storage
USER app
EXPOSE 3000
# Apply pending migrations, then start.
CMD ["sh", "-c", "npx drizzle-kit migrate && npx next start -p 3000"]
