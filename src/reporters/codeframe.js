'use strict';

const utils = require('../utils');

module.exports = ({ ansi, parsedArgv }) => ({
  name: 'codeframe',
  pass({ filename }, { skip, title }) {
    if (skip && parsedArgv.min === false) {
      const relativePath = utils.getRelativePath(filename);
      console.log(
        `${ansi.cyan('skip')}:`,
        ansi.bold(title),
        ansi.dim('(null)'),
        'at',
        ansi.green(relativePath),
      );
    }
  },
  fail({ content, filename }, { title, reason: err }) {
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
