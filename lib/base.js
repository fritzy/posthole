var util = require('util');

module.exports = function (model) {

    model.load = function (id, callback) {
        var self = this;
        var query = util.format('SELECT "%s" FROM "%s" WHERE "%s"=$1', this.options.field, this.options.table, this.options.primaryField);

        this.options.pg.query(query, [id], function (err, result) {
            if (err || !result) {
                callback(err, null);
            } else {
                var json = result.rows[0][self.options.field];
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
                var query = util.format('INSERT INTO "%s" ("%s") values ($1) RETURNING "%s" AS id', model.options.table, model.options.field, model.options.primaryField);
                var qc = {
                    text: util.format('INSERT INTO "%s" ("%s") values ($1) RETURNING "%s" AS id', model.options.table, model.options.field, model.options.primaryField),
                    values: [this.prepJSON()]
                };
                model.options.pg.query(qc, 
                    function (err, results) {
                        if (!err) {
                            this.id = results.rows[0].id;
                            callback(err, this.id);
                        } else {
                            callback(err, null);
                        }
                    }.bind(this)
                );
            } else {
                model.options.pg.query(
                    util.format('UPDATE "%s" SET "%s" = $1 WHERE "%s"=$2', model.options.table, model.options.field, model.options.primaryField), 
                    [this.prepJSON(), this.id],
                    function (err, results) {
                        if (!err) {
                            callback(err);
                        } else {
                            callback(err);
                        }
                    }
                );
            }
        }
    });

};
