
import * as Sequelize from "sequelize";
import { WiseOperation } from "./WiseOperationModel";
import { Log } from "../log"; const log = Log.getLogger();

export class Database {
    private sequelize: Sequelize.Sequelize;
    private wiseOperationsModel: WiseOperation.Model;

    public constructor(connectionUrl: string) {
        this.sequelize = new Sequelize(connectionUrl);

        this.wiseOperationsModel = WiseOperation.modelFactory(this.sequelize);
    }

    public async connect() {
        return this.sequelize.authenticate()
        .then(() => this.wiseOperationsModel.sync());
    }

    public async getLastBlockNum(): Promise<number> {
        return this.wiseOperationsModel.max("block_num");
    }

    public async pushWiseOperations(operations: WiseOperation.Attributes []) {
        Log.cheapDebug(() => "Pushing " + JSON.stringify(operations, undefined, 2));
        return this.wiseOperationsModel.bulkCreate(operations);
    }
}