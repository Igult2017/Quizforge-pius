# ========================
# Stage 1: Build
# ========================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the client and server
RUN npm run build

# ========================
# Stage 2: Production image
# ========================
FROM node:20-alpine

WORKDIR /app

# Set NODE_ENV for production
ENV NODE_ENV=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy package.json and package-lock.json
COPY --from=builder /app/package*.json ./

# Optional: declare non-sensitive environment variables
# ENV DATABASE_URL="54efc9e03f0f42c8e438fd7ee36825db"
# ENV FIREBASE_API_KEY="AlzaSyC3gq2n4MY35qxhKHMQU20Afck5"

# Expose port your app uses
EXPOSE 5000

# Start the server
CMD ["npm", "start"]


