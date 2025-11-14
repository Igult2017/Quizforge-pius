# Use lightweight Node image
FROM node:20-alpine

# Set working directory to root of project
WORKDIR /app

# Copy root package.json and package-lock.json (if exists)
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Build the React client
WORKDIR /app/client
RUN npm install       # Install client-specific dependencies (if any)
RUN npm run build     # Build the client

# Set working directory back to root for server
WORKDIR /app

# Default command: run server/index.ts using tsx
CMD ["npx", "tsx", "server/index.ts"]


