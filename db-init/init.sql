--------------------
-- DATABASE SETUP --
--------------------

CREATE DATABASE app_db;
\c app_db

CREATE SCHEMA api;



---------------------
-- TABLES & SCHEMA --
---------------------

CREATE TYPE operation_type AS ENUM ('vote', 'set_rules', 'send_voteorder', 'confirm_votes');

CREATE TABLE api.users (
    id serial,
    name character(16) UNIQUE NOT NULL
);

CREATE TABLE api.operations (
    id serial,
    block_num bigint NOT NULL,
    trx_num smallint NOT NULL,
    op_in_trx smallint NOT NULL,
    trx_id character(40) NOT NULL,
    timestamp timestamp NOT NULL,
    op_sender_id integer,
    op_recipient_id integer,
    operation_type operation_type NOT NULL,
    op_data text NOT NULL,
    PRIMARY KEY ( id )
);



--------------------
--  --- VIEWS --- --
--------------------

CREATE FUNCTION api.user_operations (username character(16)) RETURNS TABLE (
    block_num bigint,
    trx_num smallint,
    op_in_trx smallint,
    trx_id character(40),
    operation_type operation_type,
    op_data text 
) 
AS $$
    SELECT block_num, trx_num, op_in_trx, trx_id, operation_type, op_data FROM api.operations WHERE 
        op_sender_id = (SELECT id FROM api.users WHERE name = username)
        OR op_recipient_id = (SELECT id FROM api.users WHERE name = username);
$$ LANGUAGE SQL IMMUTABLE STRICT;



--------------------
-- USERS & GRANTS --
--------------------

CREATE USER pusher WITH PASSWORD 'pusher';
GRANT CONNECT ON DATABASE app_db TO pusher;
GRANT usage ON SCHEMA api TO pusher;
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
INSERT INTO api.users (name) VALUES ('noisy') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name  RETURNING id;
INSERT INTO api.users (name) VALUES ('noisy') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name  RETURNING id;
INSERT INTO api.users (name) VALUES ('perduta') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id;
INSERT INTO api.users (name) VALUES ('jblew') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id;
INSERT INTO api.users (name) VALUES ('noisy') ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id;