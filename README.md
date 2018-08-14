# Steem WISE SQL
A database with all WISE operations, synced with blockchain.

It consists of three services: 
- **postgres**: database
- **postgrest**: REST api for reading from database
- **pusher**: synchronizes database with the blockchain

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
