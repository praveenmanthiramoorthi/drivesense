# Multi-stage Dockerfile for DriveSense AI

FROM node:20-alpine AS base
WORKDIR /app

# Server setup
FROM base AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Client setup
FROM base AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Final production stage
FROM base AS runner
WORKDIR /app

# Copy server assets
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package.json ./server/package.json

# Copy client build to static folder or server
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
