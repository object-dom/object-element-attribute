
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // Note: when moving children, don't rely on el.children\n\
  // being 'live' to support Polymer's broken behaviour.\n\
  // See: https://github.com/component/domify/pull/23\n\
  if (1 == el.children.length) {\n\
    return el.removeChild(el.children[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.children.length) {\n\
    fragment.appendChild(el.removeChild(el.children[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("object-dom-object-element/index.js", Function("exports, require, module",
"module.exports = require('./lib/object-element');\n\
//@ sourceURL=object-dom-object-element/index.js"
));
require.register("object-dom-object-element/lib/events.js", Function("exports, require, module",
"var slice = Array.prototype.slice;\n\
\n\
module.exports = Events;\n\
\n\
function Events() {}\n\
\n\
Events.prototype.on = function (eventname, callback) {\n\
  if (typeof this.eventsRegistry[eventname] === 'undefined') {\n\
    this.eventsRegistry[eventname] = [];\n\
  }\n\
\n\
  return this.eventsRegistry[eventname].push(callback);\n\
}\n\
\n\
Events.prototype.off = function (eventname, callback) {\n\
  var i, callbacks = this.eventsRegistry[eventname];\n\
\n\
  if (typeof callbacks === 'undefined') {\n\
    return false;\n\
  }\n\
\n\
  for (i = 0; i < callbacks.length; i++) {\n\
    if (callbacks[i] === callback) {\n\
      return callbacks.splice(i, 1);\n\
    }\n\
  }\n\
\n\
  return false;\n\
}\n\
\n\
Events.prototype.trigger = function (eventname, args) {\n\
  args = slice.call(arguments);\n\
  eventname = args.shift();\n\
\n\
  var callbacks = this.eventsRegistry[eventname];\n\
  var host = this;\n\
\n\
  if (typeof callbacks === 'undefined') {\n\
    return this;\n\
  }\n\
\n\
  callbacks.forEach(function (callback, index) {\n\
    setTimeout(function () {\n\
      callback.apply(host, args);\n\
    }, 0);\n\
  });\n\
\n\
  return this;\n\
}\n\
\n\
Events.prototype.triggerSync = function (eventname, args) {\n\
  args = slice.call(arguments);\n\
  eventname = args.shift();\n\
\n\
  var callbacks = this.eventsRegistry[eventname];\n\
  var host = this;\n\
\n\
  if (typeof callbacks === 'undefined') {\n\
    return this;\n\
  }\n\
\n\
  callbacks.forEach(function (callback, index) {\n\
    callback.apply(host, args);\n\
  });\n\
\n\
  return this;\n\
}\n\
//@ sourceURL=object-dom-object-element/lib/events.js"
));
require.register("object-dom-object-element/lib/object-element.js", Function("exports, require, module",
"var domify = require('domify');\n\
var Events = require('./events');\n\
var slice = Array.prototype.slice;\n\
var supportProto = Object.getPrototypeOf({__proto__: null}) === null;\n\
\n\
module.exports = ObjectElement;\n\
\n\
function ObjectElement(element) {\n\
  Events.apply(this, arguments);\n\
\n\
  var eventsRegistry = {};\n\
\n\
  Object.defineProperty(this, 'eventsRegistry', {\n\
    get: function () {\n\
      return eventsRegistry\n\
    }\n\
  });\n\
\n\
  this.element = element;\n\
}\n\
\n\
if (supportProto) {\n\
  ObjectElement.prototype.__proto__ = Events.prototype;\n\
} else {\n\
  ObjectElement.prototype = Object.create(Events.prototype);\n\
}\n\
\n\
ObjectElement.prototype.defineProperty = function (name, defines) {\n\
  Object.defineProperty(this, name, defines);\n\
}\n\
\n\
ObjectElement.prototype.defineProperty('OBJECT_ELEMENT', {\n\
  get: function () {\n\
    return 1;\n\
  }\n\
});\n\
\n\
/**\n\
 * Shortcut to .element.id\n\
 */\n\
ObjectElement.prototype.defineProperty('id', {\n\
  get: function () {\n\
    return this.element.id;\n\
  },\n\
\n\
  set: function (value) {\n\
    this.element.id = value;\n\
  }\n\
});\n\
\n\
/**\n\
 * Get or set textContent of the element\n\
 */\n\
ObjectElement.prototype.defineProperty('text', {\n\
  get: function () {\n\
    return this.element.textContent;\n\
  },\n\
\n\
  set: function (value) {\n\
    this.element.textContent = value;\n\
  }\n\
});\n\
\n\
/**\n\
 * Get or set innerHTML of the element\n\
 */\n\
ObjectElement.prototype.defineProperty('html', {\n\
  get: function () {\n\
    return this.element.innerHTML;\n\
  },\n\
\n\
  set: function (htmlString) {\n\
    this.element.innerHTML = '';\n\
    this.element.appendChild(domify(htmlString));\n\
  }\n\
});\n\
\n\
/**\n\
 * Call a function on this element\n\
 * @param  {Function callback}\n\
 * @return {Null}\n\
 */\n\
ObjectElement.prototype.tie = function (callback) {\n\
  callback.call(this, this.element);\n\
}\n\
//@ sourceURL=object-dom-object-element/lib/object-element.js"
));
require.register("shallker-color-console/component.js", Function("exports, require, module",
"module.exports = require('./lib/browser-console');\n\
//@ sourceURL=shallker-color-console/component.js"
));
require.register("shallker-color-console/lib/browser-console.js", Function("exports, require, module",
"/**\n\
 * Print colorful console text in browser\n\
 */\n\
exports.black = function (text) {\n\
  console.log('%c' + text, 'color: black;');\n\
}\n\
\n\
exports.red = function (text) {\n\
  console.log('%c' + text, 'color: red;');\n\
}\n\
\n\
exports.green = function (text) {\n\
  console.log('%c' + text, 'color: green;');\n\
}\n\
\n\
exports.yellow = function (text) {\n\
  console.log('%c' + text, 'color: yellow;');\n\
}\n\
\n\
exports.blue = function (text) {\n\
  console.log('%c' + text, 'color: blue;');\n\
}\n\
\n\
exports.magenta = function (text) {\n\
  console.log('%c' + text, 'color: magenta;');\n\
}\n\
\n\
exports.cyan = function (text) {\n\
  console.log('%c' + text, 'color: cyan;');\n\
}\n\
\n\
exports.white = function (text) {\n\
  console.log('%c' + text, 'color: white;');\n\
}\n\
\n\
exports.grey = function (text) {\n\
  console.log('%c' + text, 'color: grey;');\n\
}\n\
//@ sourceURL=shallker-color-console/lib/browser-console.js"
));
require.register("shallker-simple-test/component.js", Function("exports, require, module",
"module.exports = require('./lib/simple-test');\n\
//@ sourceURL=shallker-simple-test/component.js"
));
require.register("shallker-simple-test/lib/simple-test.js", Function("exports, require, module",
"var yellow = require('color-console').yellow;\n\
var green = require('color-console').green;\n\
var grey = require('color-console').grey;\n\
var red = require('color-console').red;\n\
\n\
function success(name) {\n\
  green(name + ' ... ok');\n\
}\n\
\n\
function fail(name) {\n\
  red(name + ' ... not ok');\n\
}\n\
\n\
var test = function (name, fn) {\n\
  if (~fn.toString().indexOf('(done')) return test.async(name, fn);\n\
\n\
  try {\n\
    fn();\n\
    success(name);\n\
  } catch (e) {\n\
    fail(name);\n\
    if (e === null) e = {stack: ''};\n\
    if (typeof e === 'undefined') e = {stack: ''};\n\
    if (typeof e === 'string') e = {stack: e};\n\
    grey(e.stack);\n\
  }\n\
}\n\
\n\
test.async = function (name, fn) {\n\
  var wait = 1000;\n\
\n\
  function done() {\n\
    clearTimeout(timeout);\n\
    success(name);\n\
  }\n\
\n\
  try {\n\
    fn(done);\n\
  } catch (e) {\n\
    clearTimeout(timeout);\n\
    fail(name);\n\
    grey(e.stack);\n\
  }\n\
\n\
  var timeout = setTimeout(function () {\n\
    yellow(name + ' ... exceed ' + wait + ' milliseconds');\n\
  }, wait);\n\
}\n\
\n\
exports = module.exports = test;\n\
\n\
exports.equal = function (a, b) {\n\
  if (a !== b) throw new Error(a + ' not equal ' + b);\n\
}\n\
\n\
/**\n\
 * Alias of equal\n\
 */\n\
exports.eq = exports.equal;\n\
\n\
exports.notEqual = function (a, b) {\n\
  if (a === b) throw new Error(a + ' equal ' + b);\n\
}\n\
\n\
/**\n\
 * Alias of notEqual\n\
 */\n\
exports.notEq = exports.notEqual;\n\
\n\
exports.ok = function (result) {\n\
  if (!result) throw new Error(result + ' is not ok');\n\
}\n\
\n\
exports.notOk = function (result) {\n\
  if (result) throw new Error(result + ' is ok');\n\
}\n\
\n\
exports.throws = function (fn) {\n\
  try {\n\
    fn();\n\
  } catch (e) {\n\
    return 'complete';\n\
  }\n\
\n\
  throw new Error(fn.toString() + ' did not throw');\n\
}\n\
\n\
exports.notThrows = function (fn) {\n\
  try {\n\
    fn();\n\
  } catch (e) {\n\
    throw new Error(fn.toString() + ' throwed');\n\
  }\n\
}\n\
//@ sourceURL=shallker-simple-test/lib/simple-test.js"
));
require.register("shallker-dom-helper/index.js", Function("exports, require, module",
"module.exports = require('./lib/dom-helper');\n\
//@ sourceURL=shallker-dom-helper/index.js"
));
require.register("shallker-dom-helper/lib/dom-helper.js", Function("exports, require, module",
"var DOM = {};\n\
\n\
DOM.create = function (tag, id, className) {\n\
  var element = document.createElement(tag);\n\
\n\
  if (id) {\n\
    element.id = id;\n\
  }\n\
\n\
  if (className) {\n\
    element.className = className;\n\
  }\n\
\n\
  return element;\n\
}\n\
\n\
DOM.insert = function (tag, id, className) {\n\
  return this.appends(this.create(tag, id, className));\n\
}\n\
\n\
DOM.insertDiv = function (id, className) {\n\
  return this.appends(this.create('div', id, className));\n\
}\n\
\n\
DOM.appends = function (element) {\n\
  return document.body.appendChild(element);\n\
}\n\
\n\
DOM.append = function (element1, element2, element3) {\n\
  var elements = [].slice.call(arguments);\n\
\n\
  for (var i = 0; i < elements.length; i++) {\n\
    this.appends(elements[i]);\n\
  }\n\
}\n\
\n\
DOM.removes = function (element) {\n\
  return element.parentNode.removeChild(element);\n\
}\n\
\n\
DOM.remove = function (element1, element2, element3) {\n\
  var elements = [].slice.call(arguments);\n\
\n\
  for (var i = 0; i < elements.length; i++) {\n\
    this.removes(elements[i]);\n\
  }\n\
}\n\
\n\
module.exports = DOM;\n\
//@ sourceURL=shallker-dom-helper/lib/dom-helper.js"
));
require.register("object-element-attribute/index.js", Function("exports, require, module",
"module.exports = require('./lib/object-element-attribute');\n\
//@ sourceURL=object-element-attribute/index.js"
));
require.register("object-element-attribute/lib/object-element-attribute.js", Function("exports, require, module",
"var ObjectElement = require('object-element');\n\
\n\
ObjectElement.prototype.hasAttribute = function (name) {\n\
  return this.element.hasAttribute(name);\n\
}\n\
\n\
ObjectElement.prototype.hasAttributes = function () {\n\
  return this.element.hasAttributes();\n\
}\n\
\n\
ObjectElement.prototype.getAttribute = function (name) {\n\
  return this.element.getAttribute(name);\n\
}\n\
\n\
ObjectElement.prototype.setAttribute = function (name, value) {\n\
  return this.element.setAttribute(name, value);\n\
}\n\
\n\
ObjectElement.prototype.removeAttribute = function (name) {\n\
  return this.element.removeAttribute(name);\n\
}\n\
//@ sourceURL=object-element-attribute/lib/object-element-attribute.js"
));






require.alias("object-dom-object-element/index.js", "object-element-attribute/deps/object-element/index.js");
require.alias("object-dom-object-element/lib/events.js", "object-element-attribute/deps/object-element/lib/events.js");
require.alias("object-dom-object-element/lib/object-element.js", "object-element-attribute/deps/object-element/lib/object-element.js");
require.alias("object-dom-object-element/index.js", "object-element-attribute/deps/object-element/index.js");
require.alias("object-dom-object-element/index.js", "object-element/index.js");
require.alias("component-domify/index.js", "object-dom-object-element/deps/domify/index.js");

require.alias("object-dom-object-element/index.js", "object-dom-object-element/index.js");
require.alias("shallker-simple-test/component.js", "object-element-attribute/deps/simple-test/component.js");
require.alias("shallker-simple-test/lib/simple-test.js", "object-element-attribute/deps/simple-test/lib/simple-test.js");
require.alias("shallker-simple-test/component.js", "object-element-attribute/deps/simple-test/index.js");
require.alias("shallker-simple-test/component.js", "simple-test/index.js");
require.alias("shallker-color-console/component.js", "shallker-simple-test/deps/color-console/component.js");
require.alias("shallker-color-console/lib/browser-console.js", "shallker-simple-test/deps/color-console/lib/browser-console.js");
require.alias("shallker-color-console/component.js", "shallker-simple-test/deps/color-console/index.js");
require.alias("shallker-color-console/component.js", "shallker-color-console/index.js");
require.alias("shallker-simple-test/component.js", "shallker-simple-test/index.js");
require.alias("shallker-dom-helper/index.js", "object-element-attribute/deps/dom-helper/index.js");
require.alias("shallker-dom-helper/lib/dom-helper.js", "object-element-attribute/deps/dom-helper/lib/dom-helper.js");
require.alias("shallker-dom-helper/index.js", "object-element-attribute/deps/dom-helper/index.js");
require.alias("shallker-dom-helper/index.js", "dom-helper/index.js");
require.alias("shallker-dom-helper/index.js", "shallker-dom-helper/index.js");
require.alias("object-element-attribute/index.js", "object-element-attribute/index.js");