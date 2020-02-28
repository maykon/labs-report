FROM oraclelinux:7-slim as builder

ARG release=19
ARG update=6

RUN yum -y install oracle-release-el7
RUN yum-config-manager --enable ol7_oracle_instantclient
RUN yum -y install oracle-instantclient${release}.${update}-basiclite

RUN rm -rf /usr/lib/oracle/${release}.${update}/client64/bin
WORKDIR /usr/lib/oracle/${release}.${update}/client64/lib/
RUN rm -rf *jdbc* *occi* *mysql* *jar

FROM node:12-buster-slim

ENV CRON_PROCESS="*/15 * * * * 1-5"
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy the Instant Client libraries, licenses and config file from the previous image
COPY --from=builder /usr/lib/oracle /usr/lib/oracle
COPY --from=builder /usr/share/oracle /usr/share/oracle
COPY --from=builder /etc/ld.so.conf.d/oracle-instantclient.conf /etc/ld.so.conf.d/oracle-instantclient.conf

RUN apt-get install -y libfontconfig
RUN apt-get update && apt-get -y upgrade && apt-get -y dist-upgrade && apt-get install -y libaio1 && \
    apt-get -y autoremove && apt-get -y clean && \
    ldconfig

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