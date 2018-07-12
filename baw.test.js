'use strict';

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
