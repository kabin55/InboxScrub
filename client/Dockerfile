# # # ---------- Stage 1: Build ----------
# # FROM node:20-alpine AS builder

# # WORKDIR /app

# # COPY package*.json ./
# # RUN npm install

# # COPY . .
# # RUN npm run build

# # # ---------- Stage 2: Production ----------
# # FROM nginx:stable-alpine

# # # Remove default nginx static files
# # RUN rm -rf /usr/share/nginx/html/*

# # # Copy built files from builder
# # COPY --from=builder /app/dist /usr/share/nginx/html

# # EXPOSE 80

# # CMD ["nginx", "-g", "daemon off;"]


# # Stage 1: build
# FROM node:18 AS build

# WORKDIR /app
# COPY package*.json ./
# RUN npm install
# COPY . .

# # Accept backend URL at build time
# ARG VITE_API_BASE_URL
# ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# # Build the app
# RUN npm run build

# # Stage 2: serve with nginx
# FROM nginx:alpine
# COPY --from=build /app/dist /usr/share/nginx/html
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

# # ---------- Stage 1: Build ----------
# FROM node:20-alpine AS builder

# WORKDIR /app

# COPY package*.json ./
# RUN npm install

# COPY . .
# RUN npm run build

# # ---------- Stage 2: Production ----------
# FROM nginx:stable-alpine

# # Remove default nginx static files
# RUN rm -rf /usr/share/nginx/html/*

# # Copy built files from builder
# COPY --from=builder /app/dist /usr/share/nginx/html

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]


# Stage 1: build
FROM node:18 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Accept backend URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the app
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]