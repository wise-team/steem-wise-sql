--------------------
-- DATABASE SETUP --
--------------------

CREATE DATABASE app_db;
\c app_db

CREATE SCHEMA api;

COMMENT ON SCHEMA api IS $$
<h1 style="background: #6b11ff; color: white; padding: 0.5em;">Steem WISE SQL api</h1>

Steem WISE SQL is a database with all WISE operations, synced with blockchain.

More info & source: [https://github.com/wise-team/steem-wise-sql](https://github.com/wise-team/steem-wise-sql)
$$;


--------------------
--  --- VIEWS --- --
--------------------

/*CREATE FUNCTION api.user_operations (username character(16)) RETURNS TABLE (
    block_num bigint,
    trx_num smallint,
    trx_id character(40),
    operation_type operation_type,
    delegator
    json_str text 
) 
AS $$
    SELECT block_num, trx_num, op_in_trx, trx_id, operation_type, op_data FROM api.operations WHERE 
        op_sender_id = (SELECT id FROM api.users WHERE name = username)
        OR op_recipient_id = (SELECT id FROM api.users WHERE name = username);
$$ LANGUAGE SQL IMMUTABLE STRICT;*/



--------------------
-- USERS & GRANTS --
--------------------

CREATE USER pusher WITH PASSWORD 'pusher';
GRANT CONNECT ON DATABASE app_db TO pusher;
GRANT all ON SCHEMA api TO pusher;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO pusher;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA api TO pusher;

CREATE USER postgrest WITH PASSWORD 'postgrest';
GRANT CONNECT ON DATABASE app_db TO postgrest;
GRANT SELECT ON ALL TABLES IN SCHEMA api TO postgrest;

CREATE ROLE postgrest_anon nologin;
GRANT postgrest_anon TO postgrest;
GRANT usage ON SCHEMA api TO postgrest_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA api TO postgrest_anon;
GRANT SELECT ON ALL TABLES IN SCHEMA api TO postgrest_anon;


\c app_db pusher