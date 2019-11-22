FROM node:10

WORKDIR /home/noah/Developement/Telegrambot/Zedeln

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "node", "server.js" ]