# assemble-helpers [![NPM version](https://img.shields.io/npm/v/assemble-helpers.svg?style=flat)](https://www.npmjs.com/package/assemble-helpers) [![NPM monthly downloads](https://img.shields.io/npm/dm/assemble-helpers.svg?style=flat)](https://npmjs.org/package/assemble-helpers)  [![NPM total downloads](https://img.shields.io/npm/dt/assemble-helpers.svg?style=flat)](https://npmjs.org/package/assemble-helpers) [![Linux Build Status](https://img.shields.io/travis/assemble/assemble-helpers.svg?style=flat&label=Travis)](https://travis-ci.org/assemble/assemble-helpers)

> Plugin that adds special sync and async helpers for use in assemble projects.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install --save assemble-helpers
```

## Usage

```js
var assembleHelpers = require('assemble-helpers');
var assemble = require('assemble');
var app = assemble();

app.use(assembleHelpers());
```

## Helpers

### [{{content}}](index.js#L30)

Returns the stringified contents from a `view` object, or just returns the value if `view` is a string.

**Params**

* `view` **{String|Object}**
* `returns` **{String}**: Returns `view.contents` or the value if it's a string.

**Example**

```js
app.view('foo', {contents: 'This is contents'});

// {{contents foo}}
//=> "This is contents"
```

### [{{find}}](index.js#L62)

Get the first view with the given `name` from any collection, or the specified `collection`. If no collection is passed only `renderable` collections will be searched ("renderable" collections are any collections not specified as `partials` and `layouts`).

**Params**

* `name` **{String}**: The name/key (`view.stem`, `view.basename`, `view.relative` or `view.path`) of the view to find. It's good practice to use a longer path when practical.
* `collection` **{String}**: (optional)
* `returns` **{Object|undefined}**: Returns the view if found, or `undefined` if not.

**Example**

```handlebars
{{find "foo"}}
{{find "foo.hbs" }}
{{find "a/b/c/foo.hbs"}}

<!-- optionally specify a collection -->
{{find "foo" "pages"}}
{{find "foo.hbs" "posts"}}
{{find "a/b/c/foo.hbs" "partials"}}
```

### [{{getView}}](index.js#L81)

Get a view from the specified `collection`.

**Params**

* `collection` **{String}**: (required)
* `name` **{String}**
* `returns` **{Object}**

**Example**

```handlebars
{{getView "pages" "foo"}}
{{getView "pages" "foo.hbs" }}
{{getView "pages" "a/b/c/foo.hbs"}}
```

### [{{config}}](index.js#L110)

Get the value of `prop` from `app.options` or the context. Dot-notation may be used. Context values from `app.cache.data` will override values from `app.options`, and values from locals will override all other values.

**Params**

* `prop` **{String}**
* `locals` **{Object}**: (optional) Locals to merge onto the options.
* `returns` **{any}**

**Example**

```js
app.option({a: {b: 'c'}, x: 'z'});
app.data({a: {b: 'd'}});
app.data({foo: {a: {b: 'ABC'}}});

// {{config "x"}}     => 'z'
// {{config "a.b.c"}} => 'eee'
// {{config "a.b"}}   => '{c: 'eee'}'

// with locals
// {{config foo "a.b.c"}} => 'ABC'
// {{config foo "a.b"}}   => '{c: 'ABC'}'
```

### [{{option}}](index.js#L143)

Return the value of `prop` from `app.options`.

**Params**

* `prop` **{String}**
* `returns` **{any}**

**Example**

```js
app.option({a: {b: 'c'}});

// {{option "a"}}   => '{b: 'c'}'
// {{option "a.b"}} => 'c'
```

### [{{enabled}}](index.js#L168)

Return true if the value of `prop` on `app.options` is strictly `true.

**Params**

* `prop` **{String}**
* `returns` **{Boolean}**

**Example**

```js
app.option('foo', false);
app.option('bar', true);
app.enable('baz'); //<= convenience method for setting an option to true

// {{enabled "foo"}} => false
// {{enabled "bar"}} => true
// {{enabled "baz"}} => true
```

### [{{disabled}}](index.js#L193)

Return the given value of `prop` from `this.options`.

**Params**

* `prop` **{String}**
* `returns` **{any}**

**Example**

```js
app.option('foo', false);
app.option('bar', true);
app.disable('baz'); //<= convenience method for setting an option to false

// {{disabled "foo"}} => true
// {{disabled "bar"}} => false
// {{disabled "baz"}} => false
```

### [{{matchView}}](index.js#L215)

Returns a function for matching a view in subexpressions. The returned function takes a

**Params**

* `prop` **{String}**
* `returns` **{any}**

**Example**

```handlebars
{{#eachItems "posts" filter=(matchView "!index")}}
  {{stem}}
{{/eachItems}}
```

### [{{items}}](index.js#L235)

Returns an array of items from the views in collection `name`.

**Params**

* `name` **{String|Object|Array}**: Collection name, or collection/list instance, or array of list items.
* `options` **{Object}**
* `returns` **{Array}**

**Example**

```handlebars
{{#items "posts"}}
  {{#each .}}
    <!-- using the "titleize" helper from handlebars-helpers -->
    {{titleize data.title}}
  {{/each}}
{{/items}}
```

### [{{eachItems}}](index.js#L291)

