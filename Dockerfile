FROM node:12-alpine

RUN mkdir /gpsd-faker
COPY ./package.json /gpsd-faker
WORKDIR /gpsd-faker
RUN npm install

COPY ./index.js /gpsd-faker
COPY ./config.json /gpsd-faker

ENTRYPOINT ["node"]
CMD ["/gpsd-faker/index.js"]