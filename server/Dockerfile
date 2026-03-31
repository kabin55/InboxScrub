FROM node:20-alpine

WORKDIR /app

# Install dependencies (optimized)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy entire project (safer than missing files)
COPY . .

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]