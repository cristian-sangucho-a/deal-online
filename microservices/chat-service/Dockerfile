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

# Cloud Run proporcionará automáticamente el puerto a través de la variable PORT
# No necesitamos EXPOSE ya que Cloud Run maneja esto automáticamente

CMD ["node", "dist/main"]
