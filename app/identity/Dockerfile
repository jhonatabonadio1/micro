FROM node:18-alpine

RUN apk update && apk add openssl

WORKDIR /usr/src/app/micro/identity

COPY package*.json ./

RUN yarn

COPY . .

EXPOSE 6001

CMD ["sh", "-c", "yarn prisma generate && yarn dev"]