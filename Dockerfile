# ========================
# Stage 1: Build
# ========================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files first
COPY package*.json ./

# Install root dependencies (if any)
RUN npm install

# Copy client package.json separately
COPY client/package*.json ./client/

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Copy the rest of the project
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Build server
WORKDIR /app
RUN esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# ========================
# Stage 2: Production image
# ========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/node_modules ./client/node_modules

# Copy package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/client/package*.json ./client/

EXPOSE 5000

CMD ["npm", "start"]
