FROM node:18-alpine

RUN apk update && apk add openssl

WORKDIR /usr/src/app/micro/gateway

COPY package*.json ./

RUN yarn

COPY . .

EXPOSE 6000

CMD [ "yarn", "dev"]