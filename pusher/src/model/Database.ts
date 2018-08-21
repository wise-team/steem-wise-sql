
import { Log } from "../log";
const log = Log.getLogger();
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
            logging: log.debug,
            dialectOptions: {
                multipleStatements: true
            }
        });

        this.wiseOperationsModel = WiseOperation.modelFactory(this.sequelize);
        this.propertiesModel = Properties.modelFactory(this.sequelize);
    }

    public async connectAndInit() {
        return this.sequelize.authenticate()
        .then(() => this.wiseOperationsModel.sync())
        .then(() => this.propertiesModel.sync())

        .then(() => this.sequelize.query("GRANT SELECT ON api.operations TO postgrest_anon;"))
        .then(() => this.sequelize.query("GRANT SELECT ON api.properties TO postgrest_anon;"))
        .then(() => this.sequelize.query("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO postgrest_anon;"))

        .then(() => Views.setupViews(this.sequelize));
    }

    public async pushWiseOperations(operations: WiseOperation.Attributes []) {
        log.info("Pushing " + JSON.stringify(operations, undefined, 2));
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