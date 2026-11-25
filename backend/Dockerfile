# API de SaaS-O-Matic. Se construye para la arquitectura de quien la construye (amd64 o arm64):
# sqlite3 es un módulo nativo, así que compilar y ejecutar van en la misma plataforma.
FROM node:22-trixie-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# tsconfig.json y no el de build: así también se compila scripts/datos-ejemplo.ts.
RUN npx tsc --outDir dist && npm prune --omit=dev

FROM node:22-trixie-slim
WORKDIR /app
ENV NODE_ENV=production DB_ALMACEN=/datos/datos.sqlite
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist/src ./dist/src
COPY --from=build /app/dist/scripts ./dist/scripts
# El volumen hereda el dueño de esta carpeta: el proceso no corre como root.
RUN mkdir /datos && chown node:node /datos
USER node
EXPOSE 3000
# Datos de ejemplo solo si la base todavía no existe (volumen nuevo).
CMD ["sh", "-c", "[ -f \"$DB_ALMACEN\" ] || node dist/scripts/datos-ejemplo.js && exec node dist/src/server.js"]
