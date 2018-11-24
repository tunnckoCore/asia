import assert from 'assert';
import test from '../src/index';

test('some foo test', () => {});

test.skip('skip tests never run', () => {
  console.log('hoho');
});

test('foo second', () => {
  assert.strictEqual(1, 2);
});
