'use strict';

const utils = require('../utils');

// TODO: finish it!

module.exports = ({ ansi, parsedArgv, filename }) => ({
  name: 'codeframe',
  after() {
    console.log('file done:', filename);
  },

  pass(meta, { skip, title }) {
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
  },

  fail({ content }, { title, reason: err }) {
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
  },
});
