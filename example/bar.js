import expect from 'expect';
import test from '../src/index';

test('ok yeah', () => {
  expect(1).toBe(1);
});

test.todo('some todo test');

test('one two three', async () => {
  const val = await Promise.resolve({ a: 'b' });
  expect(val).toBe(1234); // throws
});
