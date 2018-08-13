import * as steem from "steem";
import { Pusher } from "./Pusher";
import { Database } from "./model/Database";
import { Log } from "./log";
const log = Log.getLogger();

/******************
 ** INTIAL SETUP **
 ******************/
Log.configureLoggers();
Log.setLevel("info");
process.on("unhandledRejection", (err) => {
    log.crit(err);
    console.error(err);
    process.exit(1);
});


/************
 ** CONFIG **
 ************/
const dbUrl = process.env.DATABASE_URL || "postgres://localhost:5432/db";
const steemApiUrl = process.env.STEEM_API_URL || "https://api.steemit.com/";
const steemOptions: object = { url: steemApiUrl, uri: steemApiUrl };

log.info("Using db url: " + dbUrl);
log.info("Using steem api url: " + steemApiUrl);

/***************
 ** START APP **
 ***************/
async function startApp() {
    const database: Database = new Database(dbUrl);
    await database.connect();

    const pusher = new Pusher(database, steemOptions);
    return pusher.startLoop();
}

startApp()
.catch((error: Error) => {
    log.crit(error);
});
