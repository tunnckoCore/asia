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

const inputFiles = parsedArgv._.length > 0 ? parsedArgv._ : parsedArgv.input;
const input = arrayify(inputFiles);

const reducer = (acc, req) => acc.concat('--require', req);
const requires = arrayify(parsedArgv.require).reduce(reducer, []);

/* eslint-disable promise/no-nesting */
/* eslint-disable promise/always-return, promise/catch-or-return */

const reporter = utils.createReporter({ parsedArgv, utils, ansi });
const testFilesErrors = [];

proc.env.ASIA_CLI = true;
proc.env.ASIA_ARGV = JSON.stringify(parsedArgv);

fastGlob(input, Object.assign(parsedArgv, { absolute: true }))
  .then((absolutePaths) => {
    reporter.emit('start');

    const files = absolutePaths.map((filename) => {
      const args = requires.concat(filename);
      const env = Object.assign(proc.env, { ASIA_TEST_FILE: filename });
      const opts = { stdio: 'inherit', env };

      return execa('node', args, opts);
    });

    const onerror = (err) => {
      testFilesErrors.push(err);
    };

    return parsedArgv.concurrency
      ? sequence(files, (x) => x).catch(onerror)
      : parallel(files, (x) => x, parsedArgv).catch(onerror);
  })
  .then(() => {
    reporter.emit('finish');
    proc.exit(testFilesErrors.length > 0 ? 1 : 0);
  });
