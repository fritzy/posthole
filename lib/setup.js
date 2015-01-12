var util = require('util');

module.exports = function (model) {

    model.setup = function (callback) {
        var db = model.options.pg;
        //TODO: load functions
        //create table
        console.log("err", model.options.table);
        db.query(util.format('CREATE TABLE %s (id SERIAL PRIMARY KEY, value jsonb)', model.options.table), function (err) {
            console.log("created table:", err);
            callback(err);
        });
        console.log('derp');
        //setup indexes
    };

};
