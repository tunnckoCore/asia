'use strict';

const parallel = require('p-map');
const pReflect = require('p-reflect');
const sequence = require('p-map-series');
const cleanup = require('clean-stacktrace');
const { assert, createError, createStats } = require('./utils');

/* eslint-disable promise/prefer-await-to-then */

module.exports = (options) => {
  const { reporter, concurrency } = Object.assign({}, options);
  const stats = createStats();
  const tests = [];

  function asia(title, testFn, opts = {}) {
    if (typeof title !== 'string') {
      throw createError('expect title `test(string, function)`');
    }
    if (typeof testFn !== 'function') {
      throw createError('expect testFn `test(string, function)`');
    }

    const extra = Object.assign({ skip: false, todo: false }, opts);

    stats.count += 1;

    const test = {
      isPending: true,
      isRejected: false,
      isFulfilled: false,
      index: stats.count,
      fn: testFn,
      title,
      ...extra,
      pass: false,
      fail: false,
    };

    tests.push(test);
  }

  asia.skip = (title, fn, opts) =>
    asia(title, fn, Object.assign({}, opts, { skip: true }));

  asia.run = function run() {
    const flowFn = concurrency ? parallel : sequence;

    reporter.before({ stats });
    return flowFn(tests, mapper, { concurrency }).then((results) => {
      reporter.after({ stats, results });
      return { stats, results };
    });
  };

  function mapper(testObject) {
    // TODO: fix, does not work correctly when in parallel
    reporter.beforeEach({ stats }, testObject);

    let promise = Promise.resolve();

    if (!testObject.skip) {
      promise = new Promise((resolve) => {
        resolve(testObject.fn(assert));
      });
    }

    return pReflect(promise).then((result) => {
      const test = Object.assign({}, testObject, { isPending: false }, result);

      if (test.isRejected) {
        stats.fail += 1;
        test.fail = true;

        test.reason.stack = cleanup(test.reason.stack);
        reporter.fail({ stats }, test);
      }
      if (test.isFulfilled) {
        stats.pass += 1;
        test.pass = true;

        if (test.skip) {
          stats.pass -= 1;
          stats.skip += 1;
        }
        reporter.pass({ stats }, test);
      }

      reporter.afterEach({ stats }, test);
      return test;
    });
  }

  return asia;
};
