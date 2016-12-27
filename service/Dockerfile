FROM node:6.9.2

MAINTAINER Zhang Wenqing "winking.zhang@grapecity.com"

ENV CODESPARK_SERVICE_VERSION 1.0~node6.9.2

WORKDIR /codespark/serice
VOLUME /codespark/serice/conf
VOLUME /codespark/serice/logs
COPY ./common /codespark/common
COPY ./service /codespark/serice

# Install basic requirements and clean up cache folders
RUN apt-get update -qq \
    && apt-get install -y apt-utils build-essential \
    && cd /codespark/common \
    && npm install --production \
    && cd /codespark/serice \
    && npm install --production \
    && npm cache clean \
    && apt-get remove -y apt-utils build-essential \
    && apt-get autoremove -y \
    && rm -rf /tmp \
    && rm -rf ~/.cache \
    && rm -rf ~/.node-gyp \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV production
EXPOSE 5000
CMD [ "node", "app.js" ]