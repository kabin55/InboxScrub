# server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy project files
COPY . .

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]