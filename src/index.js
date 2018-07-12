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
const filename = proc.env.ASIA_TEST_FILE || __filename;
const reporter = utils.createReporter({ parsedArgv, ansi, filename });

ansi.enabled = parsedArgv.colors;

const meta = utils.createMeta();
const asia = api({ parsedArgv, meta, reporter });

proc.on('uncaughtException', (err) => {
  // proc.send({ error: true, reason: serializer(err) });
  reporter.error(err);
  proc.exit(1);
});

proc.nextTick(() => {
  asia.run();
});

module.exports = asia;
