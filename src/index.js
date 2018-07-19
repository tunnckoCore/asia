'use strict';

const fs = require('fs');
const proc = require('process');
const serializeError = require('serialize-error');
const utils = require('./utils');
const api = require('./api');

if (!proc.env.ASIA_CLI) {
  const err = new Error('run your tests through the asia cli');
  console.error('AsiaError:', `${err.name}:`, err.message);
  proc.exit(1);
}

function emit(name, meta = {}, data = {}) {
  const { args, reason, ...item } = data;
  const msg = { type: name, meta, data: item };

  if (reason) {
    msg.data.reason = serializeError(reason);
  }
  proc.send(msg);

  return { meta, data };
}

proc.on('uncaughtException', (reason) => {
  emit('critical', null, { reason });
  proc.exit(1);
});

const filename = proc.env.ASIA_TEST_FILE || __filename;
const content = fs.readFileSync(filename, 'utf-8');
const parsedArgv = JSON.parse(proc.env.ASIA_ARGV);
let snap = {};

if (parsedArgv.snapshots) {
  snap = utils.createSnaps(parsedArgv, filename);
}

if (parsedArgv.serial === true) {
  parsedArgv.concurrency = 1;
}

const asia = api(emit, parsedArgv, {
  content,
  ...snap,
  filename,
});

proc.nextTick(() => {
  /* eslint-disable promise/catch-or-return, promise/prefer-await-to-then */
  /* eslint-disable promise/always-return */
  asia.run().then(({ results }) => {
    const hasFails = results.filter((x) => x.reason).length;
    if (hasFails) {
      proc.exit(1);
    }
  });
});

module.exports = asia;
