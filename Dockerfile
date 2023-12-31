# Используем базовый образ Node.js
FROM node:latest
# Устанавливаем директорию приложения в контейнере
WORKDIR /app
# Копируем файлы package.json и package-lock.json
COPY package*.json ./
# Устанавливаем зависимости
RUN npm install
# Копируем остальные файлы в директорию приложения
COPY . .
# Определяем команду для запуска приложения
CMD ["node", "app.js"]