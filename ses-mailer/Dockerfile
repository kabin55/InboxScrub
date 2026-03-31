# ---------- Stage 1: Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy project files
COPY . .

# ---------- Stage 2: Production ----------
FROM node:20-alpine

WORKDIR /app

# Copy the entire app from the builder stage
COPY --from=builder /app ./

# Set environment and permissions
ENV NODE_ENV=production

# Security: Run as non-root user
USER node

EXPOSE 8000

CMD ["node", "server.js"]
