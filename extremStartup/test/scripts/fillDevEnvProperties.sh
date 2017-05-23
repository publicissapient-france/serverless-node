#!/bin/bash

STR=$(serverless info -s dev | awk '/endpoints/{getline; print}' | awk -F'- ' '{print $NF}')
SCHEME=${STR%://*}
URL=${STR#*//}
DOMAIN=${URL%/*}
URL_PATH=${STR##*/}

cat test/extremStartup.postman_environment.json.template | \
jq --arg scheme $SCHEME -r \
'(.values[] | select(.key=="protocol") | .value )=$scheme' | \
jq --arg path $URL_PATH -r \
'(.values[] | select(.key=="path") | .value )=$path' | \
jq --arg domain $DOMAIN -r \
'(.values[] | select(.key=="domain") | .value )=$domain' > \
test/extremStartup.postman_environment.json