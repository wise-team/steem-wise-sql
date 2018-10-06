# Steem WISE SQL

<!--§ data.config.repository.readme.generateDefaultBadges(data) §-->
[![License](https://img.shields.io/github/license/wise-team/steem-wise-sql.svg?style=flat-square)](https://github.com/wise-team/steem-wise-sql/blob/master/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) [![Chat](https://img.shields.io/badge/chat%20on%20discord-6b11ff.svg?style=flat-square)](https://discordapp.com/invite/CwxQDbG) [![Wise operations count](https://img.shields.io/badge/dynamic/json.svg?label=wise%20operations%20count&url=http%3A%2F%2Fsql.wise.vote%3A%2Foperations%3Fselect%3Dcount&query=%24%5B0%5D.count&colorB=blue&style=flat-square)](http://sql.wise.vote/operations?select=moment,delegator,voter,operation_type&order=moment.desc)
<!--§§.-->

A database with all WISE operations, synced with blockchain.

It consists of four services: 
- **postgres**: database
- **postgrest**: REST api for reading from database
- **pusher**: synchronizes database with the blockchain
- **api_specification**: hosts swagger specification



## Try and use our API online

I have launched a temporary version of steem-wise-sql at **<!--§ "[" + data.config.sql.endpoint.schema + "://" + data.config.sql.endpoint.host + "](" + data.config.sql.endpoint.schema + "://" + data.config.sql.endpoint.host + ")" §-->[http://sql.wise.vote](http://sql.wise.vote)<!--§§.-->**. Feel free to use and try it, but beware that it was just launched and the synchronization may not have been finished yet.



## Examples of api calls

The Api is provided by Postgrest. Detailed instructions on making api calls can be found here: [http://postgrest.org/en/v5.0/api.html](http://postgrest.org/en/v5.0/api.html).

Let's assume that api host is <!--§ "[" + data.config.sql.endpoint.schema + "://" + data.config.sql.endpoint.host + "](" + data.config.sql.endpoint.schema + "://" + data.config.sql.endpoint.host + ")" §-->[http://sql.wise.vote](http://sql.wise.vote)<!--§§.-->.

<!--§ value.replace(/https?:\/\/[^\/]+\//gmui, d(data.config.sql.endpoint.schema + "://" + data.config.sql.endpoint.host)) §-->
```sql
http://sql.wise.votesql.wise.votesql.wise.votesql.wise.votesql.wise.voteoperations?order=moment.asc -- from the oldest to the newest

-- pagination:
http://sql.wise.votesql.wise.voteoperations?limit=100&offset=100 -- get next 100 operations
```
<!--§§.-->





## Run WiseSQL by yourself

```bash
$ git clone https://github.com/wise-team/steem-wise-sql/
$ docker-compose up
```



## How to dump the database

You can dump the database from outside the container using our dump script:

```bash
$ ./scripts/dump-db.sh
```
This will create a backup directory and dump file in it.



<!--§ data.config.repository.readme.generateHelpMd(data) §-->
## Where to get help?

- Feel free to talk with us on our chat: {https://discordapp.com/invite/CwxQDbG} .
- You can read [The Wise Manual]({https://wise.vote/introduction})
- You can also contact Jędrzej at jedrzejblew@gmail.com (if you think that you found a security issue, please contact me quickly).

You can also ask questions as issues in appropriate repository: See [issues for this repository](https://github.com/wise-team/steem-wise-sql/issues).

<!--§§.-->


<!--§ data.config.repository.readme.generateHelpUsMd(data) §-->
## Contribute to steem Wise

We welcome warmly:

- Bug reports via [issues](https://github.com/wise-team/steem-wise-sql).
- Enhancement requests via via [issues](https://github.com/wise-team/steem-wise-sql/issues).
- [Pull requests](https://github.com/wise-team/steem-wise-sql/pulls)
- Security reports to _jedrzejblew@gmail.com_.

**Before** contributing please **read [Wise CONTRIBUTING guide](https://github.com/wise-team/steem-wise-core/blob/master/CONTRIBUTING.md)**.

Thank you for developing WISE together!



## Like the project? Let @noisy-witness become your favourite witness!

If you use & appreciate our software — you can easily support us. Just cast a vote for "noisy-witness" on your steem account. You can do it here: [https://steemit.com/~witnesses](https://steemit.com/~witnesses).

<!--§§.-->


<!-- Prayer: Gloria Patri, et Filio, et Spiritui Sancto, sicut erat in principio et nunc et semper et in saecula saeculorum. Amen. In te, Domine, speravi: non confundar in aeternum. -->
