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

# Build the application (both frontend and backend)
RUN npm run build

# Expose port 5000
EXPOSE 5000

# Start the production server
CMD ["npm", "run", "start"]


