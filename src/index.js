'use strict';

const fs = require('fs');
const proc = require('process');
const ansi = require('ansi-colors');
const utils = require('./utils');
const api = require('./api');

if (!proc.env.ASIA_CLI) {
  const err = new Error('run your tests through the asia cli');
  console.error('AsiaError:', `${err.name}:`, err.message);
  proc.exit(1);
}

const parsedArgv = JSON.parse(proc.env.ASIA_ARGV);
ansi.enabled = parsedArgv.color;

const filename = proc.env.ASIA_TEST_FILE || __filename;
const content = fs.readFileSync(filename, 'utf-8');
const reporter = utils.createReporter({
  parsedArgv,
  utils,
  ansi,
  content,
  filename,
});

proc.on('uncaughtException', (err) => {
  reporter.emit('error', err);
  proc.exit(1);
});

let snap = {};

if (parsedArgv.snapshots) {
  snap = utils.createSnaps(parsedArgv, filename);
}
if (parsedArgv.serial === true) {
  parsedArgv.concurrency = 1;
}
if (
  utils.isInstalled('@babel/register') ||
  utils.isInstalled('babel-register')
) {
  parsedArgv.snapshots = false;
}
if (utils.isInstalled('esm')) {
  parsedArgv.snapshots = true;
}

const asia = api(reporter, parsedArgv, {
  content,
  ...snap,
  filename,
});

proc.nextTick(() => {
  asia.run();
});

module.exports = asia;
