# Dockerfile alternativo usando imagen oficial de Puppeteer
# Incluye: Node.js + Puppeteer + Chrome for Testing (todo en uno)
FROM ghcr.io/puppeteer/puppeteer:latest

# Cambiar a root para instalar dependencias adicionales
USER root

# Instalar dependencias adicionales necesarias para tu app
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de la app y cambiar permisos
RUN mkdir -p /app/backend && chown -R pptruser:pptruser /app

# Cambiar a usuario pptruser (usuario creado por la imagen oficial)
USER pptruser

# Establecer directorio de trabajo
WORKDIR /app/backend

# Copiar package files
COPY --chown=pptruser:pptruser backend/package.json backend/package-lock.json ./

# Instalar dependencias de Node.js
RUN npm ci --prefer-offline --no-audit --progress=false

# Copiar firebase.json si es necesario
COPY --chown=pptruser:pptruser firebase.json /app/

# Copiar código fuente
COPY --chown=pptruser:pptruser backend ./

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 5102

# La imagen oficial ya maneja el init process correctamente
CMD ["npm", "start"] 