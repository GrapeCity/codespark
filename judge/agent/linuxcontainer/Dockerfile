FROM node:6.9.2

MAINTAINER Zhang Wenqing "winking.zhang@grapecity.com"

ENV CODESPARK_SERVICE_VERSION 1.0~node6.9.2

WORKDIR /codespark/judge/agent/linuxcontainer
VOLUME /data
VOLUME /codespark/judge/agent/linuxcontainer/logs
COPY ./common /codespark/common
COPY ./judge/agent/linuxcontainer /codespark/judge/agent/linuxcontainer

RUN cd /codespark/common \
    && npm install --production \
    && cd /codespark/judge/agent/linuxcontainer \
    && npm install --production

EXPOSE 8001

CMD [ "node", "index.js" ]