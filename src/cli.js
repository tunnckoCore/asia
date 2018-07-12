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
ansi.enabled = parsedArgv.colors;

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

const reporter = utils.createReporter({ parsedArgv, ansi });
const testFilesErrors = [];

proc.env.ASIA_ARGV = JSON.stringify(parsedArgv);
proc.env.ASIA_CLI = true;

fastGlob(input, { ...parsedArgv, absolute: true })
  .then((absolutePaths) => {
    reporter.emit('start');

    const files = absolutePaths.map((filename) => async () => {
      const env = Object.assign(proc.env, { ASIA_TEST_FILE: filename });
      const opts = { stdio: 'inherit', env };

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

    return parsedArgv.serial
      ? sequence(files, (fn) => fn())
      : parallel(files, (fn) => fn(), parsedArgv);
  })
  .then(() => {
    reporter.emit('finish');
    proc.exit(testFilesErrors.length > 0 ? 1 : 0);
  });