Block helper that iterates over the items in collection `name` and exposes each item in the collection as "this" inside the block.

**Hash options**:

* `sortBy`: function or property path to sort the collection by. Dot-notation may be used for getting nested properties.
* `filter`: function, glob pattern, or filepath for filtering items in the collection.

**Params**

* `name` **{String}**: (required) Collection name
* `locals` **{Object}**: (optional)
* `options` **{Object}**: Handlebars options
* `returns` **{Array}**

**Example**

```js
// built-in "pages" collection
app.pages('templates/pages/*.hbs');
// {{#eachItems "pages" filter="!index"}}
//   {{log stem}}
// {{/eachItems}}

// custom "posts" collection
app.create('posts'); //<= create the collection first
app.posts('templates/posts/*.hbs');
// {{#eachItems "posts" sortBy="data.date"}}
//   {{log stem}}
// {{/eachItems}}
```

### [{{sortItems}}](index.js#L353)

Sort and filter the items in a collection to match the order of an array of strings. Given you have three pages, `aaa.hbs`, `bbb.hbs`, and `ccc.hbs`, the following will sort the items in the order specified in front-matter:

**Params**

* `items` **{Array}**: (required) Array of items from a collection
* `locals` **{Object}**: (optional)
* `options` **{Object}**: Handlebars options
* `returns` **{Array}**

**Example**

```handlebars
---
order: ['bbb', 'ccc', 'aaa']
---
<!-- use the "items" helper to get "pages" -->
{{#each (sortItems (items "pages") order) as |item|}}
  {{item.basename}}
{{/each}}

<!-- or, use the built-in "pages" helper to expose "items" -->
{{#pages}}
  {{#each (sortItems items order) as |item|}}
    {{item.basename}}
  {{/each}}
{{/pages}}
```

### [{{link-to}}](index.js#L373)

Returns a relative path from the view being rendered to destination path of the specified view.

**Params**

* `path` **{String}**
* `collection` **{String}**: (optional) Collection name
* `lookups` **{Array}**: (optional) Array of property paths to use for resolving views.
* `returns` **{String}**: Relative path to the specified view.

**Example**

```handlebars
<!-- link to "index" (resolves the first view with "index" in the path) -->
{{link-to "index"}}
<!-- link to "index" -->
{{link-to "index" "posts"}}
```

### [{{render}}](index.js#L388)

Render the given view.

**Params**

* `view` **{Object|String}**: View object or the name of the view to render.
* `returns` **{String}**

**Example**

```handlebars
{{render "foo.hbs"}}
```

### [{{assets}}](index.js#L438)

Returns the relative path to the `assets` directory defined on `app.options` or the context. Alias for the [asset](#asset) helper, to provide a semantic alternative depending on usage.

**Params**

* `filepath` **{String}**: (optional) Filepath to append to the assets path.
* `returns` **{String}**

**Example**

```handlebars
<link rel="stylesheet" href="{{assets 'css/styles.css'}}">
<link rel="stylesheet" href="{{assets}}/css/styles.css">
```

### [{{asset}}](index.js#L458)

Returns the relative path to `filename` from the `assets` directory defined on `app.options` or the context. Alias for the [assets](#assets) helper, to provide a semantic alternative depending on usage.

**Params**

* `filepath` **{String}**: (optional) Filepath to append to the asset path.
* `returns` **{String}**

**Example**

```handlebars
<link rel="stylesheet" href="{{asset 'css/styles.css'}}">
<link rel="stylesheet" href="{{asset}}/css/styles.css">
```

### [{{root}}](index.js#L476)

Returns the relative path to `filename` from either the `root` or `dest` directory defined on `app.options` or the context.

**Params**

* `filepath` **{String}**: (optional) Filepath to append to the root path.
* `returns` **{String}**

**Example**

```handlebars
<a href="{{root 'sitemap.xml'}}"></a>
<a href="{{root}}/sitemap.xml"></a>
```

## About

### Related projects

* [handlebars-helpers](https://www.npmjs.com/package/handlebars-helpers): More than 130 Handlebars helpers in ~20 categories. Helpers can be used with Assemble, Generate… [more](https://github.com/assemble/handlebars-helpers) | [homepage](https://github.com/assemble/handlebars-helpers "More than 130 Handlebars helpers in ~20 categories. Helpers can be used with Assemble, Generate, Verb, Ghost, gulp-handlebars, grunt-handlebars, consolidate, or any node.js/Handlebars project.")
* [helper-link-to](https://www.npmjs.com/package/helper-link-to): Templates helper that returns a link path from the current view to the another view. | [homepage](https://github.com/helpers/helper-link-to "Templates helper that returns a link path from the current view to the another view.")
* [template-helpers](https://www.npmjs.com/package/template-helpers): Generic JavaScript helpers that can be used with any template engine. Handlebars, Lo-Dash, Underscore, or… [more](https://github.com/jonschlinkert/template-helpers) | [homepage](https://github.com/jonschlinkert/template-helpers "Generic JavaScript helpers that can be used with any template engine. Handlebars, Lo-Dash, Underscore, or any engine that supports helper functions.")

### Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

Please read the [contributing guide](.github/contributing.md) for advice on opening issues, pull requests, and coding standards.

### Building docs

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

### Running tests

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

### Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](https://twitter.com/jonschlinkert)

### License

Copyright © 2017, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.4.2, on February 24, 2017._