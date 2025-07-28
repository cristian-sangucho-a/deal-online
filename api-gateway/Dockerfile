# ================================================================
# Etapa 1: Builder - Construye la aplicación
# ================================================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Usamos 'npm ci' para una instalación más rápida y fiable
RUN npm ci

# Copiamos el resto del código fuente
COPY . .

# Compilamos la aplicación
RUN npm run build

# ================================================================
# Etapa 2: Runner - Ejecuta la aplicación construida
# ================================================================
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Instalamos solo las dependencias de producción
RUN npm install --only=production

# Copiamos el código compilado desde la etapa anterior
COPY --from=builder /usr/src/app/dist ./dist

# Copiamos las dependencias de producción que ya se instalaron
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Exponemos el puerto 3000, el puerto del Gateway
EXPOSE 3000

# Comando para iniciar el servicio
CMD ["node", "dist/main"]
