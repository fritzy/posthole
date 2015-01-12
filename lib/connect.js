var pg = require('pg').native;


module.exports = function (model) {

    model.connect = function (uri) {
        model.options.pg_uri = uri;
        model.options.pg = new pg.Client(uri);
    };

};
