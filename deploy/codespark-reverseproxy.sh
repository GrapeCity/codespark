#!/bin/sh

docker run -d \
    --name proxy \
    -p 80:80 \
    --link site:codespark-site-1 \
    --link service1:codespark-service-1 \
    --link service2:codespark-service-2 \
    -v $(pwd)/conf/reverseproxy/nginx.conf:/etc/nginx/nginx.conf \
    -v $(pwd)/conf/reverseproxy/conf.d:/etc/nginx/conf.d \
    nginx:1.10.2