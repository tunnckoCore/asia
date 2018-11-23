import assert from 'assert';
// Fancy, huh? Use itself to test itself?!
import test from '../src/index';

import Asia from '../src/api';

test('should default export a function', () => {
  assert.strictEqual(typeof Asia, 'function');
});

test('should Asia() return object with `.test`, `.skip`, `.todo` and `.run` methods', () => {
  const api = Asia();

  assert.ok(api, 'should be object');
  assert.strictEqual(typeof api, 'object');
  assert.strictEqual(typeof api.test, 'function');
  assert.strictEqual(typeof api.skip, 'function');
  assert.strictEqual(typeof api.todo, 'function');
  assert.strictEqual(typeof api.run, 'function');
});

test('should test() method have test.skip() and test.todo() chained', () => {
  const api = Asia();

  assert.strictEqual(typeof api.test.skip, 'function');
  assert.strictEqual(typeof api.test.todo, 'function');
});
