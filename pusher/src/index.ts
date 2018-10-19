import * as steem from "steem";
import { Pusher } from "./Pusher";
import { Database } from "./model/Database";
import { Log } from "./log";
import Wise, { DirectBlockchainApi } from "steem-wise-core";
import { BufferedBlockLoader } from "./BufferedBlockLoader";

/******************
 ** INTIAL SETUP **
 ******************/
Log.log().initialize();

process.on("unhandledRejection", (err) => {
    console.error("Unhandled promise");
    Log.log().error("UNHANDLED PROMISE -> aborting exit");
    Log.log().error(err);
    console.error(err);
    // process.exit(1);
});


/************
 ** CONFIG **
 ************/
const dbUrl = process.env.DATABASE_URL || "postgres://localhost:5432/db";
const steemApiUrls = (process.env.STEEM_API_URL || "https://api.steemit.com").split(",");

const apis: DirectBlockchainApi [] = steemApiUrls.map(url => {
    const steemOptions: steem.SteemJsOptions = { url: url };
    return new DirectBlockchainApi("", steemOptions);
});


Log.log().info("Using db url: " + dbUrl);
Log.log().info("Using steem api urls: " + steemApiUrls);

/***************
 ** START APP **
 ***************/
async function startApp() {
    try {
        const database: Database = new Database(dbUrl);
        await database.connectAndInit(); // creates tables if necessary
        await database.setProperty("block_sources", JSON.stringify(steemApiUrls));

        const steemObj = new steem.api.Steem({ url: steemApiUrls[0] });
        const pusher = new Pusher(steemObj, database, new BufferedBlockLoader(apis));
        return pusher.startLoop();
    }
    catch (error) {
        Log.log().error(error);
        Log.log().error("Error in main loop. Exitting");
        process.exit(1);
    }
}

startApp()
.catch((error: Error) => {
    Log.log().exception(Log.level.error, error);
});
