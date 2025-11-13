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

# Optionally, build the server (if you have a server folder/build step)
WORKDIR /app
# RUN npm run build-server   # uncomment if you have a server build step

# Default command (adjust according to your server start script)
CMD ["node", "server/index.js"]


