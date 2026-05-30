FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm install

# Copy source
COPY apps/web/ ./apps/web/

# Build Web
# Disable linting and type checking for faster Docker builds, these should run in CI
ENV NEXT_TELEMETRY_DISABLED 1
RUN cd apps/web && npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT=3000

# Copy necessary files
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static

EXPOSE 3000

# Server starts from the standalone output
CMD ["node", "server.js"]
