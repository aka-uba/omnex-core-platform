# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Build argument for memory limit
ARG NODE_OPTIONS=--max-old-space-size=1024
ENV NODE_OPTIONS=${NODE_OPTIONS}

# Install dependencies for node-gyp and Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build Next.js application with limited resources
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install curl for healthcheck and postgresql-client for backup/restore
RUN apk add --no-cache curl libc6-compat openssl postgresql-client

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs &&     adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create storage directories
RUN mkdir -p /app/storage /app/public/uploads &&     chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3     CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
