'use strict';

var path = require('path');
var relativeDest = require('relative-dest');
var each = require('handlebars-helper-each');
var get = require('get-value');
var utils = require('handlebars-utils');
var matchfile = require('match-file');
var isObject = require('isobject');

module.exports = function(options) {
  return function(app) {

    /**
     * Returns the stringified contents from a `view` object, or just returns
     * the value if `view` is a string.
     *
     * ```js
     * app.view('foo', {contents: 'This is contents'});
     *
     * // {{contents foo}}
     * //=> "This is contents"
     * ```
     * @name {{content}}
     * @param {String|Object} `view`
     * @return {String} Returns `view.contents` or the value if it's a string.
     * @api public
     */

    app.helper('content', function(view, options) {
      if (isObject(view) && view.isView) {
        return view.contents.toString();
      }
      if (typeof view === 'string') {
        return view;
      }
    });

    /**
     * Get the first view with the given `name` from any collection, or the
     * specified `collection`. If no collection is passed only `renderable`
     * collections will be searched ("renderable" collections are any collections
     * not specified as `partials` and `layouts`).
     *
     * ```handlebars
     * {{find "foo"}}
     * {{find "foo.hbs" }}
     * {{find "a/b/c/foo.hbs"}}
     *
     * <!-- optionally specify a collection -->
     * {{find "foo" "pages"}}
     * {{find "foo.hbs" "posts"}}
     * {{find "a/b/c/foo.hbs" "partials"}}
     * ```
     * @name {{find}}
     * @param {String} `name` The name/key (`view.stem`, `view.basename`, `view.relative` or `view.path`) of the view to find. It's good practice to use a longer path when practical.
     * @param {String} `collection` (optional)
     * @return {Object|undefined} Returns the view if found, or `undefined` if not.
     * @api public
     */

    app.helper('find', function(/*name, collection*/) {
      return this.app.find.apply(this.app, args([].slice.call(arguments)));
    });

    /**
     * Get a view from the specified `collection`.
     *
     * ```handlebars
     * {{getView "pages" "foo"}}
     * {{getView "pages" "foo.hbs" }}
     * {{getView "pages" "a/b/c/foo.hbs"}}
     * ```
     * @name {{getView}}
     * @param {String} `collection` (required)
     * @param {String} `name`
     * @return {Object}
     * @api public
     */

    app.helper('getView', function(/*collection, name*/) {
      return this.app.getView.apply(this.app, args([].slice.call(arguments)));
    });

    /**
     * Get the value of `prop` from `app.options` or the context. Dot-notation
     * may be used. Context values from `app.cache.data` will override values
     * from `app.options`, and values from locals will override all other values.
     *
     * ```js
     * app.option({a: {b: 'c'}, x: 'z'});
     * app.data({a: {b: 'd'}});
     * app.data({foo: {a: {b: 'ABC'}}});
     *
     * // {{config "x"}}     => 'z'
     * // {{config "a.b.c"}} => 'eee'
     * // {{config "a.b"}}   => '{c: 'eee'}'
     *
     * // with locals
     * // {{config foo "a.b.c"}} => 'ABC'
     * // {{config foo "a.b"}}   => '{c: 'ABC'}'
     * ```
     * @name {{config}}
     * @param {String} `prop`
     * @param {Object} `locals` (optional) Locals to merge onto the options.
     * @return {any}
     * @api public
     */

    app.helper('config', function(prop, locals, options) {
      if (typeof locals === 'string') {
        var temp = locals;
        locals = prop;
        prop = temp;
      }

      if (typeof options === 'undefined') {
        options = locals;
        locals = {};
      }

      if (typeof prop !== 'string') {
        throw new TypeError('helper {{config}} expected "prop" to be a string');
      }
      return get(createContext(this, locals, options), prop);
    });

    /**
     * Return the value of `prop` from `app.options`.
     *
     * ```js
     * app.option({a: {b: 'c'}});
     *
     * // {{option "a"}}   => '{b: 'c'}'
     * // {{option "a.b"}} => 'c'
     * ```
     * @name {{option}}
     * @param {String} `prop`
     * @return {any}
     * @api public
     */

    app.helper('option', function(prop) {
      if (typeof prop !== 'string') {
        throw new TypeError('helper {{option}} expected "prop" to be a string');
      }
      return get(this.options, prop);
    });

    /**
     * Return true if the value of `prop` on `app.options` is strictly `true.
     *
     * ```js
     * app.option('foo', false);
     * app.option('bar', true);
     * app.enable('baz'); //<= convenience method for setting an option to true
     *
     * // {{enabled "foo"}} => false
     * // {{enabled "bar"}} => true
     * // {{enabled "baz"}} => true
     * ```
     * @name {{enabled}}
     * @param {String} `prop`
     * @return {Boolean}
     * @api public
     */

    app.helper('enabled', function(prop) {
      if (typeof prop !== 'string') {
        throw new TypeError('helper {{enabled}} expected "prop" to be a string');
      }
      return get(this.options, prop) === true;
    });

    /**
     * Return the given value of `prop` from `this.options`.
     *
     * ```js
     * app.option('foo', false);
     * app.option('bar', true);
     * app.disable('baz'); //<= convenience method for setting an option to false
     *
     * // {{disabled "foo"}} => true
     * // {{disabled "bar"}} => false
     * // {{disabled "baz"}} => false
     * ```
     * @name {{disabled}}
     * @param {String} `prop`
     * @return {any}
     * @api public
     */

    app.helper('disabled', function(prop) {
      if (typeof prop !== 'string') {
        throw new TypeError('helper {{disabled}} expected "prop" to be a string');
      }
      return get(this.options, prop) === false;
    });

    /**
     * Returns a function for matching a view in subexpressions. The returned
     * function takes a
     *
     * ```handlebars
     * {{#eachItems "posts" filter=(matchView "!index")}}
     *   {{stem}}
     * {{/eachItems}}
     * ```
     * @name {{matchView}}
     * @param {String} `prop`
     * @return {any}
     * @api public
     */

    app.helper('matchView', matchView);

    /**
     * Returns an array of items from the views in collection `name`.
     *
     * ```handlebars
     * {{#items "posts"}}
     *   {{#each .}}
     *     <!-- using the "titleize" helper from handlebars-helpers -->
     *     {{titleize data.title}}
     *   {{/each}}
     * {{/items}}
     * ```
     * @name {{items}}
     * @param {String|Object|Array} `name` Collection name, or collection/list instance, or array of list items.
     * @param {Object} `options`
     * @return {Array}
     * @api public
     */

    app.helper('items', function(name, options) {
      if (isObject(name) && name.isList) {
        return name.items;
      }

      if (Array.isArray(name) && isView(name[0])) {
        return name;
      }

      var collection = isViews(name) ? name : this.app[name];

      if (typeof collection === 'undefined') {
        throw new TypeError(`helper {{items}} cannot get collection ${name}`);
      }

      var list = this.app.list({onLoad: false});
      list.addItems(collection.views);

      if (utils.isEmpty(list.items)) {
        return utils.inverse([], options, createContext(this, {}, options));
      }

      return utils.fn(list.items, options, list.items);
    });

    /**
     * Block helper that iterates over the items in collection `name` and
     * exposes each item in the collection as "this" inside the block.
     *
     * **Hash options**:
     *
     * - `sortBy`: function or property path to sort the collection by. Dot-notation may be used for getting nested properties.
     * - `filter`: function, glob pattern, or filepath for filtering items in the collection.
     *
     * ```js
     * // built-in "pages" collection
     * app.pages('templates/pages/*.hbs');
     * // {{#eachItems "pages" filter="!index"}}
     * //   {{log stem}}
     * // {{/eachItems}}
     *
     * // custom "posts" collection
     * app.create('posts'); //<= create the collection first
     * app.posts('templates/posts/*.hbs');
     * // {{#eachItems "posts" sortBy="data.date"}}
     * //   {{log stem}}
     * // {{/eachItems}}
     * ```
     * @name {{eachItems}}
     * @param {String} `name` (required) Collection name
     * @param {Object} `locals` (optional)
     * @param {Object} `options` Handlebars options
     * @return {Array}
     * @api public
     */

    app.helper('eachItems', function(name, locals, options) {
      if (typeof name !== 'string') {
        throw new TypeError('helper {{items}} expected collection "name" to be a string');
      }

      if (utils.isOptions(locals)) {
        options = locals;
        locals = {};
      }

      var opts = utils.options({}, locals, options);
      var args = [].slice.call(arguments, 1);
      var list = this.app.list({onLoad: false});

      list.addItems(this.app[name].views);

      if (opts.filter) {
        if (typeof opts.filter === 'string') {
          list = list.filter(matchView.call(this, opts.filter, options));
        } else {
          list = list.filter(opts.filter);
        }
      }

      if (opts.sortBy) {
        list = list.sortBy(opts.sortBy);
      }

      args.unshift(list.items);
      return each.apply(this, args);
    });

    /**
     * Sort and filter the items in a collection to match the order of
     * an array of strings. Given you have three pages, `aaa.hbs`, `bbb.hbs`,
     * and `ccc.hbs`, the following will sort the items in the order specified
     * in front-matter:
     *
     * ```handlebars
     * ---
     * order: ['bbb', 'ccc', 'aaa']
     * ---
     * <!-- use the "items" helper to get "pages" -->
     * {{#each (sortItems (items "pages") order) as |item|}}
     *   {{item.basename}}
     * {{/each}}
     *
     * <!-- or, use the built-in "pages" helper to expose "items" -->
     * {{#pages}}
     *   {{#each (sortItems items order) as |item|}}
     *     {{item.basename}}
     *   {{/each}}
     * {{/pages}}
     * ```
     * @name {{sortItems}}
     * @param {Array} `items` (required) Array of items from a collection
     * @param {Object} `locals` (optional)
     * @param {Object} `options` Handlebars options
     * @return {Array}
     * @api public
     */

    app.helper('sortItems', require('helper-sort-items'));

    /**
     * Returns a relative path from the view being rendered to destination
     * path of the specified view.
     *
     * ```handlebars
     * <!-- link to "index" (resolves the first view with "index" in the path) -->
     * {{link-to "index"}}
     * <!-- link to "index" -->
     * {{link-to "index" "posts"}}
     * ```
     * @name {{link-to}}
     * @param {String} `path`
     * @param {String} `collection` (optional) Collection name
     * @param {Array} `lookups` (optional) Array of property paths to use for resolving views.
     * @return {String} Relative path to the specified view.
     * @api public
     */

    app.helper('link-to', require('helper-link-to'));
    app.helper('linkTo', require('helper-link-to'));

    /**
     * Render the given view.
     *
     * ```handlebars
     * {{render "foo.hbs"}}
     * ```
     * @name {{render}}
     * @param {Object|String} `view` View object or the name of the view to render.
     * @return {String}
     * @api public
     */

    app.asyncHelper('render', function(val, locals, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = locals;
        locals = {};
      }

      var view = val;
      if (typeof val === 'string') {
        view = this.app.find(val);

        if (typeof view === 'undefined') {
          cb(new Error(`render helper cannot find view: "${val}"`));
          return;
        }
      }

      if (typeof view === 'undefined') {
        cb(new Error('expected the name of a view or a view object'));
        return;
      }

      var ctx = createContext(this, locals, options);

      this.app.render(view, ctx, function(err, res) {
        if (err) {
          err.reason = 'helper render';
          cb(err);
          return;
        }
        cb(null, res.contents.toString());
      });
    });

    /**
     * Returns the relative path to the `assets` directory defined on `app.options`
     * or the context. Alias for the [asset](#asset) helper, to provide a semantic
     * alternative depending on usage.
     *
     * ```handlebars
     * <link rel="stylesheet" href="{{assets 'css/styles.css'}}">
     * <link rel="stylesheet" href="{{assets}}/css/styles.css">
     * ```
     * @name {{assets}}
     * @param {String} `filepath` (optional) Filepath to append to the assets path.
     * @return {String}
     * @alias assets
     * @api public
     */

    app.helper('assets', pathHelper('"assets" path', function(options) {
      return options.assets;
    }));

    /**
     * Returns the relative path to `filename` from the `assets` directory
     * defined on `app.options` or the context. Alias for the [assets](#assets)
     * helper, to provide a semantic alternative depending on usage.
     *
     * ```handlebars
     * <link rel="stylesheet" href="{{asset 'css/styles.css'}}">
     * <link rel="stylesheet" href="{{asset}}/css/styles.css">
     * ```
     * @name {{asset}}
     * @param {String} `filepath` (optional) Filepath to append to the asset path.
     * @return {String}
     * @alias assets
     * @api public
     */

    app.helper('asset', pathHelper('"assets" path', function(options) {
      return options.assets;
    }));

    /**
     * Returns the relative path to `filename` from either the `root` or
     * `dest` directory defined on `app.options` or the context.
     *
     * ```handlebars
     * <a href="{{root 'sitemap.xml'}}"></a>
     * <a href="{{root}}/sitemap.xml"></a>
     * ```
     * @name {{root}}
     * @param {String} `filepath` (optional) Filepath to append to the root path.
     * @return {String}
     * @api public
     */

    app.helper('root', pathHelper('either a "dest" or "root" path', function(options) {
      return options.root || options.dest;
    }));
  };
};

