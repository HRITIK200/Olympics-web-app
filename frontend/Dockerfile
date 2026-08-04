# Stage 1: Build React + Vite app
FROM node:20-alpine AS build

WORKDIR /app

# Install package dependencies
COPY package*.json ./
RUN npm ci

# Copy code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve static files using Nginx
FROM nginx:stable-alpine

# Copy built assets to nginx server root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration template to handle routing and dynamic port proxying
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
