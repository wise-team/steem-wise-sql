import { Client } from "pg";
import { Block, Transaction, Operation, CustomJsonOperation, VoteOperation } from "./blockchain-operations-types";
import { Log } from "./log"; const log = Log.getLogger();

export class Pusher {
    private connectionUrl: string;
    private client: Client | undefined = undefined;
    private steem: any;

    public constructor(connectionUrl: string, steem: any) {
        this.connectionUrl = connectionUrl;
        this.steem = steem;
    }

    public async connect(): Promise<void> {
        this.client = new Client(this.connectionUrl);
        await this.client.connect();
    }

    public async stop(): Promise<void> {
        if (this.client) await this.client.end();
        return;
    }

    public async startLoop(): Promise<void> {
        log.info("Streaming packages from STEEM blockchain:");
        this.steem.api.streamBlock((error: Error| undefined, block_: object) => {
            if (error) console.error(error);
            else {
                const block = block_ as Block;
                try {
                    this.processBlock(block);
                }
                catch (error) {
                    console.error(error);
                }
            }
        });
    }

    private getClient(): Client {
        if (!this.client) throw new Error("Database is disconnected!");
        return this.client;
    }

    private async processBlock(block: Block): Promise<void> {
        const block_num = block.transactions[0].ref_block_num; // THIS IS WRONG
        const timestampUtc = block.timestamp;
        for (let transaction_num = 0; transaction_num < block.transactions.length; transaction_num++) {
            const transaction = block.transactions[transaction_num];

            for (let operation_num = 0; operation_num < transaction.operations.length; operation_num++) {
                const operation: Operation = {
                    block_num: block_num,
                    transaction_num: transaction_num,
                    transaction_id: transaction.transaction_id,
                    operation_num: operation_num,
                    timestamp: new Date(timestampUtc + "Z" /* this is UTC date */),
                    op: transaction.operations[operation_num]
                };
                this.processOperation(operation);
            }
        }
    }

    private async processOperation(operation: Operation): Promise<void> {
        if (operation.op[0] === "vote") {
            await this.pushVote(operation, operation.op[1] as VoteOperation);
        }
        else if (operation.op[0] === "custom_json" && (operation.op[1] as CustomJsonOperation).id === "wise") {
            await this.pushSmartvote(operation, operation.op[1] as CustomJsonOperation);
        }
    }

    private async pushVote(operation: Operation, voteOp: VoteOperation): Promise<void> {
        let usersWithCode = `sender_id_rows AS (
            INSERT INTO api.users (name) VALUES ($8) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id
        ), recipient_id_rows AS (
            INSERT INTO api.users (name) VALUES ($9) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id
        )`;
        let usersSelects = "(SELECT id FROM sender_id_rows),(SELECT id FROM recipient_id_rows)";

        if (voteOp.author === voteOp.voter) {
            usersWithCode = `rows AS (
                INSERT INTO api.users (name) VALUES ($8) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id
            )`;
            usersSelects = "(SELECT id FROM rows),(SELECT id FROM rows)";
        }

        const result = await this.getClient().query(`
            WITH ` + usersWithCode + ` INSERT INTO api.operations (
                 block_num, trx_num, op_in_trx, trx_id, timestamp,
                 operation_type, op_data, op_sender_id, op_recipient_id
            ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7,
                  ` + usersSelects + `
            )`, [
                operation.block_num, operation.transaction_num, operation.operation_num,
                operation.transaction_id, operation.timestamp, "vote",
                JSON.stringify(voteOp),
                voteOp.voter
            ].concat(voteOp.author !== voteOp.voter ? [ voteOp.author ] : []));
    }

    private async pushSmartvote(operation: Operation, customJsOp: CustomJsonOperation): Promise<void> {
    }

    private async pushUser(username: string): Promise<void> {
        const result = await this.getClient().query(
            "INSERT INTO api.users (name) VALUES ($1::text) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id",
                    [username]);
        const id = result.rows[0].id;
        if (id > this.maxId) this.maxId = id;
        else console.log(username + " #id= " + id);
    }

    private maxId = 0;
}