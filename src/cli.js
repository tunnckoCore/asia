#!/usr/bin/env node

'use strict';

const proc = require('process');
const ansi = require('ansi-colors');
const execa = require('execa');
const parallel = require('p-map');
const sequence = require('p-map-series');
const fastGlob = require('fast-glob');
const arrayify = require('arrayify');
const utils = require('./utils');

const parsedArgv = utils.getParsedArgv(proc);
ansi.enabled = parsedArgv.color;

const input = arrayify(
  parsedArgv._.length > 0 ? parsedArgv._ : parsedArgv.input,
);

const requires = arrayify(parsedArgv.require).reduce(
  (acc, req) => acc.concat('--require', req),
  [],
);

// add the specific loaders before any other given `--require`s
if (!parsedArgv.cjs) {
  if (utils.isInstalled('esm')) {
    requires.unshift('--require', 'esm');
  } else if (utils.isInstalled('@babel/register')) {
    requires.unshift('--require', '@babel/register');
  } else if (utils.isInstalled('babel-register')) {
    requires.unshift('--require', 'babel-register');
  }
}

/* eslint-disable promise/always-return, promise/catch-or-return */

const reporter = utils.createReporter({ parsedArgv, utils, ansi });
const testFilesErrors = [];

proc.env.ASIA_ARGV = JSON.stringify(parsedArgv);
proc.env.ASIA_CLI = true;

fastGlob(input, { ...parsedArgv, absolute: true })
  .then((absolutePaths) => {
    reporter.emit('start');

    const files = absolutePaths.map((filename) => () => {
      const env = Object.assign(proc.env, { ASIA_TEST_FILE: filename });
      const opts = { stdio: 'inherit', env };

      const args = requires.concat(filename);

      return execa('node', args, opts);
    });

    /* eslint-disable promise/no-nesting, promise/prefer-await-to-callbacks */
    const onerror = (err) => {
      testFilesErrors.push(err);
    };

    return parsedArgv.concurrency
      ? sequence(files, (fn) => fn()).catch(onerror)
      : parallel(files, (fn) => fn(), parsedArgv).catch(onerror);
  })
  .then(() => {
    reporter.emit('finish');
    proc.exit(testFilesErrors.length > 0 ? 1 : 0);
  });
