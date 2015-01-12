var PostHole = require('./index');



PostHole.connect('postgres://fritzy@localhost/fritzy', function (err) {
    console.log("okay", err);
var TM = new PostHole.Model({
    test: {},
    crap: {},
}, {table: 'testing'});

var tm = TM.create({
    test: 'this',
    crap: 'that',
});
    TM.setup(function (err) {
        tm.save(function (err) {
            console.log(err, tm.id);
            TM.load(tm.id, function (err, tm2) {
                console.log(err);
                console.log(tm2.toJSON(), tm2.id);
            });
        });
    });
});
