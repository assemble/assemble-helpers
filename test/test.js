'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var series = require('async-each-series');
var assemble = require('assemble');
var helpers = require('..');
var app;

var cwd = path.join.bind(path, __dirname);
var fixtures = path.join.bind(path, cwd('fixtures'));

function renderAssert(view, expected, locals, cb) {
  if (typeof locals === 'function') {
    cb = locals;
    locals = {};
  }

  app.render(view, locals, function(err, res) {
    if (err) {
      cb(err);
      return;
    }
    assert.equal(res.content.trim(), expected);
    cb();
  });
}

function assertEach(views, expected, cb) {
  var idx = -1;
  series(views, function(view, next) {
    renderAssert(view, expected[++idx], next);
  }, cb);
}

describe('assemble-helpers >', function() {
  beforeEach(function() {
    app = assemble();
    app.use(helpers());
    app.pages(fixtures('*.hbs'));
  });

  describe('helpers', function() {
    it('should export a function', function() {
      assert.equal(typeof helpers, 'function');
    });

    it('should register helpers', function() {
      assert.equal(typeof app._.helpers.async.render, 'function');
      assert.equal(typeof app._.helpers.sync.asset, 'function');
      assert.equal(typeof app._.helpers.sync.assets, 'function');
      assert.equal(typeof app._.helpers.sync.config, 'function');
      assert.equal(typeof app._.helpers.sync.disabled, 'function');
      assert.equal(typeof app._.helpers.sync.eachItems, 'function');
      assert.equal(typeof app._.helpers.sync.enabled, 'function');
      assert.equal(typeof app._.helpers.sync.items, 'function');
      assert.equal(typeof app._.helpers.sync.linkTo, 'function');
      assert.equal(typeof app._.helpers.sync.matchView, 'function');
      assert.equal(typeof app._.helpers.sync.option, 'function');
      assert.equal(typeof app._.helpers.sync.root, 'function');
      assert.equal(typeof app._.helpers.sync.sortItems, 'function');
      assert.equal(typeof app._.helpers.sync['link-to'], 'function');
    });
  });

  describe('content:', function() {
    it('should return the given string', function(cb) {
      app.pages('bar.hbs', {content: '{{content "foo"}}'});
      renderAssert('bar.hbs', 'foo', cb);
    });

    it('should return the contents from a view', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is foo'});
      app.pages('bar.hbs', {content: '{{content (page "foo.hbs")}}'});
      renderAssert('bar.hbs', 'this is foo', cb);
    });
  });

  describe('find:', function() {
    it('should find a view from any view collection by view.stem', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is foo'});
      app.pages('bar.hbs', {content: '{{content (find "foo")}}'});
      renderAssert('bar.hbs', 'this is foo', cb);
    });

    it('should find a view from any view collection by view.basename', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is foo'});
      app.pages('bar.hbs', {content: '{{content (find "foo.hbs")}}'});
      renderAssert('bar.hbs', 'this is foo', cb);
    });

    it('should find a view from any view collection by view.path', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is foo'});
      app.pages('bar.hbs', {content: '{{content (find "a/b/c/foo.hbs")}}'});
      renderAssert('bar.hbs', 'this is foo', cb);
    });
  });

  describe('getView:', function() {
    it('should get a view from the given view collection by view.stem', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is foo'});
      app.pages('bar.hbs', {content: '{{content (getView "pages" "foo")}}'});
      renderAssert('bar.hbs', 'this is foo', cb);
    });

    it('should get a view from the given view collection by view.basename', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is foo'});
      app.pages('bar.hbs', {content: '{{content (getView "pages" "foo.hbs")}}'});
      renderAssert('bar.hbs', 'this is foo', cb);
    });

    it('should get a view from the given view collection by view.path', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is foo'});
      app.pages('bar.hbs', {content: '{{content (getView "pages" "a/b/c/foo.hbs")}}'});
      renderAssert('bar.hbs', 'this is foo', cb);
    });
  });

  describe('render:', function() {
    it('should render templates in contents of the given view object', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is {{name}}'});
      app.pages('bar.hbs', {content: '{{render (find "foo.hbs")}}'});
      renderAssert('bar.hbs', 'this is foo', {name: 'foo'}, cb);
    });

    it('should get a view and render its contents', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is {{name}}'});
      app.pages('bar.hbs', {content: '{{render "foo.hbs"}}'});
      renderAssert('bar.hbs', 'this is foo', {name: 'foo'}, cb);
    });

    it('should error when a view is not resolved', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is {{name}}'});
      app.pages('bar.hbs', {content: '{{render "blah.hbs"}}'});
      renderAssert('bar.hbs', 'this is foo', function(err) {
        assert(err);
        assert.equal(err.message, 'render helper cannot find view: "blah.hbs"');
        cb();
      });
    });
  });

  describe('config:', function() {
    it('should get a value from app.options', function(cb) {
      app.option('name', 'foo');
      app.pages('bar.hbs', {content: '{{config "name"}}'});
      renderAssert('bar.hbs', 'foo', cb);
    });

    it('should get a value from app.data', function(cb) {
      app.data('name', 'foo');
      app.pages('bar.hbs', {content: '{{config "name"}}'});
      renderAssert('bar.hbs', 'foo', cb);
    });

    it('should prefer values from app.cache.data over app.options', function(cb) {
      app.option('name', 'foo');
      app.data('name', 'bar');
      app.pages('bar.hbs', {content: '{{config "name"}}'});
      renderAssert('bar.hbs', 'bar', cb);
    });

    it('should prefer locals over other values', function(cb) {
      app.option('name', 'foo');
      app.data('name', 'bar');
      app.data('locals', {name: 'zzz'});
      app.pages('bar.hbs', {content: '{{config locals "name"}}'});
      renderAssert('bar.hbs', 'zzz', cb);
    });

    it('should return an empty string if the property does not exist', function(cb) {
      app.pages('bar.hbs', {content: '{{config "name"}}'});
      renderAssert('bar.hbs', '', cb);
    });

    it('should throw an error when property is not a string', function(cb) {
      app.pages('bar.hbs', {content: '{{config}}'});
      renderAssert('bar.hbs', 'foo', function(err) {
        assert(err);
        assert.equal(err.message, 'helper {{config}} expected "prop" to be a string');
        cb();
      });
    });
  });

  describe('option:', function() {
    it('should get an option from app.options', function(cb) {
      app.option('name', 'foo');
      app.pages('bar.hbs', {content: '{{option "name"}}'});
      renderAssert('bar.hbs', 'foo', cb);
    });

    it('should return an empty string if the option does not exist', function(cb) {
      app.pages('bar.hbs', {content: '{{option "name"}}'});
      renderAssert('bar.hbs', '', cb);
    });

    it('should throw an error when property is not a string', function(cb) {
      app.pages('a/b/c/foo.hbs', {content: 'this is {{option}}'});
      app.pages('bar.hbs', {content: '{{render "foo.hbs"}}'});
      renderAssert('bar.hbs', 'this is foo', function(err) {
        assert(err);
        assert.equal(err.message, 'helper {{option}} expected "prop" to be a string');
        cb();
      });
    });
  });

  describe('enabled:', function() {
    it('should return true when an option is set to true', function(cb) {
      app.option('navbar', true);
      app.pages('foo.hbs', {content: '{{enabled "navbar"}}'});
      renderAssert('foo.hbs', 'true', cb);
    });

    it('should return true when an option is enabled', function(cb) {
      app.enable('navbar');
      app.pages('foo.hbs', {content: '{{enabled "navbar"}}'});
      renderAssert('foo.hbs', 'true', cb);
    });

    it('should return false when an option is false', function(cb) {
      app.option('navbar', false);
      app.pages('foo.hbs', {content: '{{enabled "navbar"}}'});
      renderAssert('foo.hbs', 'false', cb);
    });

    it('should return false when an option is disabled', function(cb) {
      app.disable('navbar');
      app.pages('foo.hbs', {content: '{{enabled "navbar"}}'});
      renderAssert('foo.hbs', 'false', cb);
    });

    it('should throw an error when property is not a string', function(cb) {
      app.pages('foo.hbs', {content: 'this is {{enabled}}'});
      renderAssert('foo.hbs', 'this is foo', function(err) {
        assert(err);
        assert.equal(err.message, 'helper {{enabled}} expected "prop" to be a string');
        cb();
      });
    });
  });

  describe('disabled:', function() {
    it('should return false when an option is set to true', function(cb) {
      app.option('navbar', true);
      app.pages('foo.hbs', {content: '{{disabled "navbar"}}'});
      renderAssert('foo.hbs', 'false', cb);
    });

    it('should return false when an option is enabled', function(cb) {
      app.enable('navbar');
      app.pages('foo.hbs', {content: '{{disabled "navbar"}}'});
      renderAssert('foo.hbs', 'false', cb);
    });

    it('should return true when an option is false', function(cb) {
      app.option('navbar', false);
      app.pages('foo.hbs', {content: '{{disabled "navbar"}}'});
      renderAssert('foo.hbs', 'true', cb);
    });

    it('should return true when an option is disabled', function(cb) {
      app.disable('navbar');
      app.pages('foo.hbs', {content: '{{disabled "navbar"}}'});
      renderAssert('foo.hbs', 'true', cb);
    });

    it('should throw an error when property is not a string', function(cb) {
      app.pages('bar.hbs', {content: '{{disabled}}'});
      renderAssert('bar.hbs', '', function(err) {
        assert(err);
        assert.equal(err.message, 'helper {{disabled}} expected "prop" to be a string');
        cb();
      });
    });
  });

  describe('items:', function() {
    it('should render a block with items from the given collection', function(cb) {
      app.create('posts');
      app.posts(fixtures('items/*.hbs'));
      renderAssert('items/index.hbs', 'aaa\nbbb\nccc\nindex', cb);
    });

    it('should render the inverse block when no items exist', function(cb) {
      app.create('docs');
      app.create('posts');
      app.posts(fixtures('items-inverse/index.hbs'));
      renderAssert('items-inverse/index.hbs', 'No docs yet.', cb);
    });

    it('should render inline with items from the given collection', function(cb) {
      app.create('posts');
      app.posts(fixtures('items-inline/*.hbs'));
      renderAssert('items-inline/index.hbs', 'aaa\nbbb\nccc\nindex', cb);
    });

    it('should render the inverse each block when no items exist', function(cb) {
      app.create('docs');
      app.create('posts');
      app.posts(fixtures('items-inverse-inline/index.hbs'));
      renderAssert('items-inverse-inline/index.hbs', 'No docs yet.', cb);
    });
  });

  describe('sortItems:', function() {
    it('should sort items in the given `order`', function(cb) {
      renderAssert('index.hbs', 'bbb\nccc\naaa', {order: ['bbb', 'ccc', 'aaa']}, cb);
    });
  });

  describe('each - sortItems:', function() {
    it('should render items from the given collection', function(cb) {
      app.create('posts');
      app.posts(fixtures('each-sortItems/*.hbs'));
      renderAssert('each-sortItems/index.hbs', 'bbb.hbs\nccc.hbs\naaa.hbs', cb);
    });
  });

  describe('eachItems:', function() {
    it('should render items from the given collection', function(cb) {
      app.create('posts');
      app.posts(fixtures('each-items/*.hbs'));
      renderAssert('each-items/index.hbs', 'aaa\nbbb\nccc\nindex', cb);
    });

    it('should sort items based on value passed to "sortBy" hash', function(cb) {
      app.create('posts');
      app.posts(fixtures('each-items-sortBy/*.hbs'));
      renderAssert('each-items-sortBy/index.hbs', 'bbb\nccc\naaa\nindex', cb);
    });

    it('should use blockParams for items', function(cb) {
      app.create('posts');
      app.posts(fixtures('each-items-as/*.hbs'));
      renderAssert('each-items-as/index.hbs', 'bbb\nccc\naaa', cb);
    });

    it('should filter items based on function passed to "filter" hash', function(cb) {
      app.create('posts');
      app.posts(fixtures('each-items-filter-function/*.hbs'));
      renderAssert('each-items-filter-function/index.hbs', 'aaa\nbbb\nccc', cb);
    });

    it('should filter items based on string passed to "filter" hash', function(cb) {
      app.create('posts');
      app.posts(fixtures('each-items-filter-string/*.hbs'));
      renderAssert('each-items-filter-string/index.hbs', 'aaa\nbbb\nccc', cb);
    });
  });

  describe('assets', function() {
    it('should render the relative path to options.assets from the current view', function(cb) {
      app.option('assets', cwd('assets'));
      app.create('posts');

      app.post(cwd('a/one.hbs'), {content: '{{assets}}/css/foo.css'});
      app.post(cwd('a/b/c/two.hbs'), {content: '{{assets}}/css/foo.css'});
      app.post(cwd('a/b/three.hbs'), {content: '{{assets}}/css/foo.css'});
      app.post(cwd('four.hbs'), {content: '{{assets}}/css/foo.css'});
      app.post(cwd('posts/index.hbs'), {content: '{{assets}}/css/foo.css'});

      var keys = Object.keys(app.views.posts);
      var expected = ['../assets/css/foo.css', '../../../assets/css/foo.css', '../../assets/css/foo.css', 'assets/css/foo.css', '../assets/css/foo.css'];
      assertEach(keys, expected, cb);
    });
  });

  describe('asset', function() {
    it('should render the relative path from a view to the given asset path', function(cb) {
      app.option('assets', cwd('assets'));
      app.create('posts');

      app.post(cwd('a/one.hbs'), {content: '{{asset "css/foo.css"}}'});
      app.post(cwd('a/b/c/two.hbs'), {content: '{{asset "css/foo.css"}}'});
      app.post(cwd('a/b/three.hbs'), {content: '{{asset "css/foo.css"}}'});
      app.post(cwd('four.hbs'), {content: '{{asset "css/foo.css"}}'});
      app.post(cwd('posts/index.hbs'), {content: '{{asset "css/foo.css"}}'});

      var keys = Object.keys(app.views.posts);
      var expected = ['../assets/css/foo.css', '../../../assets/css/foo.css', '../../assets/css/foo.css', 'assets/css/foo.css', '../assets/css/foo.css'];
      assertEach(keys, expected, cb);
    });
  });
});
