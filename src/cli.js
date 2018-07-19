#!/usr/bin/env node

'use strict';

const proc = require('process');
const cp = require('child_process');
const ansi = require('ansi-colors');
const fastGlob = require('fast-glob');
const arrayify = require('arrayify');
const utils = require('./utils');

const parsedArgv = utils.getParsedArgv(proc);
ansi.enabled = parsedArgv.color;

const inputFiles = parsedArgv._.length > 0 ? parsedArgv._ : parsedArgv.input;
const input = arrayify(inputFiles);

const reducer = (acc, req) => acc.concat('--require', req);
const requires = arrayify(parsedArgv.require).reduce(reducer, []);

/* eslint-disable promise/always-return, promise/catch-or-return */

const reporter = utils.createReporter({ parsedArgv, utils, ansi });

proc.env.ASIA_CLI = true;
proc.env.ASIA_ARGV = JSON.stringify(parsedArgv);

fastGlob(input, Object.assign(parsedArgv, { absolute: true }))
  .then((absolutePaths) => {
    reporter.emit('start');

    const promises = absolutePaths.map(
      (fp) =>
        new Promise((resolve, reject) => {
          const env = Object.assign(proc.env, { ASIA_TEST_FILE: fp });
          const worker = cp.fork(fp, { env, execArgv: requires });
          worker
            .on('message', onmessage)
            .once('error', reject)
            .once('exit', resolve);
        }),
    );

    return Promise.all(promises);
  })
  .then((exitCodes) => {
    reporter.emit('finish', exitCodes);

    if (exitCodes.filter(Boolean).length > 0) {
      proc.exit(1);
    }
  });

function onmessage({ type, meta, data }) {
  switch (type) {
    case 'error':
    case 'critical': {
      reporter.emit(type, meta, data.reason);
      break;
    }

    case 'before':
    case 'after':
    case 'beforeEach':
    case 'afterEach':
    case 'pass':
    case 'fail':
    case 'skip':
    case 'todo': {
      reporter.emit(type, meta, data);
      break;
    }

    default: {
      break;
    }
  }
}
