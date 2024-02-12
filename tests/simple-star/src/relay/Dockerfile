FROM node:20.11

WORKDIR /app

COPY . .

RUN npm i
RUN npm run build

WORKDIR /app/tests/simple-star

CMD npm run start:relay
