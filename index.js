var verymodel = require('verymodel');
var baseExtensions = require('./lib/base');
var setupExtensions = require('./lib/setup');
var pg = require('pg');
var util = require('util');

var default_db = null;
var default_db_uri = null;

var model_cache = {};
var model_by_type = {};
var model_by_id = {};

function Model() {
    verymodel.VeryModel.apply(this, arguments);

    this.options.pg = default_db;
    this.options.pg_uri = default_db_uri;

    this.addDefinition({
        id: {
            private: true,
        }
    });

    model_cache[this.options.table] = this;

    baseExtensions(this);
    setupExtensions(this);

    this.register = function () {
        model_by_type[util.format("%d->%d", this.options.tableID, this.options.columnID)] = this;
        model_by_id[this.options.tableID] = this;
    };

}

Model.prototype = Object.create(verymodel.VeryModel.prototype);

module.exports = {
    Model: Model,

    connect: function (uri, callback) {
        default_db_uri = uri;
        console.log("uri", uri);
        pg.connect(uri, function (err, conn, done) {
            default_db = conn;
            callback(err);
        });
    },

    query: function () {
        var args = Array.prototype.splice.call(arguments, 0);
        var callback = args.pop();
        var cols = [];
        var ids = {};
        args.push(function (err, result) {
            if (err) {
                callback(err, result);
                return;
            }
            result.fields.forEach(function (field) {
                var cache = util.format("%d->%d", field.tableID, field.columnID);
                if (model_by_type.hasOwnProperty(cache)) {
                    cols.push([field.name, model_by_type[cache], field.tableID]);
                } else if (model_by_id.hasOwnProperty(field.tableID) && model_by_id[field.tableID].options.primaryColumnID === field.columnID) {
                    ids[field.tableID] = field.name;
                }
            });
            if (cols.length === 0) {
                callback(err, result);
                return;
            }
            result.rows.forEach(function (row) {
                cols.forEach(function (col_trans) {
                    var inst = col_trans[1].create(row[col_trans[0]]);
                    if (ids.hasOwnProperty(col_trans[2])) {
                        inst.id = row[ids[col_trans[2]]];
                    }
                    row[col_trans[0]] = inst;
                });
            });
            callback(err, result);
        });
        default_db.query.apply(default_db, args);
    },

};
