# ========================
# Stage 1: Build
# ========================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json for caching
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy only the client and server folders to respect Vite root
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY attached_assets ./attached_assets

# Build the client and server
WORKDIR /app/client
RUN npm run build

# ========================
# Stage 2: Production image
# ========================
FROM node:20-alpine

WORKDIR /app

# Set NODE_ENV for production
ENV NODE_ENV=production

# Copy built client files from builder
COPY --from=builder /app/client/dist ./dist/public

# Copy server and shared code
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json and package-lock.json
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]

