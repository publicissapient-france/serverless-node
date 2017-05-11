FROM node:6.10

RUN apt-get update && apt-get install -y vim
RUN npm install -g serverless newman

RUN mkdir -p /opt/project
WORKDIR /opt/project

RUN mkdir /root/.aws

VOLUME ["/opt/project", "/root/.aws"]

ENTRYPOINT /bin/bash