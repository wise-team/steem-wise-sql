import {
    expect
} from "chai";
import "mocha";
import * as _ from "lodash";
import * as steemJs from "steem";
import Axios from "axios";
import ow from "ow";

const sqlEndpointUrl = process.env.WISE_SQL_URL;
ow(sqlEndpointUrl, ow.string.nonEmpty.label("Env WISE_SQL_URL"));

const steemApiUrl = process.env.STEEM_API_URL;
ow(steemApiUrl, ow.string.nonEmpty.label("Env STEEM_API_URL"));

const options = {
    operationsCheckPeriodSeconds: 3 * 24 * 3600, // 3 days
    requiredSqlProtocolVersion: /*§ §*/ "1.0" /*§ ' "' + data.config.sql.protocol.version + '" ' §.*/ ,
    requiredMaxRowsPerPage: /*§ §*/ 1000 /*§ ' ' + data.config.sql.protocol.maxRowsPerPage + ' ' §.*/ ,
    maxLagSeconds: 20,
    maxLagUpdatedAgoSeconds: 5 * 60, // 5 min
    maxBlocksLag: 18
};

describe("Wise SQL metrics", function () {
    this.timeout(9000);
    this.retries(1);

    describe("properties", () => {
        let properties = [];
        before(async () => {
            const propertiesResp = await Axios.get(sqlEndpointUrl + "/properties");
            expect(propertiesResp.data)
                .to.be.an("array")
                .with.length.greaterThan(0);
            properties = propertiesResp.data;
        });

        it(`Sql endpoint has lag lower than ${options.maxLagSeconds} seconds`, () => {
            const currentLagSeconds = parseInt(properties.filter(prop => prop.key === "lag")[0].value);
            expect(currentLagSeconds).to.be.lessThan(options.maxLagSeconds);
        });

        it(`Sql endpoint has lag updated at most ${options.maxLagUpdatedAgoSeconds} seconds ago`, () => {
            const lagUpdateTimeProp = properties.filter(prop => prop.key === "lag_update_time")[0].value;
            const lagUptateTimestamp = new Date(lagUpdateTimeProp).getTime();
            const lagUpdatedAgoMs = Date.now() - lagUptateTimestamp;

            expect(lagUpdatedAgoMs).to.be.lessThan(options.maxLagUpdatedAgoSeconds * 1000);
        });

        it("Sql endpoint has more than one source of blocks", () => {
            const blockSources = JSON.parse(properties.filter(prop => prop.key === "block_sources")[0].value);
            expect(blockSources)
                .to.be.an("array")
                .with.length.greaterThan(1);
        });
    });

    describe("operations", () => {
        let operations = [];

        before(async () => {
            const testPeriodMs = options.operationsCheckPeriodSeconds * 1000;
            const testSinceISODate = new Date(Date.now() - testPeriodMs).toISOString();
            const operationsUrl = sqlEndpointUrl + "operations?order=moment.desc&timestamp=gt." + testSinceISODate;

            const operationsResp = await Axios.get(operationsUrl);
            expect(operationsResp.data)
                .to.be.an("array")
                .with.length.greaterThan(0);
            operations = operationsResp.data;
        });

        it("There were more than 4 operations in last metrics period", () => {
            expect(operations)
                .to.be.an("array")
                .with.length.gte(4);
        });

        it("Less than 50% of confirm_vote were rejections", () => {
            const confirmVotes = operations.filter((op) => op.operation_type === "confirm_vote");
            const rejections = confirmVotes
                .map(op => JSON.parse(op.json_str))
                .filter((confirmVote) => !confirmVote.accepted);
            expect(rejections.length).to.be.lte(confirmVotes.length * 0.5);
        });

        it("More than 60% of voteorders are confirmed", () => {
            const confirmVotes = operations.filter((op) => op.operation_type === "confirm_vote");
            const voteorders = operations.filter((op) => op.operation_type === "send_voteorder");
            expect(confirmVotes.length).to.be.gte(voteorders.length * 0.6);
        });
    });

    describe("upToDateness with blockchain", () => {
        let headBlock;
        let lastProcessedBlock;

        before(async () => {
            const propertiesResp = await Axios.get(sqlEndpointUrl + "/properties");
            const properties = propertiesResp.data;
            lastProcessedBlock = parseInt(properties.filter(prop => prop.key === "last_processed_block")[0].value);

            const steem = new steemJs.api.Steem({
                url: steemApiUrl || ""
            });
            const dgop = await steem.getDynamicGlobalPropertiesAsync();
            headBlock = dgop.head_block_number;
        });

        it(`Sql endpoint is at most ${options.maxBlocksLag} blocks away from the head block`, () => {
            const minBlock = headBlock  - options.maxBlocksLag;
            expect(lastProcessedBlock).to.be.gte(minBlock);
        });
    });

    describe("headers", () => {
        [{
                method: "GET",
                url: sqlEndpointUrl + "/operations?limit=1",
                data: undefined
            },
            {
                method: "GET",
                url: sqlEndpointUrl + "/rpc/rulesets_by_delegator_at_moment?delegator=noisy&moment=999999999999",
                data: undefined,
            },
            {
                method: "POST",
                url: sqlEndpointUrl + "/rpc/rulesets_by_delegator_at_moment",
                data: {
                    delegator: "noisy",
                    moment: "999999999999"
                },
            },
        ].forEach(test => {
            const protocolVersionHeader = "wisesql-protocol-version";

            it(test.method + " " + test.url + " responds with a header with proper protocol version", async () => {
                const response = await Axios({
                    method: test.method,
                    url: test.url,
                    data: test.data,
                });

                expect(response.headers).to.include.keys(protocolVersionHeader);
                expect(response.headers[protocolVersionHeader]).to.be.equal(options.requiredSqlProtocolVersion);
            });

            const maxRowsPerPageHeader = "wisesql-max-rows-per-page";
            it(test.method + " " + test.url + " responds with a rows per page header with correct value", async () => {
                const response = await Axios({
                    method: test.method,
                    url: test.url,
                    data: test.data,
                });
                expect(response.headers).to.include.keys(maxRowsPerPageHeader);
                expect(response.headers[maxRowsPerPageHeader]).to.be.equal(options.requiredMaxRowsPerPage + "");
            });
        });
    });
});