'use strict';

const Emitter = require('events');
const utils = require('../utils');

// TODO: finish it!

const reporter = new Emitter();

module.exports = function codeframeReporter({ ansi, parsedArgv, filename }) {
  reporter.name = 'codeframe';

  reporter.on('pass', (meta, { skip, title }) => {
    if (skip && parsedArgv.min === false) {
      const relativePath = utils.getRelativePath(filename);
      console.log(
        `${ansi.cyan('skip')}:`,
        ansi.bold(title),
        ansi.dim('(null)'),
        'at',
        ansi.green(relativePath),
      );
    } else if (!skip) {
      console.log('pass:', title);
    }
  });

  reporter.on('fail', ({ content }, { title, reason: err }) => {
    const { ok, sourceFrame } = utils.getCodeInfo({
      parsedArgv,
      filename,
      content,
      err,
    });

    const relativePath = utils.getRelativePath(filename);

    console.error(
      `${ansi.red('fail')}:`,
      ansi.bold(title),
      ansi.dim('(null)'),
      'at',
      ansi.green(relativePath),
    );

    if (ok) {
      console.error(sourceFrame);
    }
  });

  reporter.on('after', () => {
    console.log('file done:', filename);
    console.log('');
  });

  return reporter;
};
