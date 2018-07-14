'use strict';

const test = require('../src');

const {
  getReporter,
  getParsedArgv,
  createReporter,
  getRelativePath,
  getCodeInfo,
} = require('../src/utils');

test('getRelativePath returns a string without throwing', (t) => {
  t.strictEqual(typeof getRelativePath(__filename), 'string');
});

test('getCodeInfo returns not ok when cant find filename in stack', (t) => {
  const { ok } = getCodeInfo({ err: { stack: '' }, filename: 'fake-bar.js' });

  t.strictEqual(ok, false);
});

test('getCodeInfo is ok', (t) => {
  const err = new Error('woohoo fake');
  const opts = { err, filename: __filename };
  const { ok, sourceFrame, atLine } = getCodeInfo(opts);

  t.strictEqual(ok, true);
  t.strictEqual(typeof sourceFrame, 'string');
  t.strictEqual(atLine.includes(__filename), true);
});

test('getParsedArgv returns correct when have env.ASIA_ARGV passed', (t) => {
  const oldArgv = { qux: 123, bar: 'zazz' };
  const ASIA_ARGV = JSON.stringify(oldArgv);
  const parsedArgv = getParsedArgv({ env: { ASIA_ARGV } });

  t.deepEqual(parsedArgv, oldArgv);
});

test('getParsedArgv gets correct when no env given', (t) => {
  const argv = getParsedArgv({ argv: ['fake', 'fake', '--foobar=hohoho'] });

  t.strictEqual(typeof argv, 'object');
  t.strictEqual(argv.foobar, 'hohoho');
});

test('getReporter returns default "mini" reporter when no argv', (t) => {
  const reporter = createReporter();

  t.strictEqual(typeof getReporter(), 'function');
  t.strictEqual(typeof reporter, 'object');
  t.strictEqual(reporter.name, 'mini');
});

test('getReporter returns reporter when --reporter is passed', (t) => {
  // eslint-disable-next-line global-require
  const codeframe = require('../src/reporters/codeframe');
  const reporterFn = getReporter({ reporter: codeframe });

  t.strictEqual(typeof reporterFn, 'function');

  const reporter = createReporter({
    parsedArgv: { reporter: './src/reporters/codeframe.js' },
  });
  t.strictEqual(reporter.name, 'codeframe');
});
