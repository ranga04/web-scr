FROM apify/actor-node:20

COPY package*.json ./
RUN npm install --omit=dev

COPY . ./
RUN chown -R apify:apify ./
USER apify

CMD npm start --silent
