#!/bin/bash

while true;
do
    aws s3 sync s3://prod-check-answer ./test/
    npm run testLocal --silent
    sleep 10
done
