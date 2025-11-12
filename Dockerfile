# ===== Build Stage =====
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy server package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy client package.json and install client dependencies
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm install

# Copy client source code
COPY client/ ./

# Build client
RUN npm run build

# ===== Production Stage =====
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy server files
COPY package*.json ./
RUN npm install --production

# Copy server source code
COPY . .

# Copy built client files from builder
COPY --from=builder /app/client/dist ./client/dist

# Expose your server port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]
