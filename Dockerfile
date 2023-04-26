FROM node:17-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
CMD [ "npm", "run", "start:prod" ]
