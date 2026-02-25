FROM --platform=linux/amd64 node:20-slim

# Install Chromium and build tools for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    python3 \
    make \
    g++ \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create chromium wrapper that always runs with --no-sandbox (required for Docker root)
RUN printf '#!/bin/bash\nexec /usr/bin/chromium --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage "$@"\n' > /usr/bin/chromium-no-sandbox && \
    chmod +x /usr/bin/chromium-no-sandbox

# Tell Puppeteer to use the wrapper
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-no-sandbox
ENV CHROMIUM_PATH=/usr/bin/chromium-no-sandbox

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Data directory for SQLite (will be mounted as persistent volume)
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
