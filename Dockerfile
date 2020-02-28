FROM node
ENV DEBIAN_FRONTEND noninteractive

ENV CRON_PROCESS="*/15 * * * * 1-5"
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN apt-get install -y libfontconfig

RUN wget https://download.oracle.com/otn_software/linux/instantclient/19600/instantclient-basiclite-linux.x64-19.6.0.0.0dbru.zip && \
    unzip instantclient-basiclite-linux.x64-19.6.0.0.0dbru.zip && \
    rm -f instantclient-basiclite-linux.x64-19.6.0.0.0dbru.zip && \
    mkdir -p /opt/oracle && mv instantclient_19_6 /opt/oracle && \
    sh -c "echo /opt/oracle/instantclient_19_6 > /etc/ld.so.conf.d/oracle-instantclient.conf" && ldconfig

USER node
RUN mkdir -p /tmp
RUN mkdir -p /home/node/app/outputs
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY --chown=node:node package.json .

USER node

RUN npm install --no-optional --only=prod && npm cache clean --force

COPY --chown=node:node . .

CMD [ "npm", "run", "start:prod" ]