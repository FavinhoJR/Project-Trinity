FROM node:18-alpine

WORKDIR /app

# Copiar dependencias del backend
COPY package*.json ./

# Instalar solo dependencias necesarias para ejecucion
RUN npm ci --omit=dev

# Copiar codigo fuente
COPY . .

# Exponer puerto de la API
EXPOSE 4000

# Iniciar la aplicacion
CMD ["node", "src/server.js"]
