#!/bin/sh

docker run -d \
    --name redis \
    --restart=always \
    -v $(pwd)/data/redis:/data \
    redis:3.2.6 --appendonly yes