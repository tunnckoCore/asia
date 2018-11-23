import parallel from 'p-map';
import sequence from 'p-map-series';
import mixinDeep from 'mixin-deep';
import isObservable from 'is-observable';
import observable2promise from 'observable-to-promise';
import defaultReporter from './reporter';
import { nextTick, noopReporter, hasProcess } from './utils';

/**
 * Constructor which can be initialized with optional `options` object.
 * On the `.test` method you can access the `skip` and `todo` methods.
 * For example `.test.skip(title, fn)` and `.test.todo(title)`.
 *
 * This should be uses if you want to base something on top of the Asia API.
 * By default, the main export e.g. just `'asia'` exposes a default export function,
 * which is the `test()` method.
 *
 * @example
 * import Asia from 'asia/dist/api/es';
 *
 * // or in CommonJS (Node.js)
 * // const Asia = require('asia/dist/api/umd');
 *
 * const api = Asia({ serial: true });
 * console.log(api);
 * // => { test() {}, skip() {}, todo() {}, run() {} }
 *
 * api.test('awesome test', async () => {
 *   await Promise.resolve(123);
 * });
 *
 * api.test.skip('some skip test here', () => {
 *   console.log('this will not log');
 * });
 * api.skip('same as above', () => {
 *   console.log('this will not log');
 * });
 *
 * api.test.todo('test without implementaton');
 * api.todo('test without implementaton');
 *
 * api.run();
 *
 * @name  Asia
 * @param {object} options control tests `concurrency` or pass `serial: true` to run serially.
 * @returns {object} instance with `.test`, `.skip`, `.todo` and `.run` methods
 * @public
 */
export default function Asia(options) {
  const stats = { count: 0, anonymous: 0, pass: 0, fail: 0, skip: 0, todo: 0 };
  const opts = mixinDeep(
    {
      args: [],
      stats,
      serial:
        /* istanbul ignore next */ hasProcess && process.env.ASIA_SERIAL
          ? Boolean(process.env.ASIA_SERIAL)
          : false,
      showStack:
        /* istanbul ignore next */ hasProcess && process.env.ASIA_SHOW_STACK
          ? Boolean(process.env.ASIA_SHOW_STACK)
          : false,
    },
    options,
  );
  const tests = [];

  /**
   * Define a regular test with `title` and `fn`.
   * Both `title` and `fn` params are required, otherwise it will throw.
   * Optionally you can pass `settings` options object, to make it a "skip"
   * or a "todo" test. For example `{ skip: true }`
   *
   * @example
   * import assert from 'assert';
   * import expect from 'expect';
   * import test from 'asia';
   *
   * test('some awesome failing test', () => {
   *   expect(1).toBe(2);
   * });
   *
   * test('foo passing async test', async () => {
   *   const res = await Promise.resolve(123);
   *
   *   assert.strictEqual(res, 123);
   * });
   *
   * @name  test
   * @param {string} title
   * @param {function} fn
   * @param {object} settings
   * @public
   */
  function addTest(title, fn, settings) {
    const opt = Object.assign({ skip: false, todo: false }, settings);

    if (typeof title === 'function') {
      fn = title;
      opts.stats.anonymous += 1;
      title = `anonymous test ${opts.stats.anonymous}`;
    }

    if (typeof title !== 'string') {
      throw new TypeError('asia.test(): expect test `title` be string');
    }
    if (typeof fn !== 'function') {
      throw new TypeError('asia.test(): expect test `fn` to be function');
    }

    opts.stats.count += 1;
    const id = opts.stats.count;

    if (opt.skip) opts.stats.skip += 1;
    if (opt.todo) opts.stats.todo += 1;

    Object.assign(fn, opt, { fn, stats: opts.stats, title, id, index: id });
    tests.push(fn);
  }

  /**
   * Define test with `title` and `fn` that will never run,
   * but will be shown in the output.
   *
   * @example
   * import test from 'asia';
   *
   * test.skip('should be skipped, but printed', () => {
   *   throw Error('test function never run');
   * });
   *
   * test.skip('should throw, because expect test implementation');
   *
   * @name  test.skip
   * @param {string} title test title
   * @param {function} fn test function implementaton
   * @public
   */
  function addSkipTest(title, fn) {
    addTest(title, fn, { skip: true });
  }

  /**
   * Define a test with `title` that will be marked as "todo" test.
   * Such tests do not have test implementaton function, if `fn` is given
   * than it will throw an error.
   *
   * @example
   * import assert from 'assert';
   * import test from 'asia';
   *
   * test.todo('should be printed and okey');
   *
   * test.todo('should throw, because does not expect test fn', () => {
   *   assert.ok(true);
   * });
   *
   * @name  test.todo
   * @param {string} title title of the "todo" test
   * @param {function} fn do not pass test implementaton function
   * @public
   */
  function addTodoTest(title, fn) {
    if (typeof fn === 'function') {
      throw new TypeError('asia.test.todo(): do NOT expect test `fn`');
    }
    /* istanbul ignore next */
    const fakeFn = () => {};

    addTest(title, fakeFn, { todo: true });
  }

  addTest.test = addTest;
  addTest.skip = addSkipTest;
  addTest.todo = addTodoTest;

  return {
    test: addTest,
    skip: addSkipTest,
    todo: addTodoTest,
    run: createRun(tests, opts),
  };
}

