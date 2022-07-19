FROM node:17
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts
CMD [ "npm", "run", "start:prod" ]