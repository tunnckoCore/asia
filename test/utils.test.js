'use strict';

const test = require('mukla');

const {
  getReporter,
  getParsedArgv,
  createReporter,
  getRelativePath,
  getCodeInfo,
} = require('../src/utils');

test('getRelativePath returns a string without throwing', (done) => {
  test.strictEqual(typeof getRelativePath(__filename), 'string');
  done();
});

test('getCodeInfo returns not ok when cant find filename in stack', (done) => {
  const { ok } = getCodeInfo({ err: { stack: '' }, filename: 'fake-bar.js' });

  test.strictEqual(ok, false);
  done();
});
test('getCodeInfo is ok', (done) => {
  const err = new Error('woohoo fake');
  const opts = { err, filename: __filename };
  const { ok, sourceFrame, atLine } = getCodeInfo(opts);

  test.strictEqual(ok, true);
  test.strictEqual(typeof sourceFrame, 'string');
  test.strictEqual(atLine.includes(__filename), true);
  done();
});

test('getParsedArgv returns correct when have env.ASIA_ARGV passed', (done) => {
  const oldArgv = { qux: 123, bar: 'zazz' };
  const ASIA_ARGV = JSON.stringify(oldArgv);
  const parsedArgv = getParsedArgv({ env: { ASIA_ARGV } });

  test.deepEqual(parsedArgv, oldArgv);
  done();
});

test('getParsedArgv gets correct when no env given', (done) => {
  const argv = getParsedArgv({ argv: ['fake', 'fake', '--foobar=hohoho'] });

  test.strictEqual(typeof argv, 'object');
  test.strictEqual(argv.foobar, 'hohoho');
  done();
});

test('getReporter returns default "mini" reporter when no argv', (done) => {
  const reporter = createReporter();

  test.strictEqual(typeof getReporter(), 'function');
  test.strictEqual(typeof reporter, 'object');
  test.strictEqual(reporter.name, 'mini');
  done();
});

test('getReporter returns reporter when --reporter is passed', (done) => {
  // eslint-disable-next-line global-require
  const codeframe = require('../src/reporters/codeframe');
  const reporterFn = getReporter({ reporter: codeframe });

  test.strictEqual(typeof reporterFn, 'function');

  const reporter = createReporter({
    parsedArgv: { reporter: './src/reporters/codeframe.js' },
  });
  test.strictEqual(reporter.name, 'codeframe');
  done();
});
