# ---- 1. Build: install, test, and compile the app with Node ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# The image is only produced if the unit tests pass.
RUN npm test && npm run build

# ---- 2. Serve: the compiled static files, with Nginx ----
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
