# ==========================================
# ETAPA 1: BASE DE DEPENDENCIAS DEL SISTEMA
# ==========================================
FROM node:20-bookworm-slim AS base
WORKDIR /app

# NestJS + Puppeteer requieren muchísimas dependencias gráficas subyacentes
# de Google Chrome Headless para generar correctamente los PDFs de la DIAN.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
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
    wget \
    xdg-utils \
    openssl \
    chromium \
    && rm -rf /var/lib/apt/lists/*


# ==========================================
# ETAPA 2: BUILDER (Compilación de Fuentes)
# ==========================================
FROM base AS builder
WORKDIR /app

# Aprovechar caché copiando archivos de dependencia primero
COPY package*.json ./
COPY tsconfig*.json ./

# Prevenir que versiones viejas de Puppeteer mueran al no hallar binarios ARM64 en Mac M1/M2/M3
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Instalar dependencias puras y dependencias de desarrollo para poder compilar
RUN npm ci

# Copiar el modelo de DB Prisma y el código fuente completo
COPY prisma ./prisma
COPY src ./src

# Generar los clientes nativos en C/Módulos de Prisma para Debian OS
RUN npx prisma generate

# Transpilar Typescript a JS Vanilla (Carpeta dist/)
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Limpiar las dependencias de desarrollo y dejar sólo las de producción requeridas
# para bajar drásticamente el peso de la imagen final
ENV NODE_ENV=production
RUN npm ci --only=production


# ==========================================
# ETAPA 3: RUNNER (Imagen Ligera de Ejecución)
# ==========================================
FROM base AS runner
WORKDIR /app

# Definir variables de entorno inyectables por DigitalOcean
ENV NODE_ENV=production
ENV PORT=3050

# Copiar exactamente los artefactos necesarios desde la capa de construcción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
# El schema de prisma usualmente es requerido por algun runtime o comando deploy
COPY --from=builder /app/prisma ./prisma 

# Exponer el puerto por el que entra tráfico desde App Platform
EXPOSE 3050

# Punto de entrada de la aplicación Server
CMD ["npm", "run", "start:prod"]
