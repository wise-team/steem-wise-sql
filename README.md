# Steem WISE SQL
A database with all WISE operations, synced with blockchain.

It consists of four services: 
- **postgres**: database
- **postgrest**: REST api for reading from database
- **pusher**: synchronizes database with the blockchain
- **api_specification**: hosts swagger specification

## Try and use our API online
I have launched a temporary version of steem-wise-sql at [http://muon.jblew.pl:3000/(http://muon.jblew.pl:3000/). You can see the swagger specification here: **[http://muon.jblew.pl:3001/](http://muon.jblew.pl:3001/)**. Feel free to use and try it, but beware that it was just launched and the synchronization may not have been finished yet.

## How to run

```bash
$ git clone https://github.com/noisy-witness/steem-wise-sql/
$ docker-compose up
```

## How to dump the database

You can dump the database from outside the container using our dump script:

```bash
$ ./scripts/dump-db.sh
```
This will create a backup directory and dump file in it.


<br /><br />
_Thank you,<br />
Jędrzej Lewandowski_
