#!/bin/sh

docker run -d \
    --name service1 \
    --link mongo:mongo \
    --link redis:redis \
    -v $(pwd)/conf/service:/app/conf \
    codespark-service:1.0-$(date +"%Y%m%d")

docker run -d \
    --name service2 \
    --link mongo:mongo \
    --link redis:redis \
    -v $(pwd)/conf/service:/app/conf \
    codespark-service:1.0-$(date +"%Y%m%d")