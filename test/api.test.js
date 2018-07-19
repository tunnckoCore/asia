'use strict';

const Observable = require('zen-observable');
const test = require('../src');
const api = require('../src/api');

test('asia should emit TypeError if title is not a string', (t) => {
  let called = false;
  function emit(name, meta, { reason: err }) {
    t.ok(err.message.includes('expect `title`'));
    called = true;
  }

  const asia = api(emit);

  asia(123);
  t.ok(called);
});

test('asia should emit TypeError if testFn is not a function', (t) => {
  let called = false;
  function emit(name, meta, { reason: err }) {
    t.ok(err.message.includes('expect `testFn`'));
    called = true;
  }

  const asia = api(emit);

  asia('foo bar baz');
  t.ok(called);
});

test('asia.run should run the tests in parallel', async (t) => {
  const asia = api(() => {}, { snapshots: false });
  let count = 0;

  asia('yeah passing', (tAssert) => {
    tAssert.ok(true);
    count += 1;
  });

  asia.todo('test without implementation');

  asia.skip('skipping test, yeah', () => {});

  asia('some failing test', (tAssert) => {
    count += 1;
    tAssert.ok(false);
  });

  await t.nextTick(async () => {
    const { stats } = await asia.run();

    t.strictEqual(stats.count, 4);
    t.strictEqual(stats.pass, 1);
    t.strictEqual(stats.fail, 1);
    t.strictEqual(stats.skip, 1);
    t.strictEqual(stats.todo, 1);
    t.strictEqual(count, 2);
  });
});

test('asia.run should run tests in series', async (t) => {
  const asia = api(() => {}, { snapshots: false, concurrency: 1 });
  const arr = [];

  asia('foo bar', () => {
    arr.push(1);
  });
  asia('second', () => {
    arr.push(2);
  });

  await t.nextTick(async () => {
    await asia.run();
    t.strictEqual(arr.length, 2);
    t.strictEqual(arr[0], 1);
    t.strictEqual(arr[1], 2);
  });
});

test('.todo should emit TypeError if pass implementation function', (t) => {
  let called = false;
  function emit(name, meta, { reason: err }) {
    t.ok(err.message.includes('todo does expect only title'));
    called = true;
  }
  const asia = api(emit, { snapshots: false });

  asia.todo('foo bar', () => {});
  t.ok(called);
});

test.skip('should emit TypeError if options.match is not a string if given', (t) => {
  let called = false;
  function emit(name, meta, { reason: err }) {
    t.ok(err.message.includes('options.match should be string, when given'));
    called = true;
  }

  const asia = api(emit, { match: ['t*', '*e'], snapshots: false });

  asia('one', () => {});
  asia('two', () => {});
  asia('three', () => {});
  t.ok(called);
});

test('should run only tests that match given glob pattern', async (t) => {
  const asia = api(() => {}, { match: '*b*', snapshots: false });
  let count = 0;

  asia('abc', (tst) => {
    tst.ok(true);
    count += 1;
  });
  asia('adef', (tst) => {
    tst.ok(true);
    count += 1;
  });
  asia('abar', (tst) => {
    tst.ok(true);
    count += 1;
  });

  await t.nextTick(async () => {
    const { stats } = await asia.run();

    t.strictEqual(count, 2);
    t.strictEqual(stats.count, 3);
    t.strictEqual(stats.pass, 2);
  });
});

test.skip('should have hooks - before, beforeEach, afterEach, after', async (t) => {
  const calls = {};
  const asia = api(() => {}, { snapshots: false });

  asia.before(() => {
    calls.before = true;
  });
  asia.beforeEach(() => {
    t.ok(calls.before, 'the "before" should be called previously');
    calls.beforeEach = true;
  });
  asia('foo bar baz', () => {
    t.ok(calls.beforeEach, 'the "beforeEach" hook should be called previously');
    calls.test = true;
  });
  asia.afterEach(() => {
    t.ok(calls.test, 'the test should be called before the "afterEach" hook');
    calls.afterEach = true;
  });
  asia.after(() => {
    t.ok(calls.afterEach, 'the "afterEach" hook should be called previously');
    calls.after = true;
  });

  await t.nextTick(async () => {
    const { stats } = await asia.run();

    t.ok(stats.count === 1);
    t.ok(stats.pass === 1);

    t.deepEqual(calls, {
      before: true,
      beforeEach: true,
      test: true,
      afterEach: true,
      after: true,
    });
  });
});

test('should work for Observables', async (t) => {
  let called = 0;
  const asia = api(() => {}, { snapshots: false });

  asia('some test returning observable', () => {
    const observable = Observable.of(1, 2, 3, 4, 5, 6);

    return observable
      .filter(
        (n) =>
          // Only even numbers
          n % 2 === 0,
      )
      .map((v) => {
        called += 1;
        return v;
      });
  });

  await t.nextTick(async () => {
    const { stats, results } = await asia.run();

    t.strictEqual(called, 3);
    t.strictEqual(stats.pass, 1);
    t.strictEqual(stats.count, 1);
    t.deepStrictEqual(results[0].value, [2, 4, 6]);
  });
});
