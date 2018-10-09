#§ 'FROM node:' + data.config.npm.node.version + '-alpine'
FROM node:9.11-alpine

ADD . ./

RUN npm install
RUN npm run build

CMD ["./wait-for", "db:5432", "--", "npm", "start"]


##§ '\n' + data.config.docker.generateDockerfileFrontMatter(data) + '\n' §##
LABEL maintainer="The Wise Team (https://wise-team.io/) <jedrzejblew@gmail.com>"
LABEL vote.wise.wise-version="1.2.2"
LABEL vote.wise.license="MIT"
LABEL vote.wise.repository="steem-wise-sql"
##§ §.##