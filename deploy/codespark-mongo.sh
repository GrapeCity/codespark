#!/bin/sh

docker run -d \
    --name mongo \
    --restart=always \
    -v $(pwd)/data/mongo:/data/db \
    mongo:3.2.11