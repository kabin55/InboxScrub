FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose internal port
EXPOSE 8000

# Run mailer
CMD ["node", "server.js"]