'use strict';

const proc = require('process');
const assert = require('assert');
const parallel = require('p-map');
const pReflect = require('p-reflect');
const sequence = require('p-map-series');
const cleanup = require('clean-stacktrace');

/* eslint-disable promise/prefer-await-to-then */

/* istanbul ignore next */
assert.nextTick = (fn) => {
  const promise = new Promise((resolve) => {
    proc.nextTick(() => {
      resolve(fn());
    });
  });

  return promise;
};

function createError(msg) {
  const err = new Error(msg);
  err.name = 'AsiaError';
  return err;
}

module.exports = ({ parsedArgv, meta = {}, reporter } = {}) => {
  const { stats, tests } = meta;
  function asia(title, testFn, options) {
    if (typeof title !== 'string') {
      throw createError('expect title `test(string, function)`');
    }
    if (typeof testFn !== 'function') {
      throw createError('expect testFn `test(string, function)`');
    }

    const { skip = false, todo = false } = Object.assign({}, options);

    stats.count += 1;
    // stats.skip += skip ? 1 : 0;
    // stats.todo += todo ? 1 : 0;

    const test = {
      isPending: true,
      isRejected: false,
      isFulfilled: false,
      index: stats.count,
      fn: testFn,
      title,
      pass: false,
      fail: false,
      skip,
      todo,
    };

    tests.push(test);
  }

  asia.skip = (title, fn, options) =>
    asia(title, fn, Object.assign({}, options, { skip: true }));

  asia.run = function run() {
    const flowFn = parsedArgv.serial ? sequence : parallel;

    // proc.send({ stats, before: true });
    reporter.before({ stats });
    return flowFn(tests, mapper, parsedArgv).then((results) => {
      // proc.send({ stats, results, after: true });
      reporter.after({ stats, results });
      return { stats, results };
    });
  };

  function mapper(testObject) {
    // TODO: fix, does not work correctly when in parallel
    // proc.send({ stats, test: testObject, beforeEach: true });
    reporter.beforeEach({ stats }, testObject);

    const promise = testObject.skip
      ? Promise.resolve()
      : new Promise((resolve) => {
          resolve(testObject.fn(assert));
        });

    return pReflect(promise).then((result) => {
      const test = Object.assign({}, testObject, { isPending: false }, result);

      if (test.isRejected) {
        stats.fail += 1;
        test.fail = true;

        test.reason.stack = cleanup(test.reason.stack);
        reporter.pass({ stats }, test);
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

      // proc.send({ stats, test, afterEach: true });
      reporter.afterEach({ stats }, test);
      return test;
    });
  }

  return asia;
};
