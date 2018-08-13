import * as steem from "steem";
import { Pusher } from "./Pusher";
import { Log } from "./log"; const log = Log.getLogger();

/******************
 ** INTIAL SETUP **
 ******************/
process.on("unhandledRejection", (err) => {
    log.crit(err);
    console.error(err);
    process.exit(1);
});
Log.setLevel("info");


/************
 ** CONFIG **
 ************/
const dbUrl = process.env.DATABASE_URL || "postgres://localhost:5432/db";
const steemApiUrl = process.env.STEEM_API_URL || "https://api.steemit.com/";

log.info("Using db url: " + dbUrl);
log.info("Using steem api url: " + steemApiUrl);

/***************
 ** START APP **
 ***************/
const steemObj = steem;
steemObj.api.setOptions({ url: steemApiUrl, uri: steemApiUrl });

const pusher = new Pusher(dbUrl, steemObj);
pusher.connect().then(() => pusher.startLoop())
.catch((error: Error) => {
    log.crit(error);
});
