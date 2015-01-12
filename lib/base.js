var util = require('util');

module.exports = function (model) {

    model.load = function (id, callback) {
        this.options.pg.query(util.format('SELECT value FROM %s WHERE id=$1', this.options.table), [id], function (err, result) {
            if (err || !result) {
                callback(err, null);
            } else {
                var json = result.rows[0].value;
                json.id = id;
                callback(err, model.create(json));
            }
        });
    };

    model.get = model.load;

    model.extendModel({
        
        prepJSON: function () {
            return JSON.stringify(this.toJSON());
        },

        save: function (callback) {
            if (!this.id) {
                var qc = {
                    text: util.format("INSERT INTO %s (value) values ($1) RETURNING id", model.options.table),
                    values: [this.prepJSON()]
                };
                console.log(qc);
                model.options.pg.query(qc, 
                    function (err, results) {
                        if (!err) {
                            this.id = results.rows[0].id;
                            callback(err);
                        } else {
                            callback(err, null);
                        }
                    }.bind(this)
                );
            } else {
                model.options.pg.query(
                    "UPDATE $1 SET (value) values (\"$2\") WHERE id=$3",
                    [model.options.table, this.prepJSON(), this.id],
                    function (err, results) {
                        if (!err) {
                            callback(err, results.row[0].id);
                        } else {
                            callback(err, null);
                        }
                    }
                );
            }
        }
    });

};