function pathHelper(msg, fn) {
  return function(filename, locals, options) {
    if (isObject(filename)) {
      options = locals;
      locals = filename;
      filename = '';
    }

    var opts = utils.options(this, locals, options);
    opts = Object.assign({}, this.app.options, opts);
    var dir = fn(opts);

    if (typeof dir !== 'string') {
      var name = helperName(locals, options);
      throw new TypeError(`helper {{${name}}} expected ${msg} to be defined on the options or context`);
    }

    return relativePath(this, path.resolve(dir, filename));
  };
}

function relativePath(app, targetPath) {
  var view = app.view || app.context.view;
  var fp = view.data.path || view.path;
  var rel = relativeDest(fp, targetPath);
  return rel.slice(0, 2) === './' ? rel.slice(2) : rel;
}

function matchView(pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('expected pattern to be a string');
  }

  var opts = hash(options);
  var isNegated = false;

  if (pattern.charAt(0) === '!') {
    isNegated = true;
    pattern = pattern.slice(1);
  }

  return function(item) {
    if (isNegated) {
      return !matchfile.isMatch(pattern, item, opts);
    }
    return matchfile.isMatch(pattern, item, opts);
  };
}

function createContext(thisArg, locals, options) {
  return Object.assign({}, thisArg.options, thisArg.context, locals, hash(options));
}

function hash(options) {
  return (options && options.hash) || {};
}

function isViews(views) {
  return isObject(views) && (views.isCollection || views.isViews);
}

function helperName(locals, options) {
  return (utils.isOptions(locals) ? locals : options).name;
}

function isView(view) {
  return isObject(view) && (view.isView || view.isItem);
}

function args(arr) {
  return arr.slice(0, arr.length - 1);
}
