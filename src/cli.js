'use strict';

// const cp = require('child_process');
const proc = require('process');
const ansi = require('ansi-colors');
const execa = require('execa');
const parallel = require('p-map');
const sequence = require('p-map-series');
const fastGlob = require('fast-glob');
const arrayify = require('arrayify');
const utils = require('./utils');

const parsedArgv = utils.getParsedArgv(proc);
ansi.enabled = parsedArgv.colors;

const input = arrayify(
  parsedArgv._.length > 0 ? parsedArgv._ : parsedArgv.input,
);

proc.env.ASIA_CLI = true;
proc.env.ASIA_ARGV = JSON.stringify(parsedArgv);

const requires = arrayify(parsedArgv.require).reduce(
  (acc, req) => acc.concat('--require', req),
  [],
);

const isInstalled = (name) => {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(name);
  } catch (err) {
    return false;
  }
  return true;
};

// add the specific loaders before any other given `--require`s
if (!parsedArgv.cjs) {
  if (isInstalled('esm')) {
    requires.unshift('--require', 'esm');
  } else if (isInstalled('@babel/register')) {
    requires.unshift('--require', '@babel/register');
  } else if (isInstalled('babel-register')) {
    requires.unshift('--require', 'babel-register');
  }
}

/* eslint-disable promise/always-return, promise/catch-or-return */

const reporter = utils.createReporter({ parsedArgv, ansi });
const testFilesErrors = [];

fastGlob(input, { ...parsedArgv, absolute: true })
  .then((absolutePaths) => {
    reporter.start();

    const files = absolutePaths.map((filename) => async () => {
      const env = Object.assign(proc.env, { ASIA_TEST_FILE: filename });
      const opts = {
        stdio: 'inherit',
        env,
      };

      const args = requires.concat(filename);
      let cp = null;

      try {
        cp = await execa('node', args, opts);
      } catch (err) {
        err.testFilepath = filename;
        testFilesErrors.push(err);
      }

      return cp;
    });

    // const mapper = (filename) => {
    //   const env = Object.assign(proc.env, { ASIA_TEST_FILE: filename });
    //   const worker = cp
    //     .fork(filename, {
    //       env,
    //       execArgv: requires.concat(filename),
    //       stdio: 'inherit',
    //     })
    //     .on('message', (data) => onmessage({ data, filename }))
    //     .on('error', () => {
    //       console.log('woerke err');
    //     })
    //     .on('exit', (code) => {
    //       console.log('woerke exit', code);
    //     });

    //   return worker;
    // };

    return parsedArgv.serial
      ? sequence(files, (fn) => fn())
      : parallel(files, (fn) => fn(), parsedArgv);
  })
  .then(() => {
    reporter.finish();
    proc.exit(testFilesErrors.length > 0 ? 1 : 0);
  });

// function onmessage({ data, filename }) {
//   const { before, beforeEach, afterEach, after, stats, results, test } = data;
//   const meta = { proc, stats, results, filename };

//   if (data.error) {
//     reporter.error(data.reason, meta);
//     proc.exit(1);
//   }

//   if (before) {
//     reporter.before(meta);
//   }

//   if (beforeEach) {
//     reporter.beforeEach(meta, test);
//   }

//   if (afterEach) {
//     reporter.afterEach(meta, test);

//     if (test.pass) {
//       reporter.pass(meta, test);
//     }
//     if (test.fail) {
//       meta.content = fs.readFileSync(filename, 'utf-8');
//       reporter.fail(meta, test);
//     }
//   }

//   if (after) {
//     reporter.after(meta);
//   }
// }
