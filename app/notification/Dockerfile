FROM node:18-alpine

RUN apk update && apk add openssl

WORKDIR /usr/src/app/micro/notification

COPY package*.json ./

RUN yarn

COPY . .

EXPOSE 6002

CMD ["sh", "-c", "yarn prisma generate && yarn dev"]