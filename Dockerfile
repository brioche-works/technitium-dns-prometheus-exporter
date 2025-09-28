FROM node:22-alpine

RUN mkdir /opt/exporter /.npm
WORKDIR /opt/exporter

COPY src ./src
COPY package-lock.json package.json tsconfig.json ./

RUN npm install --omit=dev
RUN npm run build
RUN chmod 777 '/.npm'

ENV TECHNITIUM_EXPORTER_PORT=8080

ENTRYPOINT ["npm", "run", "start"]
