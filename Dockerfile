# 1. Aşama: Build (Derleme)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
# Tüm bağımlılıkları yükle
RUN npm install
COPY . .
# React Router build al (build/client klasörü oluşacak)
RUN npm run build

# 2. Aşama: Production (Çalıştırma)
FROM node:20-slim
WORKDIR /app
# Statik sunucuyu konteyner içine yükle
RUN npm install -g serve
# Sadece build edilen dosyaları bir üst aşamadan kopyala
COPY --from=builder /app/build/client ./build/client

# Port ayarı
ENV PORT=8080
EXPOSE 8080

# Uygulamayı başlat (Bu komut Cloud Run için kritik)
CMD ["serve", "-s", "build/client", "-l", "8080"]