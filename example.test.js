'use strict';

/**
 * Run it with `node src/cli.js example.test.js` because
 * otherwise it will run its tests from `test/` folder too.
 */

const test = require('./src/index');

test('foo bar baz', (t) => {
  t.ok(true);
});

test('some async test', async (t) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  t.ok(true);
});

test('next sync yea', (t) => {
  t.ok(true);
});
