var verymodel = require('verymodel');
var baseExtensions = require('./lib/base');
var setupExtensions = require('./lib/setup');
var pg = require('pg');

var default_db = null;
var default_db_uri = null;

function Model() {
    verymodel.VeryModel.apply(this, arguments);

    this.options.pg = default_db;
    this.options.pg_uri = default_db_uri;

    this.addDefinition({
        id: {
            private: true,
        }
    });

    baseExtensions(this);
    setupExtensions(this);

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
    }

};
