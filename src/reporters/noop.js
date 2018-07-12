'use strict';

module.exports = function noopReporter() {
  return {
    name: 'noop',
    error() {},
    start() {},
    finish() {},
    before() {},
    beforeEach() {},
    pass() {},
    fail() {},
    afterEach() {},
    after() {},
  };
};
