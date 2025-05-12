FROM apify/actor-node:20

COPY package*.json ./
RUN npm install --omit=dev

COPY . ./


USER apify

CMD npm start --silent
