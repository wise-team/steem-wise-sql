
import * as Sequelize from "sequelize";
import { WiseOperation } from "./WiseOperationModel";

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

    public async pushWiseOperations(operations: WiseOperation.Instance []) {
        return this.wiseOperationsModel.bulkCreate(operations);
    }

    public instantiateWiseOperation(attributes: WiseOperation.Attributes): WiseOperation.Instance {
        return this.wiseOperationsModel.build(attributes);
    }
}