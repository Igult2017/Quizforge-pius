# ========================
# Stage 1: Build
# ========================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy everything
COPY . .

# Build client (Vite) and server (esbuild)
WORKDIR /app/client
RUN npm run build

# Build server separately if needed
WORKDIR /app
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# ========================
# Stage 2: Production image
# ========================
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]

