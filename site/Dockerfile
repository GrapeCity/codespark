FROM nginx:1.10.2

MAINTAINER Zhang Wenqing "winking.zhang@grapecity.com"

ENV CODESPARK_SITE_VERSION 1.0~nginx1.10.2

COPY ./site/html /usr/share/nginx/html

RUN cp -f ./site/conf/nginx.conf /etc/nginx/nginx.conf \
    && cp -R -f ./site/conf/conf.d/* /etc/nginx/conf.d/