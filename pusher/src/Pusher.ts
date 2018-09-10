import * as Bluebird  from "bluebird";
import * as steem from "steem";
import { Wise, DirectBlockchainApi, Api, EffectuatedSmartvotesOperation } from "steem-wise-core";
import { Block, Operation, CustomJsonOperation, VoteOperation } from "./blockchain-operations-types";
import { Database } from "./model/Database";
import { StaticConfig } from "./StaticConfig";
import { Log } from "./log"; const log = Log.getLogger();
import { WiseOperation } from "./model/WiseOperationModel";
import { isSetRules } from "../node_modules/steem-wise-core/dist/protocol/SetRules";
import { isSendVoteorder } from "../node_modules/steem-wise-core/dist/protocol/SendVoteorder";
import { isConfirmVote } from "../node_modules/steem-wise-core/dist/protocol/ConfirmVote";
import { BufferedBlockLoader } from "./BufferedBlockLoader";
import { Util } from "./util/util";

export class Pusher {
    private timeoutMs: number = StaticConfig.TIMEOUT_MS;
    private database: Database;
    private blockLoader: BufferedBlockLoader;

    public constructor(database: Database, blockLoader: BufferedBlockLoader) {
        this.database = database;
        this.blockLoader = blockLoader;
    }

    public async startLoop(): Promise<void> {
        let nextBlock = await this.database.getPropertyAsNumber("last_processed_block");
        if (nextBlock) nextBlock++;
        else nextBlock = StaticConfig.START_BLOCK_NUM;

        log.info("Streaming packages from STEEM blockchain, starting at block " + nextBlock);
        await this.loadBlockLoop(nextBlock);

    }

    private async loadBlockLoop(blockNum: number): Promise<void> {
        log.debug("Begin processing block " + blockNum);

        return Bluebird.resolve()
        .then(() => this.blockLoader.loadBlock(blockNum))
        .then((ops: EffectuatedSmartvotesOperation []) => this.pushOperations(ops))
        .timeout(this.timeoutMs, new Error("Timeout (> " + this.timeoutMs + "ms while processing operations)"))
        // when timeout occurs an error is thrown. It is then catched few lines below
        // (already processed operations will not be processed second time, as is described below).
        .then(() => this.database.setProperty("last_processed_block", blockNum + ""))
        .then(() => {
            if (blockNum % 50 == 0) { // print timestamp every 50 blocks
                return steem.api.getBlockAsync(blockNum).then(
                    /* got block */ (block: Block) => {
                        log.info("Finished processing block " + blockNum + " (block " + block.block_id + " timestamp " + block.timestamp + "Z)");
                        this.pushLagInfo(block);
                    },
                    /*error getting block: */ () => log.info("Finished processing block " + blockNum + " (could not load block timestamp)")
                );
            }
            else if (blockNum % 10 == 0) log.info("Finished processing block " + blockNum);
            else log.debug("Finished processing block " + blockNum);
        })
        .then(() => {
            return this.loadBlockLoop(blockNum + 1);
        }, (error: Error) => {
            log.error(" Reversible error (b=" + blockNum + "): " + error.message + ". Retrying in 1.5 seconds...");
            setTimeout(() => this.loadBlockLoop(blockNum), 1500);
        });
    }

    private async pushOperations(ops: EffectuatedSmartvotesOperation []) {
        const opsToPush: WiseOperation.Attributes [] = [];
        ops.forEach(op => {
            const opType = isSetRules(op.command) ? "set_rules" :
                           isSendVoteorder(op.command) ? "send_voteorder" :
                           isConfirmVote(op.command) ? "confirm_vote" : undefined;
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

    private async pushLagInfo(block: Block) {
        const blockTime = new Date(block.timestamp + "Z" /* process as UTC/GMT time zone*/);
        const currentTime = new Date();
        const lagMs = currentTime.getTime() - blockTime.getTime();
        await this.database.setProperty("lag", Math.floor(lagMs / 1000) + "");
        await this.database.setProperty("lag_update_time", currentTime.toISOString() + "");
        await this.database.setProperty("lag_description",  "Lag field shows a delay between "
            + "current timestamp and the timestamp of last processed block in seconds.");

        if (lagMs > 6 * 1000) {
            log.info("Current lag is " + Math.floor(lagMs / 1000) + "s. ISO=" + new Date(lagMs).toISOString());
        }
    }
}