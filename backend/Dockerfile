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

# prisma/ is copied *before* npm ci, not after. package.json has a
# `postinstall: prisma generate` hook, so npm ci runs prisma generate itself —
# and with the schema not yet in the image that exits 1 ("Could not find Prisma
# Schema"), failing the install and the whole build. Copying the schema first
# lets the hook do its job, which also makes the separate generate step that
# used to sit here redundant.
COPY package*.json tsconfig.json ./
COPY prisma ./prisma
RUN npm ci

COPY src ./src
RUN npm run build

# ---- runtime ---------------------------------------------------------------
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl

ENV NODE_ENV=production
WORKDIR /app

# --ignore-scripts is required, not tidiness: the same postinstall hook runs
# here too, but `prisma` is a devDependency and --omit=dev means the CLI is not
# installed, so the hook fails the build. Nothing needs to be generated at this
# stage anyway — the client is copied from the builder below.
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# The generated Prisma client is copied from the builder rather than
# regenerated, so the runtime image never needs the Prisma CLI.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# Don't run the app as root.
RUN addgroup -S spllit && adduser -S spllit -G spllit
USER spllit

# Must match `defaultPort` on the SpllitBackend class in edge/worker.ts (8080),
# which is also where PORT is injected into the container's environment.
EXPOSE 8080
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:8080/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
