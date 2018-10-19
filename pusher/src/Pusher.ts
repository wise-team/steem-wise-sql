import * as Bluebird  from "bluebird";
import * as steem from "steem";
import { EffectuatedWiseOperation, SetRules, SendVoteorder, ConfirmVote } from "steem-wise-core";
import { Block } from "./blockchain-operations-types";
import { Database } from "./model/Database";
import { StaticConfig } from "./StaticConfig";
import { Log } from "./log";
import { WiseOperation } from "./model/WiseOperationModel";
import { BufferedBlockLoader } from "./BufferedBlockLoader";
import { Util } from "./util/util";

export class Pusher {
    private steem: steem.api.Steem;
    private timeoutMs: number = StaticConfig.TIMEOUT_MS;
    private database: Database;
    private blockLoader: BufferedBlockLoader;
    private bufferingOn: boolean = true;

    public constructor(steem: steem.api.Steem, database: Database, blockLoader: BufferedBlockLoader) {
        this.steem = steem;
        this.database = database;
        this.blockLoader = blockLoader;
    }

    public async startLoop(): Promise<void> {
        let nextBlock = await this.database.getPropertyAsNumber("last_processed_block");
        if (nextBlock) nextBlock++;
        else nextBlock = StaticConfig.START_BLOCK_NUM;

        Log.log().info("Streaming packages from STEEM blockchain, starting at block " + nextBlock);
        await this.loadBlockLoop(nextBlock);

    }

    private async loadBlockLoop(blockNum: number): Promise<void> {
        Log.log().debug("Begin processing block " + blockNum);
        try {
            return Bluebird.resolve()
            .then(() => this.blockLoader.loadBlock(blockNum, this.bufferingOn))
            .then((ops: EffectuatedWiseOperation []) => this.pushOperations(ops))
            .timeout(this.timeoutMs, new Error("Timeout (> " + this.timeoutMs + "ms while processing operations)"))
            // when timeout occurs an error is thrown. It is then catched few lines below
            // (already processed operations will not be processed second time, as is described below).
            .then(() => this.database.setProperty("last_processed_block", blockNum + ""))
            .then(() => {
                if (blockNum % 50 == 0) { // print timestamp every 50 blocks
                    return this.steem.getBlockAsync(blockNum).then(
                        /* got block */ (block: Block) => {
                            Log.log().info("Finished processing block " + blockNum + " (block " + block.block_id + " timestamp " + block.timestamp + "Z)");
                            this.processLag(block);
                        },
                        /*error getting block: */ () => Log.log().info("Finished processing block " + blockNum + " (could not load block timestamp)")
                    );
                }
                else if (blockNum % 10 == 0) Log.log().info("Finished processing block " + blockNum);
                else Log.log().debug("Finished processing block " + blockNum);
            })
            .then(() => {
                return this.loadBlockLoop(blockNum + 1);
            }, (error: Error) => {
                Log.log().error(" Reversible error (b=" + blockNum + "): " + error.message + ". Retrying in 1.5 seconds...");
                setTimeout(() => this.loadBlockLoop(blockNum), 1500);
            });
        }
        catch (error) {
            Log.log().error("WARNING! Reversible error catched outside of promise (b=" + blockNum + "): " + error.message + ". Retrying in 1.5 seconds...");
            setTimeout(() => this.loadBlockLoop(blockNum), 1500);
        }
    }

    private async pushOperations(ops: EffectuatedWiseOperation []) {
        const opsToPush: WiseOperation.Attributes [] = [];
        ops.forEach(op => {
            const opType = SetRules.isSetRules(op.command) ? "set_rules" :
                           SendVoteorder.isSendVoteorder(op.command) ? "send_voteorder" :
                           ConfirmVote.isConfirmVote(op.command) ? "confirm_vote" : undefined;
            if (!opType) {
                console.warn("Operation of unrecognized type: " + JSON.stringify(op) + ". Refusing to push.");
                return;
            }
            const opToPush: WiseOperation.Attributes = {
                id: undefined as any as number,
                block_num: op.moment.blockNum,
                transaction_num: op.moment.transactionNum,
                transaction_id: op.transaction_id,
                timestamp: op.timestamp,
                moment: op.moment.blockNum + "." + Util.padStart((op.moment.transactionNum + ""), 4, "0"),

                voter: op.voter,
                delegator: op.delegator,
                operation_type: opType,
                json_str: JSON.stringify(op.command),
            };
            opsToPush.push(opToPush);
        });

        if (opsToPush.length > 0) return this.database.pushWiseOperations(opsToPush);
    }

    private async processLag(block: Block) {
        const blockTime = new Date(block.timestamp + "Z" /* process as UTC/GMT time zone*/);
        const currentTime = new Date();
        let lagS = Math.floor((currentTime.getTime() - blockTime.getTime()) / 1000);
        lagS = (lagS >= 3 ? lagS : 0);
        await this.database.setProperty("lag", lagS + "");
        await this.database.setProperty("lag_update_time", currentTime.toISOString() + "");
        await this.database.setProperty("lag_description",  "Lag field shows a delay between "
            + "current timestamp and the timestamp of last processed block in seconds.");

        if (lagS > 200) {
            Log.log().info("Current lag is " + lagS + "s (> 200s). Turning preloading on.");
            this.bufferingOn = true;
            await this.database.setProperty("buffering", "true");
        }
        else {
            this.bufferingOn = false;
            await this.database.setProperty("buffering", "false");
        }

        if (lagS > 6) {
            Log.log().info("Current lag is " + lagS + "s.");
        }

    }
}