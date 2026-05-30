FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install

# Copy source
COPY apps/api/ ./apps/api/

# Build API
RUN cd apps/api && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/data ./apps/api/data

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "apps/api/dist/index.js"]
