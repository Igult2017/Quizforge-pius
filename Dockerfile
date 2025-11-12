# ========================
# Stage 1: Build
# ========================
FROM node:20-alpine AS builder

# Set working directory to root of the project
WORKDIR /app

# Copy package files for root and client
COPY package*.json ./
COPY client/package*.json ./client/

# Install root dependencies
RUN npm install

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Copy the rest of the project
WORKDIR /app
COPY . .

# Build client
WORKDIR /app/client
RUN npm run build

# Build server
WORKDIR /app
RUN npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# ========================
# Stage 2: Production image
# ========================
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/client/node_modules ./client/node_modules

# Copy package files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/client/package*.json ./client/

# Expose application port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]

