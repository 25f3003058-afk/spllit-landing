# Image for Cloudflare Containers. Built and pushed by `wrangler deploy`.
#
# Multi-stage: the builder needs devDependencies (typescript, prisma CLI) to
# compile, the runtime image ships only production deps and the compiled output.
# The previous single-stage version installed --only=production and then called
# tsc, which could never have built.

# ---- builder ---------------------------------------------------------------
FROM node:20-alpine AS builder

# Prisma's query engine needs OpenSSL.
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
RUN npm run build

# ---- runtime ---------------------------------------------------------------
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The generated Prisma client is copied from the builder rather than
# regenerated, so the runtime image never needs the Prisma CLI.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Don't run the app as root.
RUN addgroup -S spllit && adduser -S spllit -G spllit
USER spllit

# Must match `defaultPort` in wrangler.jsonc.
EXPOSE 8080
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8080/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
