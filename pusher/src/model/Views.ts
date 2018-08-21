import * as Sequelize from "sequelize";
import * as Promise from "bluebird";

export class Views {
    private static queries: string [] = [
        `DROP VIEW IF EXISTS api.rulesets;`,
        `DROP VIEW IF EXISTS api.last_confirmation;`,
        `CREATE VIEW api.rulesets AS
            SELECT * FROM api.operations WHERE operation_type='set_rules'
        ;`,
        `CREATE VIEW api.last_confirmation AS
            SELECT * FROM (
                SELECT ROW_NUMBER() OVER (PARTITION BY delegator ORDER BY moment DESC) AS r, t.*
                FROM api.operations t WHERE operation_type='confirm_vote'
            ) x
            WHERE x.r <= 1
        ;`,
        `GRANT SELECT ON api.rulesets TO postgrest_anon;`,
        `GRANT SELECT ON api.last_confirmation TO postgrest_anon;`
    ];

    public static setupViews(sequelize: Sequelize.Sequelize): Promise<void> {
        const queryStr = Views.queries.join(";");
        return Promise.resolve()
        .then(() => sequelize.query(queryStr));
    }
}