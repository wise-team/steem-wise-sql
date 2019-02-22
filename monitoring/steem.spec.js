import {
    expect
} from "chai";
import "mocha";
import * as _ from "lodash";
import * as steemJs from "steem";
import * as BluebirdPromise from "bluebird";
import ow from "ow";
import {
    semverCompare
} from "./util.js";


const steemApiUrl = process.env.STEEM_API_URL;
ow(steemApiUrl, ow.string.nonEmpty.label("Env STEEM_API_URL"));

const options = {
    minimalApiBlockchainVersion: /*§ §*/ "0.20.5" /*§ ' "' + data.config.steem.minimalApiBlockchainVersion + '" ' §.*/ ,
    minimalApiHardforkVersion: /*§ §*/ "0.20.0" /*§ ' "' + data.config.steem.minimalApiHardforkVersion + '" ' §.*/
};

describe(`Default steem api (${steemApiUrl}) using steem-js`, function () {
    this.timeout(8000);
    this.retries(3);

    beforeEach(async () => await BluebirdPromise.delay(1500));

    const steem = new steemJs.api.Steem({
        url: steemApiUrl
    });

    it("Does get_block correctly for an old block", async () => {
        const testBlockNum = 26194848;
        const block = await steem.getBlockAsync(testBlockNum);
        expect(block.transactions).to.be.an("array").with.length(29);
        expect(block.transactions[0].block_num).to.be.equal(testBlockNum);
        expect(block.timestamp).to.be.equal("2018-09-23T11:22:36");
    });

    it("Does get_block correctly for HEAD block", async () => {
        const dynamicGlobalProperties = await steem.getDynamicGlobalPropertiesAsync();
        if (!dynamicGlobalProperties) throw new Error("Dynamic global properties are undefined");
        const obtainedHeadBlockNum = dynamicGlobalProperties.head_block_number - 200;

        const block = await steem.getBlockAsync(obtainedHeadBlockNum);
        expect(block.transactions).to.be.an("array").with.length.gt(0);
        expect(block.transactions[0].block_num).to.be.equal(obtainedHeadBlockNum);
    });

    it("Does get_block correctly for block made during HF20 introduction problems", async () => {
        const blockNum = 26256960; // 26256746, 26256747, 26256748, 26256749 has 0 transactions,

        const block = await steem.getBlockAsync(blockNum);
        expect(block.transactions).to.be.an("array").with.length.gt(0);
        expect(block.transactions[0].block_num).to.be.equal(blockNum);
    });

    it("responds correctly to get_accounts", async () => {
        const accounts = await steem.getAccountsAsync(["nicniezgrublem"]);
        expect(accounts).to.be.an("array").with.length(1);
    });

    it("has required minimal blockchain version", async () => {
        const versionOpts = await steem.getVersionAsync();
        expect(semverCompare(versionOpts.blockchain_version, options.minimalApiBlockchainVersion)).to.be.gte(0);
    });

    it("has required minimal hardfork version", async () => {
        const hfVersion = await steem.getHardforkVersionAsync();
        expect(semverCompare(hfVersion, options.minimalApiHardforkVersion)).to.be.gte(0);
    });

    it("responds correctly to get_block", async () => {
        const dynamicGlobalProperties = await steem.getDynamicGlobalPropertiesAsync();
        if (!dynamicGlobalProperties) throw new Error("Dynamic global properties are undefined");
        const headBlockNum = dynamicGlobalProperties.head_block_number;

        const block = await steem.getBlockAsync(headBlockNum);
        expect(block.transactions[0].block_num).to.be.equal(headBlockNum);
    });
});