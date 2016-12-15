#!/bin/sh

docker run -d \
    --name site \
    -p 80:80 \
    --link service1:service1 \
    --link service2:service2 \
    -v $(pwd)/conf/site/nginx.conf:/etc/nginx/nginx.conf \
    -v $(pwd)/conf/site/conf.d:/etc/nginx/conf.d \
    codespark-site:1.0-$(date +"%Y%m%d")