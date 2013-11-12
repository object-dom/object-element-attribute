var ObjectElement = require('object-element');

ObjectElement.prototype.hasAttribute = function (name) {
  return this.element.hasAttribute(name);
}

ObjectElement.prototype.hasAttributes = function () {
  return this.element.hasAttributes();
}

ObjectElement.prototype.getAttribute = function (name) {
  return this.element.getAttribute(name);
}

ObjectElement.prototype.setAttribute = function (name, value) {
  return this.element.setAttribute(name, value);
}

ObjectElement.prototype.removeAttribute = function (name) {
  return this.element.removeAttribute(name);
}
