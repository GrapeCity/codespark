#!/bin/sh

BUILD_VERSION=$1
if [ -z "$BUILD_VERSION" ]
then
    BUILD_VERSION=$(date +"%Y%m%d")
fi

docker run -d \
    --restart=always \
    --name agent \
    -p 8001:8001 \
    -e MAPI_HOST=10.32.2.43:8000 \
    -e JUDGE_IMAGE_JAVASCRIPT=codespark-judge-javascript:1.0-$BUILD_VERSION \
    -e CONCURRENT=4 \
    -e REDIS_PORT_6379_TCP_ADDR=10.32.2.43 \
    -e REDIS_PASSWORD=xA123456 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /proc:/host/proc \
    --link redis:redis \
    codespark-judge-agent:1.0-$BUILD_VERSION