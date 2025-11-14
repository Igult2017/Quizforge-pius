# Use lightweight Node image
FROM node:20-alpine

# Set working directory to root of project
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Accept build-time environment variables (for Vite)
# In Coolify: Set these as "Build" environment variables in the service settings
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Pass build args to environment so Vite can access them during build
# Using ${VAR} syntax for reliable expansion
ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
ENV VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
ENV VITE_FIREBASE_STORAGE_BUCKET=${VITE_FIREBASE_STORAGE_BUCKET}
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=${VITE_FIREBASE_MESSAGING_SENDER_ID}
ENV VITE_FIREBASE_APP_ID=${VITE_FIREBASE_APP_ID}

# Build the application (both frontend and backend)
# Vite will bake the VITE_* env vars into the client bundle
RUN npm run build

# Expose port 5000
EXPOSE 5000

# Start the production server
CMD ["npm", "run", "start"]


