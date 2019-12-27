FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN sleep 5 && npm install

copy . .

cmd [ "node", "source/server.js"]
