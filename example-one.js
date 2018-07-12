'use strict';

/**
 * Run it with `node src/cli.js example-one.js` because
 * otherwise it will run its tests from `test/` folder too.
 */

const test = require('./src/index');

test.afterEach(({ stats }, { title }) => {
  console.log('after each:', title);
  console.log('stats:', stats);
  console.log('=====');
});

test('foo bar baz', (t) => {
  t.ok(true);
});

test('some async test', async (t) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  t.ok(true);
});

test('next sync yea', (t) => {
  t.ok(true);
});
