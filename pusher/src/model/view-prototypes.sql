DROP VIEW IF EXISTS api.rulesets;
DROP VIEW IF EXISTS api.rulesets_2;
DROP VIEW IF EXISTS api.rulesets_3;
DROP VIEW IF EXISTS api.last_confirmation;
DROP VIEW IF EXISTS api.operations_view;

CREATE VIEW api.operations_view AS
    SELECT *, CAST(block_num::text||'.'||LPAD(transaction_num::text, 4, '0') AS numeric(14,4)) as moment FROM api.operations ORDER BY moment DESC
;
CREATE VIEW api.rulesets AS
    SELECT * FROM api.operations_view WHERE operation_type='set_rules' ORDER BY moment DESC
;
CREATE VIEW api.last_confirmation AS
    SELECT * FROM (
        SELECT ROW_NUMBER() OVER (PARTITION BY delegator ORDER BY moment DESC) AS r, t.*
        FROM api.operations_view t WHERE operation_type='confirm_vote'
    ) x
    WHERE x.r <= 1
;

GRANT SELECT ON api.operations_view TO postgrest_anon;
GRANT SELECT ON api.rulesets TO postgrest_anon;
GRANT SELECT ON api.rulesets_2 TO postgrest_anon;
GRANT SELECT ON api.rulesets_3 TO postgrest_anon;
GRANT SELECT ON api.last_confirmation TO postgrest_anon;


/*
app_db=# SELECT delegator, voter, moment FROM api.operations_view WHERE voter='nicniezgrublem' AND delegator='noisy' AND operation_type='set_rules';
 delegator |     voter      |    moment     
-----------+----------------+---------------
 noisy     | nicniezgrublem | 22491682.0015
 noisy     | nicniezgrublem | 22589333.0020
 noisy     | nicniezgrublem | 22589395.0003
 noisy     | nicniezgrublem | 23072882.0046
 noisy     | nicniezgrublem | 23073411.0048
 noisy     | nicniezgrublem | 23073422.0006
 noisy     | nicniezgrublem | 23125447.0043
 noisy     | nicniezgrublem | 23125686.0004
 noisy     | nicniezgrublem | 23191940.0019
 noisy     | nicniezgrublem | 23570848.0011
 noisy     | nicniezgrublem | 23884604.0027
 noisy     | nicniezgrublem | 23884905.0031
(12 rows)

*/
--------
-- Load single result for delegator=noisy, voter=nicniezgrublem, moment <= 23800000.0000
-------
/* Expected result:
 delegator |     voter      |    moment     | n 
-----------+----------------+---------------+---
 noisy     | nicniezgrublem | 23570848.0011 | 3
 */
SELECT DISTINCT ON(delegator, voter) delegator, voter, moment FROM api.operations_view WHERE operation_type='set_rules' and delegator='noisy' and voter='nicniezgrublem' and moment <= 23800000.0000;
-- above works
SELECT DISTINCT ON(delegator, voter) delegator, voter, moment, n FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY delegator, voter ORDER BY moment DESC) AS n FROM api.operations_view WHERE operation_type='set_rules'
) t WHERE delegator='noisy' and voter='nicniezgrublem' and moment <= 23800000.0000;
-- above works
SELECT DISTINCT ON(delegator, voter) delegator, voter, moment FROM (
    SELECT * FROM api.operations_view WHERE operation_type='set_rules'
) t WHERE delegator='noisy' and voter='nicniezgrublem' and moment <= 23800000.0000;
-- above works
select delegator, voter, moment from api.rulesets where delegator='noisy' and voter='nicniezgrublem' and moment <= 23800000;
-- above doesn't work, rerurns 0 rows
select delegator, voter, moment from api.rulesets_2 where delegator='noisy' and voter='nicniezgrublem' and moment <= 23800000;
-- above doesn't work, rerurns 0 rows
select delegator, voter, moment from api.rulesets_3 where delegator='noisy' and voter='nicniezgrublem' and moment <= 23800000;
-- above doesn't work, rerurns 0 rows


------
-- Load multiple results for moment <= 23800000.0000
------
/* expected result: noisy          | nicniezgrublem   | 23570848.0011*/
SELECT DISTINCT ON(delegator, voter) delegator, voter, moment FROM api.operations_view WHERE operation_type='set_rules' and moment <= 23800000.0000;
-- wrong result:  noisy          | nicniezgrublem   | 22589333.0020
SELECT DISTINCT ON(delegator, voter) delegator, voter, moment, n FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY delegator, voter ORDER BY moment DESC) AS n FROM api.operations_view WHERE operation_type='set_rules'
) t WHERE moment <= 23800000.0000;
-- correct result: noisy          | nicniezgrublem   | 23570848.0011 |  3
SELECT DISTINCT ON(delegator, voter) delegator, voter, moment FROM (
    SELECT * FROM api.operations_view WHERE operation_type='set_rules'
) t WHERE moment <= 23800000.0000;
-- wrong result:  noisy          | nicniezgrublem   | 22589333.0020
select delegator, voter, moment from api.rulesets where moment <= 23800000.0000;
-- wrong result:  noisy          | nicniezgrublem   | 22589333.0020
select delegator, voter, moment from api.rulesets_2 where moment <= 23800000.0000;
-- wrong result:  noisy          | nicniezgrublem   | 22589333.0020
select delegator, voter, moment from api.rulesets_3 where moment <= 23800000.0000;
-- wrong result:  noisy          | nicniezgrublem   | 22589333.0020

