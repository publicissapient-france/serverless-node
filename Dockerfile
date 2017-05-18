FROM node:6.10

RUN apt-get update && apt-get install -y vim
RUN npm install -g serverless newman

RUN mkdir -p /opt/project

RUN mkdir /root/.aws

VOLUME ["/opt/project", "/root/.aws"]

RUN apt-get install -y python-pip libpython-dev
WORKDIR /tmp
RUN pip install awscli

WORKDIR /opt/project

ENTRYPOINT /bin/bash
