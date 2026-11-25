FROM node:22-alpine

WORKDIR /app

# primero solo las dependencias: si no cambian, Docker reutiliza esta capa
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts
# migrar() las aplica al arrancar; sin la carpeta, la API no arranca
COPY migraciones ./migraciones

ENV NODE_ENV=production
EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
