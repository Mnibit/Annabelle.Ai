# Annabelle.AI Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port (if needed)
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
