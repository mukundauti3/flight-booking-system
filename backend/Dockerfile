# ================================================================
# Dockerfile — SkyBooker Backend (Node.js 20 LTS)
# Multi-stage build: builder → production
# ================================================================

# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# ---- Stage 2: Production ----
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create upload directories and set ownership
RUN mkdir -p uploads/tickets uploads/logos uploads/flights uploads/profiles && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
