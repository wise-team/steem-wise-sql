import {
  expect
} from "chai";
import "mocha";
import ow from "ow";
import * as fs from "fs";
import * as _ from "lodash";
import Axios from "axios";
import * as steemJs from "steem";
import {
  Context
} from "../Context";
import {
  Config
} from "../config";

const steemApiUrl = process.env.STEEM_API_URL;
ow(steemApiUrl, ow.string.nonEmpty.label("Env STEEM_API_URL"));

// this is generated basing on wise.config file
// prettier-ignore
const requiredSteemconnectConfig = /*§ §*/{
  "oauth2Settings": {
    "baseAuthorizationUrl": "https://steemconnect.com/oauth2/authorize",
    "tokenUrl": "https://steemconnect.com/api/oauth2/token",
    "tokenRevocationUrl": "https://steemconnect.com/api/oauth2/token/revoke"
  },
  "owner": {
    "account": "wise.vote",
    "profile": {
      "name": "Wise",
      "website": "https://wise.vote/"
    },
    "last_account_update": "2019-01-09T22:12:00",
    "last_owner_update": "2018-10-22T13:31:54",
    "keys": {
      "owner": "STM5qMTthdfQMQREDNxjz3zsKBRY15SfLToNnzPM7RwWddiHwD3Xq",
      "active": [
        "STM8jjcuFn1F96eq8ssbtT7UDJpu8AmkR4sgXBhPT7TCUVaozb57q",
        "STM8YvYn5ykLo1eKkPvVu7jx6Ko3MYjVQ4zP4GRx3JKcBauAk5nHf"
      ],
      "posting": [
        "STM6Xs8WxmVHpf4EBKE3eA2v1J3H9PappSpnGDV8JatuLpJbz436Z",
        "STM7NuCMemrJ6FJza1Ky733AAbwL5dnzAE7jnLEi4waroH8ZoQCof"
      ],
      "memo": "STM7F9UXfVpwCbyqonyJawET2WC3jwnV2UT16ubkA7fgqmBDfYK4w"
    },
    "recovery_account": "noisy"
  },
  "app": {
    "production": {
      "app": {
        "account": "wisevote.app",
        "last_account_update": "1970-01-01T00:00:00",
        "last_owner_update": "1970-01-01T00:00:00",
        "keys": {
          "owner": "STM82hFUKjN2j8KGqQ8rz9YgFAbMrWFuCPkabtrAnUfV2JQshNPLz",
          "active": "STM78mV5drS6a5SredobAJXvzZv7tvBo4Cj15rumRcBtMzTWT173a",
          "posting": "STM6ZVzWQvbYSzVpY2PRJHu7QSASVy8aB8xSVcJgx5seYGHPFvJkZ",
          "memo": "STM7o1DigBaUEF28n2ap5PeY9Jqhndz3zWmF7xZ3zfRgSqeLaMnyA"
        },
        "recovery_account": "wise.vote"
      },
      "settings": {
        "id": 493,
        "client_id": "wisevote.app",
        "owner": "wise.vote",
        "redirect_uris": [
          "https://wise.vote/voting-page/",
          "https://wise.vote/api/auth/callback"
        ],
        "name": "WISE",
        "description": "Vote delegation system for STEEM blockchain: https://wise.vote/",
        "icon": "https://wise.vote/wise-assets/wise/wise-logo-color_128x128.png",
        "website": "https://wise.vote/",
        "beneficiaries": null,
        "is_public": true,
        "is_disabled": false,
        "created_at": "2018-07-06T09:53:05.827Z",
        "updated_at": "2018-12-19T15:50:35.436Z"
      }
    },
    "staging": {
      "app": {
        "account": "wisevote.staging",
        "last_account_update": "1970-01-01T00:00:00",
        "last_owner_update": "1970-01-01T00:00:00",
        "keys": {
          "owner": "STM82hFUKjN2j8KGqQ8rz9YgFAbMrWFuCPkabtrAnUfV2JQshNPLz",
          "active": "STM78mV5drS6a5SredobAJXvzZv7tvBo4Cj15rumRcBtMzTWT173a",
          "posting": "STM6ZVzWQvbYSzVpY2PRJHu7QSASVy8aB8xSVcJgx5seYGHPFvJkZ",
          "memo": "STM7o1DigBaUEF28n2ap5PeY9Jqhndz3zWmF7xZ3zfRgSqeLaMnyA"
        },
        "recovery_account": "wise.vote"
      },
      "settings": {
        "id": 718,
        "client_id": "wisevote.staging",
        "owner": "wise.vote",
        "redirect_uris": [
          "https://staging.wise.vote/voting-page/",
          "https://staging.wise.vote/api/auth/callback",
          "http://localhost:8080",
          "http://localhost:8080/api/auth/callback"
        ],
        "name": "Staging WISE",
        "description": "Staging WISE",
        "icon": "https://staging.wise.vote/wise-assets/wise/wise-logo-color_128x128.png",
        "website": "https://staging.wise.vote/",
        "beneficiaries": null,
        "is_public": false,
        "is_disabled": false,
        "created_at": "2018-12-14T10:47:57.939Z",
        "updated_at": "2019-01-29T11:45:20.395Z"
      }
    }
  }
}/*§ JSON.stringify(data.config.steemconnect, undefined, 2) §.*/ ;

