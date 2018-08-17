import * as Bluebird from "bluebird";
import * as _ from "lodash";
import { Log } from "./log"; const log = Log.getLogger();
import { DirectBlockchainApi, Wise, EffectuatedSmartvotesOperation } from "steem-wise-core";
import { StaticConfig } from "./StaticConfig";

export class BufferedBlockLoader {
    private apis: DirectBlockchainApi [];
    private buffer: BlockBufferElem [] = [];
    private concurrency: number;
    private numBlocksToStore = 100;

    public constructor(apis: DirectBlockchainApi []) {
        this.apis = apis;
        this.concurrency = apis.length * StaticConfig.BUFFERED_BLOCK_LOADER_CONCURRENCY_PER_NODE;
    }

    private async cleanupOlder(): Promise<void> {
        while (this.buffer.length > this.numBlocksToStore) {
            this.buffer.shift();
        }
    }

    public async loadBlock(blockNum: number): Promise<EffectuatedSmartvotesOperation []> {
        const foundResult: BlockBufferElem | undefined = _.find(this.buffer, ["blockNum", blockNum]);
        if (foundResult && foundResult.loaded) {
            log.debug("BufferedBlockLoader.loadBlock: block already loaded " + blockNum);
            return foundResult.ops; // already loaded
        }
        else if (foundResult) { // loading in proggress
            // log.debug("BufferedBlockLoader.loadBlock: awaiting block " + blockNum);
            return await Bluebird.delay(100).then(() => this.loadBlock(blockNum));
        }
        else { // loading not in proggress
            // setup loading next blocks
            for (let i = 1 /* ! to prevent loading block '0' twice */; i < this.concurrency; i++) {
                setTimeout(() => this.doLoadBlock(blockNum + i, false), 500 / this.apis.length /*alternative: Math.min(3000 * this.apis.length / this.concurrency, 800)*/);
            }

            return this.doLoadBlock(blockNum, true);
        }
    }

    private async doLoadBlock(blockNum: number, throwFailure: boolean): Promise<EffectuatedSmartvotesOperation []> {
        log.debug("BufferedBlockLoader.doLoadBlock " + blockNum);
        // mark as loading
        const loadingElem: BlockBufferElem = {
            blockNum: blockNum,
            loaded: false,
            ops: []
        };
        this.buffer.push(loadingElem);

        const api: DirectBlockchainApi | undefined = _.sample(this.apis); // pick random api
        if (!api) throw new Error("BufferedBlockLoader: No api specified");

        setTimeout(() => {
            const elemIndex = _.findIndex(this.buffer, ["blockNum", blockNum]);
            if (elemIndex >= 0 && !this.buffer[elemIndex].loaded) {
                log.debug("BufferedBlockLoader.doLoadBlock(" + blockNum + ") timeout");
                if (elemIndex >= 0) this.buffer.splice(elemIndex, 1);
            }
        }, 4000);

        return api.getAllWiseOperationsInBlock(blockNum, new Wise("-no-username", api).getProtocol())
        .then((ops: EffectuatedSmartvotesOperation []) => {
            log.debug("BufferedBlockLoader.doLoadBlock(" + blockNum + ") success");
            loadingElem.ops = ops;
            loadingElem.loaded = true;
            return ops;
        },
        (error: Error) => {
            log.debug("BufferedBlockLoader.doLoadBlock(" + blockNum + ") failure: " + error.message);
            const elemIndex = _.findIndex(this.buffer, ["blockNum", blockNum]);
            if (elemIndex >= 0) this.buffer.splice(elemIndex, 1);
            if (throwFailure) throw error;
            else return [];
        });
    }
}

interface BlockBufferElem {
    blockNum: number;
    loaded: boolean;
    ops: EffectuatedSmartvotesOperation [];
}