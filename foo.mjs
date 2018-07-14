'use strict';

import test from './src/index';

test('foo bar baz', (t) => {
  t.deepEqual([1, 2, 3], { a: 1, b: { c: 6 } });
});

test('total slow test here', async (t) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 30000);
  });
  console.log('yup very slow');
  t.ok(true);
});

test('some real fail here', (t) => {
  dadas;

  t.ok(true);
});

test('some slow yeah', async (t) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 10000);
  });
  console.log('slow zazzzz');
  t.ok(true);
});

test.skip('failing but skipped', (t) => {
  t.fail('should fail');
});

test('one more passing', (t) => {
  console.log('yup passing');

  t.ok(true);
});

test('foo qxueie', async (t) => {
  const res = await import('./src/reporters/noop');
  t.ok(res.default);
});
