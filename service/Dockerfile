FROM node:4.6.2-slim

MAINTAINER Zhang Wenqing "winking.zhang@grapecity.com"

ENV CODESPARK_SERVICE_VERSION 1.0~node4.6.2

RUN mkdir -p /var/app
WORKDIR /var/app

COPY dist /var/app

CMD [ "npm", "start" ]