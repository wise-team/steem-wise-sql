import * as Sequelize from "sequelize";
import * as BluebirdPromise from "bluebird";

export class Views {
    private static queries: string [] = [
        `DROP VIEW IF EXISTS api.rulesets;`,
        `DROP VIEW IF EXISTS api.last_confirmation;`,
        `CREATE VIEW api.rulesets AS
            SELECT * FROM api.operations WHERE operation_type='set_rules' ORDER BY moment DESC
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

    public static async setupViews(sequelize: Sequelize.Sequelize) {
        const queryStr = Views.queries.join(";");
        await sequelize.query(queryStr);

        await sequelize.query(`CREATE OR REPLACE VIEW api.operations_per_day AS
            select count(*), date_trunc('day', timestamp) as date from api.operations group by date_trunc('day', timestamp) order by date_trunc('day', timestamp) desc;
        `);
        await sequelize.query("GRANT SELECT ON api.operations_per_day TO postgrest_anon;");

        await sequelize.query(`CREATE OR REPLACE VIEW api.delegators AS
            SELECT delegator, count(*) as operations_count,
            max(moment) as latest_moment, min(moment) as first_moment,
            max(timestamp) as latest_timestamp, min(timestamp) as first_timestamp,
            count(DISTINCT (voter)) as voters_count,
            count(CASE WHEN operation_type = 'send_voteorder' THEN 1 END) as voteorders, count(CASE WHEN operation_type = 'confirm_vote' THEN 1 END) as confirmed_voteorders,
            max(CASE WHEN operation_type = 'send_voteorder' THEN moment END) as last_voteorder, max(CASE WHEN operation_type = 'confirm_vote' THEN moment END) as last_confirmation
            FROM api.operations GROUP BY delegator;
        `);
        await sequelize.query("GRANT SELECT ON api.delegators TO postgrest_anon;");

        await sequelize.query(`CREATE OR REPLACE VIEW api.voters AS
            SELECT voter, count(*) as operations_count,
            max(moment) as latest_moment, min(moment) as first_moment,
            max(timestamp) as latest_timestamp, min(timestamp) as first_timestamp,
            count(DISTINCT (delegator)) as delegators_count,
            count(CASE WHEN operation_type = 'send_voteorder' THEN 1 END) as voteorders, count(CASE WHEN operation_type = 'confirm_vote' THEN 1 END) as confirmed_voteorders,
            max(CASE WHEN operation_type = 'send_voteorder' THEN moment END) as last_voteorder, max(CASE WHEN operation_type = 'confirm_vote' THEN moment END) as last_confirmation
            FROM api.operations GROUP BY voter;
        `);
        await sequelize.query("GRANT SELECT ON api.voters TO postgrest_anon;");

        await sequelize.query(`CREATE OR REPLACE VIEW api.delegators_voters AS
            SELECT delegator, voter, count(*) as operations_count,
            max(moment) as latest_moment, min(moment) as first_moment,
            max(timestamp) as latest_timestamp, min(timestamp) as first_timestamp,
            count(CASE WHEN operation_type = 'send_voteorder' THEN 1 END) as voteorders, count(CASE WHEN operation_type = 'confirm_vote' THEN 1 END) as confirmed_voteorders,
            max(CASE WHEN operation_type = 'send_voteorder' THEN moment END) as last_voteorder, max(CASE WHEN operation_type = 'confirm_vote' THEN moment END) as last_confirmation
            FROM api.operations GROUP BY delegator, voter;
        `);
        await sequelize.query("GRANT SELECT ON api.delegators_voters TO postgrest_anon;");

        await sequelize.query(`CREATE OR REPLACE VIEW api.stats AS
            SELECT
                (SELECT count(*) FROM api.operations) as operations,
                (SELECT count(*) FROM api.delegators WHERE confirmed_voteorders > 0) as delegators,
                (SELECT count(*) FROM api.voters WHERE confirmed_voteorders > 0) as voters
            ;
        `);
        await sequelize.query("GRANT SELECT ON api.stats TO postgrest_anon;");

        await sequelize.query(`CREATE OR REPLACE VIEW api.rulesets AS
            SELECT DISTINCT ON (delegator, voter) * FROM api.operations
            WHERE operation_type='set_rules'
            ORDER BY delegator ASC, voter ASC, moment DESC
            ;
        `);
        await sequelize.query("GRANT SELECT ON api.rulesets TO postgrest_anon;");

        await sequelize.query(`CREATE OR REPLACE FUNCTION
            api.rulesets_by_delegator_for_voter_at_moment (delegator varchar(40), voter varchar(40), moment numeric(14, 4))
            RETURNS TABLE (
                id integer,
                block_num integer,
                transaction_num smallint,
                transaction_id  varchar(40),
                "timestamp" timestamp with time zone,
                moment numeric(14,4),
                voter varchar(16),
                delegator varchar(16),
                operation_type api.enum_operations_operation_type,
                json_str text
            )
            AS $$
                SELECT DISTINCT ON (delegator, voter) * FROM api.operations
                WHERE operation_type='set_rules' AND delegator = $1 AND voter = $2 AND moment <= $3
                ORDER BY delegator ASC, voter ASC, moment DESC LIMIT 1
            $$ LANGUAGE SQL STABLE STRICT;
        `);

    }
}
