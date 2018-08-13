import * as steem from "steem";
import { Pusher } from "./Pusher";


/******************
 ** INTIAL SETUP **
 ******************/
process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});


/************
 ** CONFIG **
 ************/
const dbUrl = process.env.DATABASE_URL || "postgres://localhost:5432/db";
const steemAPiUrl = process.env.STEEM_API_URL || "https://api.steemit.com/";

console.log("Using db url: " + dbUrl);
console.log("Using steem api url: " + steemAPiUrl);

/***************
 ** START APP **
 ***************/
const steemObj = steem;
steemObj.api.setOptions({ url: steemAPiUrl, uri: steemAPiUrl });

const pusher = new Pusher(dbUrl, steemObj);
pusher.connect().then(() => pusher.startLoop());
