# Use Node Alpine image
FROM node:20-alpine AS builder

# Set working directory for the client
WORKDIR /app/client

# Copy only client package files first
COPY client/package*.json ./

# Install client dependencies
RUN npm install

# Copy the rest of the client source code
COPY client/. ./

# Build the client
RUN npm run build

# -------------------------------
# Optional: build server in the same image
WORKDIR /app

# Copy server package files
COPY package*.json ./

# Install server dependencies
RUN npm install

# Copy server code
COPY . .

# Build server if needed
# RUN npm run build-server (if you have a build step)

# Final image
CMD ["node", "server/index.js"]  # adjust if your entry point is different

