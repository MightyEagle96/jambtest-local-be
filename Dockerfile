FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Copy compiled JS
COPY dist ./dist

EXPOSE 4000

CMD ["node", "dist/app.js"]
