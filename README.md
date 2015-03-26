# ![](https://raw.githubusercontent.com/fritzy/posthole/master/logos/posthole_64.png) PostHole.js
### a Postgres Object Store for Node.js / IO.js

<!-- Currently in development ...  
![](http://img.diynetwork.com/DIY/2008/10/10/dgfi507_2fa_digpost_lg.jpg)  
-->

Postgres recently gave a very thoughtful gift to the JavaScript community by adding support for JSON types.
PostHole allows you to assign models to your JSON fields for easy management, must like a keystore, but with the full power of Postgres behind it.
Write your queries with standard SQL, and get your JSON fields back as instantiated models.

PostHole uses [VeryModel](https://github.com/fritzy/verymodel) does to make working with models easy and powerful.  
PostHole uses [node-postgres](https://github.com/brianc/node-postgres) aka module `pg` for the connection and queries.

### Example

```js
var PostHole = require('posthole');

var PersonFactory = new PostHole.Model({
    firstName: {},
    lastName: {},
    fullName: {derive: function () {
        return this.firstName + ' ' + this.lastName;
    }},
}, {
    table: 'person',
    field: 'personjson'
});

var author = PersonFactory.create({
    firstName: 'Nathan',
    lastName: 'Fritz'
});

function startDemo() {
    author.save(function (err, id) {
        if (err) {
            console.log(err);
            return;
        }
        //query can be any query, with the fields from many models, renamed with AS or not.
        //query function is the same as postgres module 'pg's query
        PostHole.query("SELECT * FROM person WHERE id = $1", [id], function(err, result) {
            if (err && result.rows.length > 0) {
                console.log(err);
                return;
            }
            //every returned field mapped to a model will be a VeryModel instance
            //results are otherwise the same as the node postgres module 'pg'
            console.log(result.rows[0].personjson.toJSON());
            /* {
            *       firstName: "Nathan",
            *       lastName: "Fritz",
            *       fullName: "Nathan Fritz"
            * }
            */
            console.log("Saved to id: %s", result.rows[0].personjson.id);
        });
    });
}

PostHole.connect('postgres://fritzy@localhost/fritzy', function (err) {
    if (err) {
        throw err;
    }
    //grab the meta data for the fields of the table
    //figures out which field is the primary key
    //sets up table if id doesn't exist
    PersonFactory.setup(startDemo);
});

```

## Index

* [PostHole Functions](#posthole-functions)
    * [connect](#ph-connect)
    * [disconnect](#ph-disconnect)
    * [query](#ph-query)
    * [Model](#ph-model)
* [Defining a Model](#defining-a-model-factory)
    * [type](#def-type)
    * [validate](#def-validate)
    * [processIn](#def-processIn)
    * [processOut](#def-processOut)
    * [onSet](#def-onSet)
    * [derive](#def-derive)
    * [required](#def-required)
    * [default](#def-default)
    * [private](#def-private)
* [Model Options](#model-opts)
* [Model Factory Methods](#model-factory)
    * [setup](#mf-setup)
    * [load](#mf-load)
* [Model Instance Methods](#model-instance-methods)
    * [save](#save)
    * [delete](#delete)
    * [toJSON](#toJSON)
    * [toString](#toString)
    * [diff](#diff)
    * [getChanges](#getChanges)
    * [getOldModel](#getOldModel)
    * [loadData](#loadData)

<a name='posthole-functions'></a>

 * [connect](#ph-connect)
 * [disconnect](#ph-disconnect)
 * [query](#ph-query)
 * [Model](#ph-model)

<a name='ph-connect'></a>
__connect__

Sets the default connection and returns a standard node-postgres `pg` instance.

Arguments:

 * Postgres connection URI

<a name='ph-disconnect'></a>
__disconnect__

Disconnects the default connection.

<a name='ph-query'></a>
__query__

Identical to [node-postgres's query](https://github.com/brianc/node-postgres/wiki/Client#method-query-simple), except that resulting fields that match a registered Model Factory will be cast as VeryModel instances even if the names are aliased.

Arguments:

 * SQL Query String
 * optional array of arguments
 * optional callback


<a name='ph-model'></a>
__Model__

Constructor for making and registering VeryModel Model Factories that can be associated with JSON/JSONB Postgres Table Fields.

Arguments:

 * Definition Object
 * Model Options

Example:

```javascript
var posthole = require('posthole');

var Person = new posthole.Model({
    //some fields here
    name: {type: 'string'},
    phone: {type: 'string'}
},
{
    //options here
    table: 'some_table',
    field: 'some_field'
});

<a name='defining-a-model-factory'></a>
## Defining a Model

A model defines the types of fields that you might use in an object.

#### Field Definition Properties

When making a model, you must define the fields in the model.
A field definition may be a simple empty `{}` if anything goes.

Most field definition properties that can be functions are called with the model instance as the `this` context.


* [type](#def-type)
* [validate](#def-validate)
* [processIn](#def-processIn)
* [processOut](#def-processOut)
* [onSet](#def-onSet)
* [derive](#def-derive)
* [required](#def-required)
* [default](#def-default)
* [private](#def-private)

<a name='def-type'></a>
__type__

A string which references a built in type.
Built in types include `string`, `array`, `integer`, `numeric`, `enum`, `boolean`.
Strings and arrays may have `min` and `max` values, both for validation, and max will truncate the results when saving or on `toJSON`.
Enums may include `values`, an array (and eventually a ECMAScript 6 set).

You can override any of the definition fields of a specified type. Validate, processIn, processOut, and onSet will use both the built-in and your override. The others will replace the definition field.

`type` does not need to be set at all. In fact, `{}` is a perfectly valid definition.

Example:

    {field: {type: 'string', max: 140}}


----

<a name='def-validate'></a>
__validate__

The `validate` field takes a value and should determine whether that value is acceptable or not. It's run during `doValidate()` or during `save` if you set the option `validateOnSave: true`.
The function should return a boolean, an array of errors, an empty array, or an error string.

Example:

```js
new dulcimer.Model({field: {
    validate: function (value) {
        //validate on even
        return (value % 2 === 0);
    }
});
```

----

<a name='def-processIn'></a>
__processIn__

`processIn` is a function that is passed a value on loading from the database, `create`, or `loadData`. It should return a value.

This function is often paired with `processOut` in order to make an interactive object when in model form, and a serialized form when saved.

`processIn` does not handle the case of direct assignment like `modelinst.field = 'cheese';`. Use `onSet` for this case.

Example:

```javascript
new dulcimer.Model({someDateField: {
    processIn: function (value) {
        return moment(value);
    },
})
```

----

<a name='def-processOut'></a>
__processOut__

`processOut` is a function that takes a value and returns a value, just like `processIn`, but is typically used to serialize the value for storage. It runs on `save()` and `toJSON()`.

Example:

```javascript
new dulcimer.Model({someDateField: {
    processOut: function (value) {
        return value.format(); //turn moment into string
    },
})
```

----

<a name='def-onSet'></a>
__onSet__

`onSet` is just like `processIn`, except that it only runs on direct assignment. It's a function that takes a value and returns a value.

Example:

```javascript
new dulcimer.Model({someDateField: {
    processIn: function (value) {
        return moment(value);
    },
    onSet: function (value) {
        if (moment.isMoment(value)) {
            return value;
        } else {
            return moment(value);
        }
    },
    processOut: function (value) {
        return value.format();
    },
})
```

----

<a name='def-derive'></a>
__derive__

`derive` is a function that returns a value whenever the field is accessed (which can be quite frequent). The `this` context, is the current model instance, so you can access other fields.

Example:

```js
new dulcimer.Model({
    firstName: {type: 'string'},
    lastName: {type: 'string'},
    fullName: {
        type: 'string',
        derive: function () {
            return [this.firstName, this.lastName].join(" ");
        },
    }
});
```
:heavy\_exclamation\_mark: Warning! DO NOT REFERENCE THE DERIVE FIELD WITHIN ITS DERIVE FUNCTION! You will cause an infinite recursion. This is bad and will crash your program.

----

<a name='def-required'></a>
__required__

`required` is a boolean, false by default.
A required field will attempt to bring in the `default` value if a value is not present.

Example:

```js
new dulcimer.Model({
    comment: {
        type: 'string',
        required: true,
        default: "User has nothing to say."
    },
});
```

----

<a name='def-default'></a>
__default__

`default` may be a value or a function. Default is only brought into play when a field is `required` but not assigned.
In function form, `default` behaves similarly to `derive`, except that it only executes once.

```js
new dulcimer.Model({
    comment: {
        type: 'string',
        required: true,
        default: function () {
            return this.author.fullName + ' has nothing to say.';
        },
    },
});
```

:heavy\_exclamation\_mark: Warning! Assigning mutable objects as a default can result in the default getting changed over time.
When assigning objects, arrays, or essentially any advanced type, set default to a function that returns a new instance of the object.

----

<a name='def-private'></a>
__private__

`private` is a boolean, false by default, which determines whether a field is saved into the object upon [save](#save) and included in the object resulting from [toJSON()](#toJSON).

You can force private methods to be included in saved objects with the model option [savePrivate](#mo-savePrivate), while preserving [toJSON](#toJSON) omittion.

## Model Options

 * table: required for associating the model with a table
 * field: required for associating the model with a field
 * primaryKey: optional as the primary key should be detected automatically

## Model Instance Methods

* [save](#save)
* [delete](#delete)
* [toJSON](#toJSON)
* [toString](#toString)
* [diff](#diff)
* [getChanges](#getChanges)
* [getOldModel](#getOldModel)
* [loadData](#loadData)

<a name="save"></a>
__save(callback)__

Saves the current model instance to a serialized form in the db.

Any [processOut](#def-processOut) functions will be ran to process the fields into their serialized form.

Arguments:

* callback: function (err)

Callback Arguments:

1. __err__: Only set if an error occurred.
2. __id__: if this model is new


Example:

```javascript
var person = Person.create({
    firstName: 'Nathan',
    lastName: 'Fritz',
});

person.save(function (err) {
    console.log("Person:", person.fullName, "saved as", person.key);
    //fullName is a derived field
    //didn't pass options because they're optional, remember?
});
```

----

<a name="instance-delete"></a>
__delete(callback)__

Deletes the instance from the database.
:warning: This removes the entire row!

Arguments:

* callback: `function (err)`

Callback Arguments:

1. __err__: Only set when an error has occurred while deleting.


Example:

```javascript
person.delete(function (err) {
});
```

---

<a name="toJSON"></a>
__toJSON(flags)__

Outputs a JSON style object from the model.

Boolean Flags:

* withPrivate: false by default. If true, includes fields with [private](#def-private) set to true.

Example:

You want an example? Look at all of the other examples... most of them use [toJSON](#toJSON).


:point\_up: [toJSON](#toJSON) does not produce a string, but an object. See: [toString](#toString).

----

<a name="toString"></a>
__toString()__

Just like [toJSON](#toJSON), but produces a JSON string rather than an object.

----

<a name="diff"></a>
__diff(other)__

Arguments:

* other: model instance to compare this one to.

Result: object of each field with left, and right values.

```js
{
    firstName: {left: 'Nathan', right: 'Sam'},
    lastName: {left: 'Fritz', right: 'Fritz'},
}
```


----

<a name="getChanges"></a>
__getChanges()__

Get the changes since [get](#get) or [create](#create).

Result: object of each field with then, now, and changed boolean.

```js
{
    body: {then: "I dont liek cheese.", now: "I don't like cheese.", changed: true},
    updated: {then: '2014-02-10 11:11:11', now: '2014-02-10 12:12:12', changed: true},
    created: {then: '2014-02-10 11:11:11', now: '2014-02-10 11:11:11', changed: false},
}
```

----

<a name="getOldModel"></a>
__getOldModel()__

Get a new model instance of this instance with all of the changes since [get](#get) or [create](#create) reversed.

Result: Model instance.

----

<a name="loadData"></a>
__loadData()__

Loads data just like when a model instance is retrieved or [create](#create)d.

[processIn](#def-processIn) is called on any fields specified, but [onSet](#def-onSet) is not.

Essentially the same things happen as when running [create](#create) but can be done after the model instance is initialized.

Example:

```javascript
var person = Person.create({
    firstName: 'Nathan',
    lastName: 'Fritz',
});

person.favoriteColor = 'blue';

person.loadData({
    favoriteColor: 'green',
    favoriteFood: 'burrito',
});

console.log(person.toJSON());
// {firstName: 'Nathan', lastName: 'Fritz', favoriteFood: 'burrito', favoriteColor: 'green'}
``
