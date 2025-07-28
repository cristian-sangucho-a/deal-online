# ================================================================
# Etapa 1: Builder - Construye la aplicación
# ================================================================
# Usamos una imagen de Node.js con Alpine Linux, que es ligera.
# La nombramos 'builder' para poder referenciarla después.
FROM node:18-alpine AS builder

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiamos los archivos de definición de dependencias
# Copiar package-lock.json (o yarn.lock) es crucial para instalaciones consistentes
COPY package*.json ./

# Usamos 'npm ci' que es más rápido y fiable para entornos de CI/CD
# Instala TODAS las dependencias, incluyendo las de desarrollo (necesarias para compilar)
RUN npm ci

# Copiamos el resto del código fuente de la aplicación
COPY . .

# Ejecutamos el script de build de NestJS para compilar el TypeScript a JavaScript
# El resultado se guardará en la carpeta /dist
RUN npm run build

# ================================================================
# Etapa 2: Runner - Ejecuta la aplicación construida
# ================================================================
# Empezamos de nuevo desde una imagen limpia de Node.js para que la imagen final sea pequeña
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiamos los archivos de definición de dependencias otra vez
COPY package*.json ./

# Esta vez, instalamos SOLAMENTE las dependencias de producción.
RUN npm install --only=production

# Copiamos la carpeta 'dist' (con el código compilado) desde la etapa 'builder'
COPY --from=builder /usr/src/app/dist ./dist

# Exponemos el puerto 3001, que es el que usa el auth-service
EXPOSE 3001

# El comando que se ejecutará cuando el contenedor se inicie.
# Inicia la aplicación desde el archivo principal compilado.
CMD ["node", "dist/main"]