'use strict';

const fs = require('fs');
const parallel = require('p-map');
const pReflect = require('p-reflect');
const sequence = require('p-map-series');
const cleanup = require('clean-stacktrace');
const isObservable = require('is-observable');
const observable2promise = require('observable-to-promise');
const { assert, createError } = require('./utils');

/* eslint-disable promise/prefer-await-to-then, no-param-reassign */

let testsCache = {};

module.exports = (reporter, apiOptions = {}, snapshots = {}) => {
  const options = Object.assign({}, apiOptions);

  const shots = Object.assign({}, snapshots);
  const stats = { count: 0, pass: 0, fail: 0, todo: 0, skip: 0 };
  const meta = { stats, ...shots };
  const tests = [];

  if (options.snapshots) {
    if (meta.filesnap && fs.existsSync(meta.filesnap)) {
      testsCache = JSON.parse(fs.readFileSync(meta.filesnap, 'utf-8'));
      testsCache.exists = true;
    }
  }

  function asia(title, testFn, opts) {
    if (typeof title !== 'string') {
      throw createError('expect `title` to be a string');
    }
    if (typeof testFn !== 'function') {
      throw createError('expect `testFn` to be function');
    }

    const extra = Object.assign({ skip: false, todo: false }, opts);

    stats.count += 1;

    const str = testFn.toString();
    const test = {
      ...extra,
      run: true,
      isPending: true,
      isRejected: false,
      isFulfilled: false,
      id: stats.count,
      fn: testFn,
      title,
      str,
    };

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
  }

  asia.skip = (title, testFn, opts) => {
    stats.skip += 1;
    return asia(title, testFn, Object.assign({}, opts, { skip: true }));
  };

  asia.todo = (title, opts) => {
    if (typeof opts === 'function') {
      throw new TypeError('test.todo does expect only title');
    }

    stats.todo += 1;
    return asia(title, () => {}, Object.assign({}, opts, { todo: true }));
  };

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

  asia.run = () => {
    const flowFn = options.concurrency > 1 ? parallel : sequence;
    const mapper = createMapper({ meta, reporter, options });

    let testsToRun = tests;

    if (options.match) {
      testsToRun = tests.filter((test) => {
        // avoid regex-ing
        if (test.title.includes(options.match)) {
          return true;
        }

        const regex = new RegExp(options.match);
        return regex.test(test.title);
      });
    }

    reporter.emit('before', meta);
    return flowFn(testsToRun, mapper, options).then((results) => {
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

    if (same) {
      test = testsCache[t.title];
    } else {
      test = Object.assign({}, t, result, { isPending: false });
    }

    const { reason, ...testObject } = test;

    if (options.snapshots) {
      testsCache[test.title] = testObject;
      testsCache[test.title].run = false;
    }

    if (test.isRejected) {
      meta.stats.fail += 1;

      test.reason.stack = cleanup(test.reason.stack);
      if (options.snapshots) {
        testsCache[test.title].reason = { stack: reason && reason.stack };
      }
      reporter.emit('fail', meta, test);
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
