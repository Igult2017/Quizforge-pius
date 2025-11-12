# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install client dependencies
RUN npm install

# Copy client source code
COPY client/. .

# Build the client
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app/client

# Copy built client files
COPY --from=builder /app/client/dist ./dist

# Copy production dependencies
COPY --from=builder /app/client/node_modules ./node_modules

# Expose port
EXPOSE 5000

CMD ["npm", "start"]
