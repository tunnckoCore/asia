'use strict';

const proc = require('process');
const test = require('asia');
const api = require('../src/api');
const { createReporter } = require('../src/utils');

proc.env.ASIA_CLI = true;

const parsedArgv = { reporter: './src/reporters/noop.js' };
const reporter = createReporter({
  parsedArgv,
});

test('asia should throw if title is not a string', (t) => {
  const asia = api();
  function fixture() {
    asia(123);
  }

  t.throws(fixture, /expect title/);
});

test('asia should throw if testFn is not a function', (t) => {
  const asia = api();
  function fixture() {
    asia('foo bar baz');
  }

  t.throws(fixture, /expect testFn/);
});

test('asia.run should run the tests in parallel', async (t) => {
  const asia = api({ reporter });
  let count = 0;

  asia('yeah passing', (tAssert) => {
    tAssert.ok(true);
    count += 1;
  });
  asia.skip('skipping test, yeah', () => {});
  asia('some failing test', (tAssert) => {
    count += 1;
    tAssert.ok(false);
  });

  await t.nextTick(async () => {
    const { stats } = await asia.run();

    t.strictEqual(stats.count, 3);
    t.strictEqual(stats.pass, 1);
    t.strictEqual(stats.fail, 1);
    t.strictEqual(stats.skip, 1);
    t.strictEqual(count, 2);
  });
});

test('asia.run should run tests in series', async (t) => {
  const asia = api({ concurrency: 1, reporter });
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
