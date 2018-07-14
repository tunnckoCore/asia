'use strict';

/* eslint-disable global-require */

function defineProp(obj, key, get) {
  Object.defineProperty(obj, key, { get, enumerable: true });
}

const reporters = {};

defineProp(reporters, 'noop', () => require('./noop'));
defineProp(reporters, 'mini', () => require('./mini'));
defineProp(reporters, 'codeframe', () => require('./codeframe'));

module.exports = reporters;
