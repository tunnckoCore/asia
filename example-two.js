'use strict';

/**
 * Run `node src/cli.js example-two.js example-one.js -R codeframe --concurrency 1`
 * to see that all files run in sequence and all tests in them in series too.
 */

const test = require('./src/index');

test.beforeEach(({ stats }, { title }) => {
  console.log('before test:', title);
  console.log('stats:', stats);
  console.log('======');
});

test.after(() => {
  console.log('after hook');
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
