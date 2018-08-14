import * as Bluebird  from "bluebird";
import { Wise, DirectBlockchainApi, Api, EffectuatedSmartvotesOperation } from "steem-wise-core";
import { Block, Transaction, Operation, CustomJsonOperation, VoteOperation } from "./blockchain-operations-types";
import { Database } from "./model/Database";
import { StaticConfig } from "./StaticConfig";
import { Log } from "./log"; const log = Log.getLogger();
import { WiseOperation } from "./model/WiseOperationModel";
import { isSetRules } from "../node_modules/steem-wise-core/dist/protocol/SetRules";
import { isSendVoteorder } from "../node_modules/steem-wise-core/dist/protocol/SendVoteorder";
import { isConfirmVote } from "../node_modules/steem-wise-core/dist/protocol/ConfirmVote";

export class Pusher {
    private timeoutMs: number = StaticConfig.TIMEOUT_MS;
    private database: Database;
    private wise: Wise;
    private api: DirectBlockchainApi;

    public constructor(database: Database, steemOptions: object) {
        this.database = database;
        this.api = new DirectBlockchainApi("-no-username-", "-no-posting-wif-", steemOptions);
        this.wise = new Wise("-no-username-", this.api);
    }

    public async startLoop(): Promise<void> {
        let nextBlock = await this.database.getPropertyAsNumber("last_processed_block");
        if (nextBlock) nextBlock++;
        else nextBlock = StaticConfig.START_BLOCK_NUM;

        log.info("Streaming packages from STEEM blockchain, starting at block " + nextBlock);
        await this.loadBlockLoop(nextBlock);

    }

    private async loadBlockLoop(blockNum: number): Promise<void> {
        if (blockNum % 10 == 0) log.info("Begin processing block " + blockNum);
        else log.debug("Begin processing block " + blockNum);

        return Bluebird.resolve()
        .then(() => this.api.getAllWiseOperationsInBlock(blockNum, this.wise.getProtocol()))
        .then((ops: EffectuatedSmartvotesOperation []) => this.pushOperations(ops))
        .timeout(this.timeoutMs, new Error("Timeout (> " + this.timeoutMs + "ms while processing operations)"))
        // when timeout occurs an error is thrown. It is then catched few lines below
        // (already processed operations will not be processed second time, as is described below).
        .then(() => this.database.setProperty("last_processed_block", blockNum + ""))
        .then(() => {
            log.debug("Finished processing block " + blockNum);
            return this.loadBlockLoop(blockNum + 1);
        }, (error: Error) => {
            log.error(" Reversible error: " + error.message + ". Retrying in 3 seconds...");
            setTimeout(() => this.loadBlockLoop(blockNum), 3000);
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

                voter: op.voter,
                delegator: op.delegator,
                operation_type: opType,
                json_str: JSON.stringify(op.command),
            };
            opsToPush.push(opToPush);
        });

        if (opsToPush.length > 0) return this.database.pushWiseOperations(opsToPush);
    }
}