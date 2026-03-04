FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose container port (ECS task definition maps it)
EXPOSE 5000

# Run server
CMD ["node", "server.js"]