FROM node:24


WORKDIR /workspace

RUN npm install -g npm

CMD ["sleep", "infinity"]