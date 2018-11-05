import * as Bluebird from "bluebird";
import * as _ from "lodash";
import { Log } from "./log";
import { DirectBlockchainApi, Wise, EffectuatedWiseOperation } from "steem-wise-core";
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

    /**
     *
     * @param blockNum
     * @param shouldPreload - indicates if buffering is turned on or off (it should be turned off when fetching
     * blocks near to HEAD to prevent overloading the nodes)
     */
    public async loadBlock(blockNum: number, shouldPreload: boolean): Promise<EffectuatedWiseOperation []> {
        if (this.buffer.length > 0 && this.buffer[0].blockNum < blockNum - 10) this.cleanupOlder(); // perform cleanup only if blocks are older that the requested one

        const foundResult: BlockBufferElem | undefined = _.find(this.buffer, ["blockNum", blockNum]);
        if (foundResult && foundResult.loaded) {
            Log.log().debug("BufferedBlockLoader.loadBlock: block already loaded " + blockNum);
            return foundResult.ops; // already loaded
        }
        else if (foundResult) { // loading in proggress
            // log.debug("BufferedBlockLoader.loadBlock: awaiting block " + blockNum);
            return await Bluebird.delay(100).then(() => this.loadBlock(blockNum, shouldPreload));
        }
        else { // loading not in proggress
            // setup loading next blocks
            if (shouldPreload) {
                for (let i = 1 /* ! to prevent loading block '0' twice */; i < this.concurrency; i++) {
                    setTimeout(() => this.doLoadBlock(blockNum + i, false), 500 / this.apis.length /*alternative: Math.min(3000 * this.apis.length / this.concurrency, 800)*/);
                }
            }

            return this.doLoadBlock(blockNum, true);
        }
    }

    private async doLoadBlock(blockNum: number, throwFailure: boolean): Promise<EffectuatedWiseOperation []> {
        Log.log().debug("BufferedBlockLoader.doLoadBlock " + blockNum);
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
                Log.log().debug("BufferedBlockLoader.doLoadBlock(" + blockNum + ") timeout");
                if (elemIndex >= 0) this.buffer.splice(elemIndex, 1);
            }
        }, 4000);

        try {
            const ops = await api.getAllWiseOperationsInBlock(blockNum);

            Log.log().debug("BufferedBlockLoader.doLoadBlock(" + blockNum + ") success");
            loadingElem.ops = ops;
            loadingElem.loaded = true;

            return ops;
        } catch (error) {
            Log.log().debug("BufferedBlockLoader.doLoadBlock(" + blockNum + ") failure catched: " + error.message);
            console.error(error);
            const elemIndex = _.findIndex(this.buffer, ["blockNum", blockNum]);
            if (elemIndex >= 0) this.buffer.splice(elemIndex, 1);
            if (throwFailure) {
                Log.log().debug("Throwing failure as requested: BufferedBlockLoader.doLoadBlock(throwFailure=true)");
                throw error;
            }
            else return [];
        }
    }
}

interface BlockBufferElem {
    blockNum: number;
    loaded: boolean;
    ops: EffectuatedWiseOperation [];
}