function createRun(tests, opts) {
  /**
   * Run all tests, with optional `settings` options, merged with those
   * passed from the constructor.
   * Currently the supported options are `serial` and `concurrency`.
   *
   * @example
   * import delay from 'delay';
   * import Asia from 'asia/dist/api/es';
   *
   * const api = Asia({ serial: true });
   *
   * api.test('first test', async () => {
   *   await delay(1000);
   *   console.log('one');
   * });
   *
   * api.test('second test', () => {
   *   console.log('two');
   * });
   *
   * api.run({ concurrency: 10 });
   *
   * @name  .run
   * @param {object} settings for example, pass `serial: true` to run the tests serially
   * @return {Promise}
   * @public
   */
  return nextTick(async (settings) => {
    const options = mixinDeep({}, opts, settings);
    const flow = options.serial ? sequence : parallel;
    const results = [];
    const reporter =
      typeof options.reporter === 'function'
        ? Object.assign({}, noopReporter, options.reporter({ tests, options }))
        : defaultReporter({ tests, options });

    /* istanbul ignore next */
    if (typeof options.writeLine !== 'function') {
      options.writeLine = console.log;
    }

    await reporter.before(options);

    return flow(
      tests,
      (item) =>
        // For each test -> run 3 steps, always serially
        sequence(
          [
            // Step 1: Before each test
            () => reporter.beforeEach(item, options),

            // Step 2: Run the test function
            async () => {
              if (!item.skip && !item.todo) {
                const { value, reason } = await runTest(item, options.args);

                item.value = value;
                item.reason = reason;
                if (item.reason) {
                  item.fail = true;
                  item.pass = false;
                  item.stats.fail += 1;
                } else {
                  item.fail = false;
                  item.pass = true;
                  item.stats.pass += 1;
                }
              }
              options.stats = Object.assign({}, options.stats, item.stats);
              return item;
            },

            // Step 3: After each test function
            () => reporter.afterEach(item, options),
          ],
          (step) => step(),
        ).then((steps) => {
          // Always get the middle step result
          results.push(steps[1]);
        }),
      options,
    ).then(async () => {
      await reporter.after(options, results);
      return { options, results, tests };
    });
  });
}

async function runTest(item, args) {
  let value = null;
  let reason = null;

  try {
    const val = await item.fn.apply(null, args);
    value = isObservable(val) ? await observable2promise(val) : val;
  } catch (err) {
    reason = err;
  }

  return { value, reason };
}
