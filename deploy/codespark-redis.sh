#!/bin/sh

docker run -d \
    --name redis \
    -v $(pwd)/data/redis:/data \
    redis:3.2.6 --appendonly yes