import * as steem from "steem";
import * as http from "http";
import { Pusher } from "./Pusher";
import { Database } from "./model/Database";
import { Log } from "./log";
import { DirectBlockchainApi } from "steem-wise-core";
import { BufferedBlockLoader } from "./BufferedBlockLoader";
const log = Log.getLogger();

/******************
 ** INTIAL SETUP **
 ******************/
Log.configureLoggers();
Log.setLevel("info");
if (process.env.LOG_LEVEL) {
    Log.setLevel(process.env.LOG_LEVEL);
    console.log("Log level set to \"" + process.env.LOG_LEVEL + "\"");
}
process.on("unhandledRejection", (err) => {
    console.error("Unhandled promise");
    log.error("UNHANDLED PROMISE -> aborting exit");
    log.error(err);
    console.error(err);
    // process.exit(1);
});


/************
 ** CONFIG **
 ************/
const dbUrl = process.env.DATABASE_URL || "postgres://localhost:5432/db";
const steemApiUrls = (process.env.STEEM_API_URL || "https://api.steemit.com").split(",");

const apis: DirectBlockchainApi [] = steemApiUrls.map(url => {
    const steemOptions: object = { url: url, uri: url };
    return new DirectBlockchainApi("", steemOptions);
});


log.info("Using db url: " + dbUrl);
log.info("Using steem api urls: " + steemApiUrls);

/***************
 ** START APP **
 ***************/
async function startApp() {
    const database: Database = new Database(dbUrl);
    await database.connectAndInit(); // creates tables if necessary
    await database.setProperty("block_sources", JSON.stringify(steemApiUrls));

    if (process.env.HEALTHCHECK_LISTEN_PORT) await healthcheckListen(parseInt(process.env.HEALTHCHECK_LISTEN_PORT));

    const pusher = new Pusher(database, new BufferedBlockLoader(apis));
    return pusher.startLoop();
}

// opening the port satisfies "wait-for.sh" in postgrest service and allows it to start.
// This locking is necessary, as postgrest *must* start after the tables are created.
async function healthcheckListen(port: number) {
    http.createServer(function (req, res) {
        res.writeHead(200, {"Content-Type": "text/plain"});
        res.write("Pusher is healthy.");
        res.end();
    }).listen(port, "127.0.0.1");
    log.info("Healthcheck listening on port " + port);
}

startApp()
.catch((error: Error) => {
    log.error(error);
});
