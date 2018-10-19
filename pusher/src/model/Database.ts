
import { Log } from "../log";
import * as Sequelize from "sequelize";
import { WiseOperation } from "./WiseOperationModel";
import { Properties } from "./PropertiesModel";
import { Views } from "./Views";


export class Database {
    private sequelize: Sequelize.Sequelize;
    private wiseOperationsModel: WiseOperation.Model;
    private propertiesModel: Properties.Model;

    public constructor(connectionUrl: string) {
        this.sequelize = new Sequelize(connectionUrl, {
            logging: Log.log().info,
            dialectOptions: {
                multipleStatements: true
            }
        });

        this.wiseOperationsModel = WiseOperation.modelFactory(this.sequelize);
        this.propertiesModel = Properties.modelFactory(this.sequelize);
    }

    public async connectAndInit() {
        await this.sequelize.authenticate();
        await this.wiseOperationsModel.sync();
        await this.propertiesModel.sync();
        await this.setProperty("db_initialization", "in_proggress");

        await Views.setupViews(this.sequelize);

        await this.sequelize.query("GRANT SELECT ON api.operations TO postgrest_anon;");
        await this.sequelize.query("GRANT SELECT ON api.properties TO postgrest_anon;");
        await this.sequelize.query("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO postgrest_anon;");
        console.log("Setting up database done");
        await this.setProperty("db_initialization", "success");
    }

    public async pushWiseOperations(operations: WiseOperation.Attributes []) {
        Log.log().info("Pushing " + JSON.stringify(operations, undefined, 2));
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
        Log.log().cheapDebug(() => "setProperty(key=" + key + ", value=" + value + ")");
        const prop: Properties.Attributes = { key: key, value: value };
        return this.propertiesModel.insertOrUpdate(prop);
    }
}