#!/bin/sh

docker run -d \
    --name redis \
    -p 6379:6379 \
    --restart=always \
    -v $(pwd)/data/redis:/data \
    redis:3.2.6 --appendonly yes --requirepass xA123456