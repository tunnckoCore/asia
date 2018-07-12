'use strict';

const parallel = require('p-map');
const pReflect = require('p-reflect');
const sequence = require('p-map-series');
const cleanup = require('clean-stacktrace');
const isObservable = require('is-observable');
const observable2promise = require('observable-to-promise');
const { assert, createError } = require('./utils');

/* eslint-disable promise/prefer-await-to-then */

module.exports = (reporter, options = {}) => {
  const stats = { count: 0, pass: 0, fail: 0, todo: 0, skip: 0 };
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

  asia.before = (fn) => {
    reporter.on('before', fn);
  };
  asia.beforeEach = (fn) => {
    reporter.on('beforeEach', fn);
  };
  asia.afterEach = (fn) => {
    reporter.on('afterEach', fn);
  };
  asia.after = (fn) => {
    reporter.on('after', fn);
  };

  asia.run = function run() {
    const flowFn = options.concurrency ? parallel : sequence;
    const testsToRun = options.match
      ? tests.filter((test) => {
          // avoid regex-ing
          if (test.title.includes(options.match)) {
            return true;
          }

          const regex = new RegExp(options.match);
          return regex.test(test.title);
        })
      : tests;

    reporter.emit('before', { stats });
    return flowFn(testsToRun, mapper, options).then((results) => {
      reporter.emit('after', { stats, results });
      return { stats, results };
    });
  };

  function mapper(testObject) {
    // TODO: fix, does not work correctly when in parallel
    reporter.emit('beforeEach', { stats }, testObject);

    let promise = Promise.resolve();

    if (!testObject.skip) {
      promise = new Promise((resolve) => {
        const result = testObject.fn(assert);
        if (isObservable(result)) {
          resolve(observable2promise(result));
        } else {
          resolve(result);
        }
      });
    }

    return pReflect(promise).then((result) => {
      const test = Object.assign({}, testObject, { isPending: false }, result);

      if (test.isRejected) {
        stats.fail += 1;
        test.fail = true;

        test.reason.stack = cleanup(test.reason.stack);
        reporter.emit('fail', { stats }, test);
      }
      if (test.isFulfilled) {
        stats.pass += 1;
        test.pass = true;

        if (test.skip) {
          stats.pass -= 1;
          stats.skip += 1;
        }
        reporter.emit('pass', { stats }, test);
      }

      reporter.emit('afterEach', { stats }, test);
      return test;
    });
  }

  return asia;
};
