
import * as Sequelize from "sequelize";
import { SequelizeAttributes } from "./SequelizeAttributes";

export namespace Properties {
    export interface Attributes {
        key: string;
        value: string;
    }

    export type Instance = Sequelize.Instance<Attributes> & Attributes; // a single database row

    export type Model = Sequelize.Model<Instance, Attributes>;

    export function modelFactory(sequalize: Sequelize.Sequelize): Model {
        const attributes: SequelizeAttributes<Attributes> = {
            key: { type: Sequelize.STRING(40), allowNull: false, primaryKey: true, unique: true },
            value: { type: Sequelize.TEXT, allowNull: true },
        };
        return sequalize.define<Instance, Attributes>("properties", attributes, {
            timestamps: false,
            underscored: true,
            freezeTableName: true,
            schema: "api",
            tableName: "properties",
        });
    }
}