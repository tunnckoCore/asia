'use strict';

/**
 * Run `node src/cli.js example-two.js example-one.js -R codeframe --concurrency 1`
 * to see that all files run in sequence and all tests in them in series too.
 */

const Observable = require('zen-observable');
const test = require('./src/index');

// test.afterEach(({ stats }, { title }) => {
//   console.log('after test:', title);
//   console.log('stats:', stats);
//   console.log('======');
// });

// test.after(() => {
//   console.log('after hook');
// });

test('some failing fooh', (t) => {
  sasa;
  t.ok(true);
});

test('generators', function* gen(t) {
  t.ok(yield Promise.resolve(123));
});

test('observables', (t) => {
  const observable = Observable.of(1, 2, 3, 4, 5, 6);

  return observable
    .filter(
      (n) =>
        // Only even numbers
        n % 2 === 0,
    )
    .map((v) => t.ok(v));
});

test('first', async (t) => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  t.ok(true);
});

test('second', async (t) => {
  await new Promise((resolve) => setTimeout(resolve, 550));
  t.ok(true);
});

test('third', (t) => {
  t.ok(true);
});
