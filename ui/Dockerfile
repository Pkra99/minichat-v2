# UI - Development Dockerfile (Vite dev server)
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Note: VITE_API_URL is set in .env file (http://localhost:3000)
# The browser runs on the host machine, so it needs localhost to reach the gateway

# Start Vite dev server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
