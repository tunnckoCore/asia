import util from 'util';
import assert from 'assert';
import dedent from 'dedent';
import Observable from 'zen-observable';

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

test('should failing tests throw', async () => {
  const api = Asia({ reporter: () => {} });
  api.test('foo bar baz', () => {
    throw new Error('oh ah');
  });
  const { results } = await api.run();
  const [failingTest] = results;

  assert.strictEqual(failingTest.fail, true);
  assert.strictEqual(failingTest.pass, false);
  assert.strictEqual(failingTest.title, 'foo bar baz');
  assert.ok(failingTest.reason instanceof Error);
  assert.strictEqual(failingTest.reason.message, 'oh ah');
});

test('should test.todo() tests throw if test implementation given', () => {
  const api = Asia();

  assert.throws(() => api.todo('foo bar', () => {}), TypeError);
  assert.throws(() => api.todo('foo bar', () => {}), /do NOT expect test `fn`/);
});

test('should test.todo() be marked as todo: true', async () => {
  const api = Asia({ reporter: () => {} });
  api.todo('foo qux');

  const { results } = await api.run();
  assert.strictEqual(results[0].title, 'foo qux');
  assert.strictEqual(results[0].todo, true);
});

test('should test.skip() tests never run', async () => {
  const api = Asia({ reporter: () => {} });
  let called = 0;
  api.skip('example skipped test', () => {
    called += 1;
  });
  const res = await api.run();

  assert.strictEqual(res.results[0].title, 'example skipped test');
  assert.strictEqual(res.results[0].skip, true);
  assert.strictEqual(res.results[0].todo, false);
  assert.strictEqual(called, 0);
});

test('should test.skip() require test implementation', () => {
  const api = Asia();

  assert.throws(() => api.skip('foo skipped'), TypeError);
  assert.throws(() => api.test.skip('foo2'), /expect test `fn` to be function/);
});

test('should allow test() do not have a title', async () => {
  const api = Asia({ reporter: () => {} });
  let called = 0;

  api.test(() => {
    called += 1;
  });
  api.test(() => {
    called += 1;
  });
  const res = await api.run();

  assert.strictEqual(res.results[0].title, 'anonymous test 1');
  assert.strictEqual(res.results[1].title, 'anonymous test 2');
  assert.strictEqual(called, 2);
});

test('should test() throw if title not a string when given', () => {
  const api = Asia();
  assert.throws(() => api.test(1, () => {}), TypeError);
  assert.throws(() => api.test(1, () => {}), /expect test `title` be string/);
});

test('should handle returning Observables', async () => {
  const api = Asia();
  const values = [];

  api.test(function observableTest() {
    return Observable.of(1, 2, 3).map((val) => {
      values.push(val);
      return val;
    });
  });
  const { results } = await api.run({ reporter: () => {} });

  assert.deepStrictEqual(results[0].value, values);
  assert.deepStrictEqual(results[0].value, [1, 2, 3]);
  // assert.strictEqual(obsDone, true);
});

test('should run tests in series', async () => {
  const api = Asia({ reporter: () => {} });
  const order = [];

  api.test('foo', () => {
    order.push(1);
  });
  api.test('bar', () => {
    order.push(2);
  });
  api.test('qux', () => {
    order.push(3);
  });

  await api.run({ serial: true });

  assert.deepStrictEqual(order, [1, 2, 3]);
});

test('default reporter should output TAP report', async () => {
  const api = Asia({ showStack: false, serial: false });
  const output = [];

  api.test('regular test', () => {});
  api.test('failing one', () => {
    assert.strictEqual(123, ['foo']);
  });
  api.test.skip('skipped test', () => {});
  api.test.todo('some todo test');

  await api.run({ writeLine: (...args) => output.push(util.format(...args)) });

  assert.strictEqual(
    output.join('\n'),
    dedent`TAP version 13
    ok 3 - # SKIP skipped test
    not ok 4 - # TODO some todo test
    ok 1 - regular test
    not ok 2 - failing one
    # FAIL!
    #
    # At: api.test (./test/index.js:150:12)
    #
    # Message: Input A expected to strictly equal input B:
    # + expected - actual
    #
    # - 123
    # + [
    # +   'foo'
    # + ]
    #
    1..4
    # tests 4
    # pass 1
    # skip 1
    # todo 1
    # fail 1
    #
    `,
  );
});

test('should test show stack if options.showStack: true', async () => {
  const output = [];
  const writeLine = (...args) => output.push(util.format(...args));

  const api = Asia({ showStack: true, writeLine });

  api.test(() => {
    throw new Error('ouch auch');
  });

  await api.run();

  const tapOutput = output.join('\n');
  assert.strictEqual(tapOutput.includes('# FAIL!'), true);
  assert.strictEqual(tapOutput.includes('# Message: ouch auch'), true);
  assert.strictEqual(tapOutput.includes('# STACK!'), true);
});
