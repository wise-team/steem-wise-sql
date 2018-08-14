
import * as Sequelize from "sequelize";
import { SequelizeAttributes } from "./SequelizeAttributes";

export namespace WiseOperation {
    export interface Attributes {
        id: number;
        block_num: number;
        transaction_num: number;
        transaction_id: string;
        timestamp: Date;

        voter: string;
        delegator: string;
        operation_type: string;
        json_str: string;
    }

    export type Instance = Sequelize.Instance<Attributes> & Attributes; // a single database row

    export type Model = Sequelize.Model<Instance, Attributes>;

    export function modelFactory(sequalize: Sequelize.Sequelize): Model {
        const attributes: SequelizeAttributes<Attributes> = {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            block_num: { type: Sequelize.INTEGER, allowNull: false },
            transaction_num: { type: Sequelize.SMALLINT, allowNull: false },
            transaction_id: { type: Sequelize.STRING, allowNull: false },
            timestamp: { type: Sequelize.DATE, allowNull: false },

            voter: { type: Sequelize.STRING(16), allowNull: false },
            delegator: { type: Sequelize.STRING(16), allowNull: false },
            operation_type: { type: Sequelize.ENUM("set_rules", "send_voteorder", "confirm_vote"), allowNull: false },
            json_str: { type: Sequelize.TEXT, allowNull: false },
        };
        return sequalize.define<Instance, Attributes>("WiseOperation", attributes, {
            timestamps: false,
            underscored: true,
            freezeTableName: true,
            schema: "api",
            tableName: "operations",
        });
    }
}
/*
Thank you: https://michalzalecki.com/using-sequelize-with-typescript/
*/