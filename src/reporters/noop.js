'use strict';

const Emitter = require('events');

module.exports = function noopReporter() {
  const reporter = new Emitter();
  reporter.name = 'noop';

  return reporter;
};
