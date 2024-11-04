FROM mcr.microsoft.com/playwright:v1.48.1-noble

WORKDIR /home/node/app

COPY package.json ./
COPY package-lock.json ./
COPY src ./src
COPY tsconfig.json ./
COPY data ./data

RUN npm ci
RUN npm run build

CMD ["npm", "run", "start"]