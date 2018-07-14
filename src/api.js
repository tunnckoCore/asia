'use strict';

const fs = require('fs');
const parallel = require('p-map');
const globrex = require('globrex');
const pReflect = require('p-reflect');
const sequence = require('p-map-series');
const cleanup = require('clean-stacktrace');
const isObservable = require('is-observable');
const observable2promise = require('observable-to-promise');
const { assert } = require('./utils');

/* eslint-disable promise/prefer-await-to-then, no-param-reassign */

let testsCache = {};

module.exports = (reporter, apiOptions = {}, snapshots = {}) => {
  const options = Object.assign({}, apiOptions);
  const stats = { count: 0, pass: 0, fail: 0, todo: 0, skip: 0 };
  const meta = { stats, ...Object.assign({}, snapshots) };
  const tests = [];

  /* istanbul ignore if */
  if (options.snapshots) {
    if (meta.filesnap && fs.existsSync(meta.filesnap)) {
      testsCache = JSON.parse(fs.readFileSync(meta.filesnap, 'utf-8'));
      testsCache.exists = true;
    }
  }

  function asia(title, testFn, opts) {
    if (typeof title !== 'string') {
      reporter.emit('error', new TypeError('expect `title` to be a string'));
      return asia;
    }
    if (typeof testFn !== 'function') {
      reporter.emit('error', new TypeError('expect `testFn` to be function'));
      return asia;
    }

    const extra = Object.assign({ skip: false, todo: false }, opts);

    stats.count += 1;

    const test = {
      ...extra,
      run: true,
      isPending: true,
      isRejected: false,
      isFulfilled: false,
      id: stats.count,
      fn: testFn,
      str: testFn.toString(),
      title,
    };

    /* istanbul ignore if */
    if (options.snapshots) {
      if (!testsCache[title]) {
        const { fn, ...rest } = test;
        testsCache[title] = rest;
      }
      if (testsCache[title].str !== test.str) {
        const cached = Object.assign({}, testsCache);
        cached[title].str = test.str;
        fs.writeFileSync(meta.filesnap, JSON.stringify(cached, null, 2));

        testsCache[title].run = true;
      }
    }

    tests.push(test);
    return asia;
  }

  asia.skip = (title, testFn) => {
    stats.skip += 1;
    return asia(title, testFn, { skip: true });
  };

  asia.todo = (title, arg) => {
    if (typeof arg === 'function') {
      reporter.emit('error', new TypeError('test.todo does expect only title'));
      return asia;
    }

    /* istanbul ignore next */
    function fakeFn() {}

    stats.todo += 1;
    return asia(title, fakeFn, { todo: true });
  };

  asia.before = (fn) => {
    reporter.on('before', fn);
    return asia;
  };
  asia.beforeEach = (fn) => {
    reporter.on('beforeEach', fn);
    return asia;
  };
  asia.afterEach = (fn) => {
    reporter.on('afterEach', fn);
    return asia;
  };
  asia.after = (fn) => {
    reporter.on('after', fn);
    return asia;
  };

  asia.run = () => {
    const flowFn = options.concurrency > 1 ? parallel : sequence;
    const mapper = createMapper({ meta, reporter, options });

    let testsToRun = tests;

    /* istanbul ignore if */
    if (options.match && typeof options.match !== 'string') {
      const error = new TypeError('options.match should be string, when given');

      reporter.emit('error', error);
      return Promise.reject(error);
    }

    if (typeof options.match === 'string' && options.match.length > 1) {
      const { regex } = globrex(options.match);
      testsToRun = tests.filter(
        (t) => t.title.includes(options.match) || regex.test(t.title),
      );
    }

    reporter.emit('before', meta);
    return flowFn(testsToRun, mapper, options).then((results) => {
      /* istanbul ignore if */
      if (options.snapshots) {
        if (meta.filesnap && !fs.existsSync(meta.filesnap)) {
          fs.writeFileSync(meta.filesnap, JSON.stringify(testsCache, null, 2));
        }
      }

      const meth = { ...meta, results };

      reporter.emit('after', meth);
      return meth;
    });
  };

  return asia;
};

function createMapper({ meta, reporter, options }) {
  return function mapper(test) {
    // TODO: fix, does not work correctly when in parallel
    reporter.emit('beforeEach', meta, test);

    const done = createDone({ meta, reporter, test, options, same: false });
    const cached = testsCache[test.title];

    let promise = Promise.resolve();

    /* istanbul ignore if */
    if (options.snapshots) {
      if (testsCache.exists === true && cached.run === false) {
        return pReflect(promise).then(
          createDone({ meta, reporter, test: cached, options, same: true }),
        );
      }
    }

    if (!test.skip && !test.todo) {
      promise = new Promise((resolve) => {
        const result = test.fn(assert);

        if (isObservable(result)) {
          resolve(observable2promise(result));
        } else {
          resolve(result);
        }
      });
    }

    return pReflect(promise).then(done);
  };
}

/* eslint-disable max-statements */
function createDone({ meta, reporter, test: t, options, same }) {
  return function ondone(result) {
    let test = null;

    /* istanbul ignore if */
    if (same) {
      test = testsCache[t.title];
    } else {
      test = Object.assign({}, t, result, { isPending: false });
    }

    const { reason, ...testObject } = test;

    /* istanbul ignore if */
    if (options.snapshots) {
      testsCache[test.title] = testObject;
      testsCache[test.title].run = false;
    }

    if (test.isRejected) {
      meta.stats.fail += 1;

      test.reason.stack = cleanup(test.reason.stack);
      reporter.emit('fail', meta, test);

      /* istanbul ignore if */
      if (options.snapshots) {
        testsCache[test.title].reason = { stack: reason && reason.stack };
      }
    }
    if (test.isFulfilled) {
      if (test.skip) {
        reporter.emit('skip', meta, test);
      } else if (test.todo) {
        reporter.emit('todo', meta, test);
      } else {
        meta.stats.pass += 1;
        reporter.emit('pass', meta, test);
      }
    }

    reporter.emit('afterEach', meta, test);
    return test;
  };
}
