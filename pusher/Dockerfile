FROM node:9-alpine

ADD . ./

RUN npm install
RUN npm run build

CMD ["./wait-for", "db:5432", "--", "npm", "start"]