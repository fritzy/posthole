var util = require('util');

module.exports = function (model) {

    model.setup = function (callback) {
        var db = model.options.pg;
        //TODO: load functions
        //create table
        //setup indexes
        model.setMetaData(callback);
    };

    model.createTable = function (callback) {
        var db = model.options.pg;
        db.query(util.format('CREATE TABLE %s (id SERIAL PRIMARY KEY, value jsonb)', model.options.table), function (err) {
            console.log("created table:", err);
            callback(err);
        });
    };

    model.setMetaData = function (callback) {
        var db = model.options.pg;
        db.query("SELECT c.relfilenode, a.attname, a.attnum FROM pg_class c, pg_attribute a, pg_type t WHERE c.relname = $1 AND a.attnum > 0 AND a.attrelid = c.oid AND a.atttypid = t.oid AND a.attname=$2", [model.options.table, 'value'], function (err, metadata) {
            if(err || metadata.rows.length === 0) {
                model.createTable(function () {
                    model.setMetaData(callback);
                });
            } else {
                model.options.tableID = metadata.rows[0].relfilenode;
                model.options.columnID = metadata.rows[0].attnum;
                db.query("SELECT a.attnum AS attnum, a.attname, format_type(a.atttypid, a.atttypmod) AS data_type FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = $1::regclass AND i.indisprimary", [model.options.table], function (err, iddata) {
                    model.options.primaryColumnID = iddata.rows[0].attnum;
                    model.register();
                });
                callback();
            }
        });
    };

};
