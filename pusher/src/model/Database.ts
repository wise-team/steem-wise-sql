
import { Log } from "../log";
const log = Log.getLogger();
import * as Sequelize from "sequelize";
import { WiseOperation } from "./WiseOperationModel";
import { Properties } from "./PropertiesModel";


export class Database {
    private sequelize: Sequelize.Sequelize;
    private wiseOperationsModel: WiseOperation.Model;
    private propertiesModel: Properties.Model;

    public constructor(connectionUrl: string) {
        this.sequelize = new Sequelize(connectionUrl);

        this.wiseOperationsModel = WiseOperation.modelFactory(this.sequelize);
        this.propertiesModel = Properties.modelFactory(this.sequelize);
    }

    public async connect() {
        return this.sequelize.authenticate()
        .then(() => this.wiseOperationsModel.sync())
        .then(() => this.propertiesModel.sync());
    }

    public async pushWiseOperations(operations: WiseOperation.Attributes []) {
        Log.cheapDebug(() => "Pushing " + JSON.stringify(operations, undefined, 2));
        return this.wiseOperationsModel.bulkCreate(operations);
    }

    public async getProperty(key: string): Promise<string | undefined> {
        const result: Properties.Instance | null =
                await this.propertiesModel.findOne({ where: { key: key } });

        if (result) return result.value;
        else return undefined;
    }

    public async getPropertyAsNumber(key: string): Promise<number | undefined> {
        const res: string | undefined = await this.getProperty(key);
        if (res) return parseInt(res);
        else return undefined;
    }

    public async setProperty(key: string, value: string): Promise<boolean> {
        Log.cheapDebug(() => "setProperty(key=" + key + ", value=" + value + ")");
        const prop: Properties.Attributes = { key: key, value: value };
        return this.propertiesModel.insertOrUpdate(prop);
    }
}