# El build de Angular da ficheros estáticos iguales en cualquier arquitectura:
# se compila en la nativa de la máquina y solo nginx va en la de destino.
FROM --platform=$BUILDPLATFORM node:22-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
