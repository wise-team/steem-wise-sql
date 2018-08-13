import { SteemOperationNumber } from "steem-wise-core";

export class StaticConfig {
    public static INTRODUCTION_OF_SMARTVOTES_MOMENT: SteemOperationNumber = new SteemOperationNumber(21622860, 26, 0);
    public static TIMEOUT_MS: number = 9000;
}