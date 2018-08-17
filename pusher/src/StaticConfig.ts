import { SteemOperationNumber } from "steem-wise-core";

export class StaticConfig {
    public static INTRODUCTION_OF_SMARTVOTES_MOMENT: SteemOperationNumber = new SteemOperationNumber(21622860, 26, 0);
    public static START_BLOCK_NUM: number = process.env.START_BLOCK_NUM ? parseInt(process.env.START_BLOCK_NUM as string) : StaticConfig.INTRODUCTION_OF_SMARTVOTES_MOMENT.blockNum;
    public static TIMEOUT_MS: number = 9000;
    public static BUFFERED_BLOCK_LOADER_CONCURRENCY_PER_NODE: number = 3;
}