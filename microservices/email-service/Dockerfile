# Etapa 1: Builder
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Runner
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /usr/src/app/dist ./dist

# Nota: Este servicio no expone un puerto HTTP ya que solo escucha
# eventos de RabbitMQ, por lo que el comando EXPOSE es opcional.

CMD ["node", "dist/main"]