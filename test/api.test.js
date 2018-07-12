'use strict';

const proc = require('process');
const test = require('mukla');
const api = require('../src/api');
const { createReporter } = require('../src/utils');

proc.env.ASIA_CLI = true;

const parsedArgv = { reporter: './src/reporters/noop.js' };
const reporter = createReporter({
  parsedArgv,
});

test('asia should throw if title is not a string', (done) => {
  const asia = api();
  function fixture() {
    asia(123);
  }

  test.throws(fixture, /expect title/);
  done();
});

test('asia should throw if testFn is not a function', (done) => {
  const asia = api();
  function fixture() {
    asia('foo bar baz');
  }

  test.throws(fixture, /expect testFn/);
  done();
});

test('asia.run should run the tests in parallel', async (done) => {
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

  proc.nextTick(async () => {
    const { stats } = await asia.run();

    test.strictEqual(stats.count, 3);
    test.strictEqual(stats.pass, 1);
    test.strictEqual(stats.fail, 1);
    test.strictEqual(stats.skip, 1);
    test.strictEqual(count, 2);
    done();
  });
});

test('asia.run should run tests in series', async (done) => {
  const asia = api({ concurrency: 1, reporter });
  const arr = [];

  asia('foo bar', () => {
    arr.push(1);
  });
  asia('second', () => {
    arr.push(2);
  });

  proc.nextTick(async () => {
    await asia.run();
    test.strictEqual(arr.length, 2);
    test.strictEqual(arr[0], 1);
    test.strictEqual(arr[1], 2);
    done();
  });
});
