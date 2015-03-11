var PostHole = require('./index');



PostHole.connect('postgres://fritzy@localhost/fritzy', function (err) {
var TM = new PostHole.Model({
    test: {},
    crap: {},
}, {table: 'testing'});

var tm = TM.create({
    test: 'this32',
    crap: 'that',
});
    TM.setup(function (err) {
        tm.save(function (err) {
            //console.log(err, tm.id);
            TM.load(tm.id, function (err, tm2) {
                PostHole.query("SELECT id, value FROM testing WHERE value @> $1",[{test: 'this32'}], function (err, result) {
                    console.log(result.rows[0].value.test, result.rows[0].value.id);
                    console.log(result.rows.length);
                    var inst = result.rows[0].value;
                    inst.test = 'changed!';
                    inst.save(function (err) {
                        PostHole.query("SELECT id, value FROM testing WHERE id = $1", [inst.id], function (err, result) {
                            console.log("now test is", result.rows[0].value.test);
                        });
                    });
                });
            });
        });
    });
});
