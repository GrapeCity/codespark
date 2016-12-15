#!/bin/sh

docker run -d \
    --name proxy \
    --link site:codespark-site-1 \
    --link service1:codespark-service-1 \
    --link service2:codespark-service-2 \
    nginx:1.10.2