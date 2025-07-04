# Usa la imagen base de Node 18
FROM node:18-slim

# 1) Instala deps de SO necesarias (Git, Puppeteer libs, curl…)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
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
    lsb-release \
    xdg-utils \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0 \
  && rm -rf /var/lib/apt/lists/*

# 2) Instalar Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# 3) Configurar entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# 4) Directorio de trabajo dentro del contenedor
WORKDIR /app/backend

# 5) Copia sólo los package.json de backend y lockfile
COPY backend/package.json backend/package-lock.json ./

# 6) Instala deps de Node respetando el lockfile
RUN npm ci --prefer-offline --no-audit --progress=false

# 7) Copia el archivo firebase.json desde la raíz del proyecto
COPY firebase.json /app/

# 8) Copia el resto del código del backend
COPY backend ./

# 9) (Opcional) Si usas TypeScript, compila
RUN npm run build

# 10) Expone el puerto que usa tu app
EXPOSE 5102

# 11) Comando por defecto
CMD ["npm", "start"]
