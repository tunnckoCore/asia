'use strict';

/**
 * Run `node src/cli.js foobar.test.js example.test.js -R codeframe --serial`
 * to see that all files run in sequence and all tests in them in series too.
 */

const test = require('./src/index');

test('sasasa bar baz', async (t) => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  t.ok(true);
});

test('dadada zzzzzzz test', async (t) => {
  await new Promise((resolve) => setTimeout(resolve, 550));
  t.ok(true);
});

test('xaxaxaxa sync yea', (t) => {
  t.ok(true);
});
