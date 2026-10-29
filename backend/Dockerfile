# ============================================
# 🏗️ Base setup
# ============================================
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ============================================
# 📦 Dependencies
# ============================================
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ============================================
# 🛠️ Builder
# ============================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate
# Build the application
RUN pnpm build

# ============================================
# 🚀 Runner
# ============================================
FROM base AS runner
ENV NODE_ENV=production

# Create a non-root user for security
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 --gid nodejs nodejs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy prisma schema if needed for runtime (though client is in node_modules)
COPY --from=builder /app/prisma ./prisma

USER nodejs

EXPOSE 3000

# Start the application directly, relying on container env vars
CMD ["node", "dist/index.js"]
