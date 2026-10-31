FROM node:22-alpine AS web
WORKDIR /build/web
COPY web/package*.json ./
RUN npm ci
COPY web/index.html web/tsconfig.json web/vite.config.ts ./
COPY web/src ./src
COPY web/public ./public
RUN npm run build
FROM node:22-alpine AS server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build && npm prune --omit=dev
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app/server
COPY --from=server /app/server/node_modules ./node_modules
COPY --from=server /app/server/dist ./dist
COPY server/schema.sql ./schema.sql
COPY --from=web /build/web/dist /app/web/dist
USER node
EXPOSE 4000
CMD ["sh", "-c", "node dist/seed.js && node dist/index.js"]