const options = {
  steemconnectAppApiUrlBase: "https://api.steemconnect.com/api/apps/@",
  witnessAccount: /*§ §*/ "wise-team" /*§ ' "' + data.config.witness.account + '" ' §.*/
};

// only once each hour
if (new Date().getMinutes() < 11) {
  describe("Steemconnect", function () {
    this.retries(3);
    this.timeout(20000);

    const steem = new steemJs.api.Steem({
      url: steemApiUrl
    });

    describe("Steemconnect owner account", () => {
      const ownerAccountName = requiredSteemconnectConfig.owner.account;
      let ownerAccount = undefined;
      before(async () => ownerAccount = (await steem.getAccountsAsync([ownerAccountName]))[0]);

      it("has not been silently changed", () => expect(ownerAccount.last_owner_update).is.equal(requiredSteemconnectConfig.owner.last_owner_update));

      it("has not been silently updated", () => expect(ownerAccount.last_account_update).is.equal(requiredSteemconnectConfig.owner.last_account_update));

      it("has proper recovery_account", () => expect(ownerAccount.recovery_account).is.equal(requiredSteemconnectConfig.owner.recovery_account));

      it("has correct profile settings", () => {
        const metadata = JSON.parse(ownerAccount.json_metadata);
        expect(metadata.profile.name).is.equal(requiredSteemconnectConfig.owner.profile.name);
        expect(metadata.profile.website).is.equal(requiredSteemconnectConfig.owner.profile.website);
      });

      it("has proper keys and threshold thresholds", () => {
        expect(ownerAccount.owner.weight_threshold).is.equal(1);
        expect(ownerAccount.owner.account_auths).is.an("array").with.length(0);
        expect(ownerAccount.owner.key_auths).is.an("array").with.length(1);
        expect(ownerAccount.owner.key_auths[0][0]).is.equal(requiredSteemconnectConfig.owner.keys.owner);
        expect(ownerAccount.owner.key_auths[0][1]).is.equal(1);

        expect(ownerAccount.active.weight_threshold).is.equal(1);
        expect(ownerAccount.active.account_auths).is.an("array").with.length(0);
        expect(ownerAccount.active.key_auths).is.an("array").with.length(requiredSteemconnectConfig.owner.keys.active.length);
        expect(
          ownerAccount.active.key_auths.filter((kA) => requiredSteemconnectConfig.owner.keys.active.indexOf(kA[0]) !== -1 && kA[1] === 1)
        ).to.have.length(ownerAccount.active.key_auths.length);

        expect(ownerAccount.posting.weight_threshold).is.equal(1);
        expect(ownerAccount.posting.account_auths).is.an("array").with.length(0);
        expect(ownerAccount.posting.key_auths).is.an("array").with.length(requiredSteemconnectConfig.owner.keys.posting.length);
        expect(
          ownerAccount.posting.key_auths.filter((kA) => requiredSteemconnectConfig.owner.keys.posting.indexOf(kA[0]) !== -1 && kA[1] === 1)
        ).to.have.length(ownerAccount.posting.key_auths.length);

        expect(ownerAccount.memo_key).is.equal(requiredSteemconnectConfig.owner.keys.memo);
      });

      it("is voting for our witness", () => expect(ownerAccount.witness_votes).is.an("array").that.includes(options.witnessAccount));
    });

    ["staging", "production"].forEach((envType) => describe(`Steemconnect ${envType} app account`, () => {
      const appObj = requiredSteemconnectConfig.app[envType].app;
      const appAccountName = appObj.account;
      let appAccount = undefined;
      before(async () => {
        const resp = await steem.getAccountsAsync([appAccountName]);
        // console.log(JSON.stringify(resp[0], undefined, 2));
        appAccount = resp[0];
        if (!appAccount) throw new Error("Undefined appAccount response for @" + appAccountName);
      });

      it("had owner never updated", () => expect(appAccount.last_owner_update).is.equal(appObj.last_owner_update));

      it("has not been silently updated", () => expect(appAccount.last_account_update).is.equal(appObj.last_account_update));

      it("has proper recovery_account", () => expect(appAccount.recovery_account).is.equal(appObj.recovery_account));

      it("has proper owner account in metadata", () => {
        const metadata = JSON.parse(appAccount.json_metadata);
        expect(metadata.owner).is.equal(requiredSteemconnectConfig.owner.account);
      });

      it("has proper keys and threshold thresholds", () => {
        expect(appAccount.owner.weight_threshold).is.equal(1);
        expect(appAccount.owner.account_auths).is.an("array").with.length(1);
        expect(appAccount.owner.account_auths[0][0]).is.equal("steemconnect");
        expect(appAccount.owner.account_auths[0][1]).is.equal(1);
        expect(appAccount.owner.key_auths).is.an("array").with.length(1);
        expect(appAccount.owner.key_auths[0][0]).is.equal(appObj.keys.owner);
        expect(appAccount.owner.key_auths[0][1]).is.equal(1);

        expect(appAccount.active.weight_threshold).is.equal(1);
        expect(appAccount.active.account_auths).is.an("array").with.length(1);
        expect(appAccount.active.account_auths[0][0]).is.equal("steemconnect");
        expect(appAccount.active.account_auths[0][1]).is.equal(1);
        expect(appAccount.active.key_auths).is.an("array").with.length(1);
        expect(appAccount.active.key_auths[0][0]).is.equal(appObj.keys.active);
        expect(appAccount.active.key_auths[0][1]).is.equal(1);

        expect(appAccount.posting.weight_threshold).is.equal(1);
        expect(appAccount.posting.account_auths).is.an("array").with.length(1);
        expect(appAccount.posting.account_auths[0][0]).is.equal("steemconnect");
        expect(appAccount.posting.account_auths[0][1]).is.equal(1);
        expect(appAccount.posting.key_auths).is.an("array").with.length(1);
        expect(appAccount.posting.key_auths[0][0]).is.equal(appObj.keys.posting);
        expect(appAccount.posting.key_auths[0][1]).is.equal(1);

        expect(appAccount.memo_key).is.equal(appObj.keys.memo);
      });

      it("has never posted", () => expect(appAccount.last_post).is.equal("1970-01-01T00:00:00"));

      it("has never voted", () => expect(appAccount.last_vote_time).is.equal("1970-01-01T00:00:00"));
    }));

    ["staging", "production"].forEach((envType) => describe(`Steemconnect settings for ${envType} app`, () => {
      const settingsObj = requiredSteemconnectConfig.app[envType].settings;
      it("Steemconnect settings match those in config at requiredSteemconnectConfig.settings", async () => {
        const result = await Axios.get(options.steemconnectAppApiUrlBase + settingsObj.client_id);
        const settings = result.data;
        expect(settings).to.deep.equal(settingsObj);
      });
    }));
  });
}