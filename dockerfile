# Usa la imagen base de Node 18
FROM node:18-slim

# 1) Instala deps de SO necesarias (Git, Puppeteer libs, curl…)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libfreetype6 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# 2) Directorio de trabajo dentro del contenedor
WORKDIR /app/backend

# 3) Copia sólo los package.json de backend y lockfile
COPY backend/package.json backend/package-lock.json ./

# 4) Instala deps de Node respetando el lockfile
RUN npm ci --prefer-offline --no-audit --progress=false

# 5) Copia el archivo firebase.json desde la raíz del proyecto
COPY firebase.json /app/

# 6) Copia el resto del código del backend
COPY backend ./

# 7) (Opcional) Si usas TypeScript, compila
RUN npm run build

# 8) Expone el puerto que usa tu app
EXPOSE 5102

# 9) Comando por defecto
CMD ["npm", "start"]
