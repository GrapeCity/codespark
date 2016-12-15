#!/bin/sh

docker run -d \
    --name codespark-management \
    --link mongo:mongo \
    --link redis:redis \
    -v $(pwd)/conf/service:/app/conf \
    codespark-management:1.0-$(date +"%Y%m%d")