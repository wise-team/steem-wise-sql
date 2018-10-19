#§ 'FROM node:' + data.config.npm.node.version + '-alpine'
FROM node:10.12-alpine

ADD . ./

RUN npm install
RUN npm run build

CMD ["./wait-for", "db:5432", "--", "npm", "start"]


##§ '\n' + data.config.docker.generateDockerfileFrontMatter(data) + '\n' §##
LABEL maintainer="The Wise Team (https://wise-team.io/) <jedrzejblew@gmail.com>"
LABEL vote.wise.wise-version="2.2.1"
LABEL vote.wise.license="MIT"
LABEL vote.wise.repository="steem-wise-sql"
##§ §.##