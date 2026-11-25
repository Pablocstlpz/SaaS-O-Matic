# etapa 1: compilar Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# etapa 2: servir los estaticos con nginx (sin Node en produccion)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# "frontend" es el nombre del proyecto en angular.json
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
