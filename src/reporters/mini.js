'use strict';

const fs = require('fs');
const proc = require('process');
const utils = require('../utils');

const CACHE = {};
const skipped = [];

module.exports = ({ ansi, parsedArgv, getCodeInfo, filename }) => ({
  name: 'mini',

  error(err) {
    const { ok, sourceFrame, atLine } = getCodeInfo({
      parsedArgv,
      filename,
      err,
    });

    if (ok) {
      console.error(ansi.bold.bgRed(' CRITICAL '), atLine);
      console.error(sourceFrame);
    }
    console.error('');

    proc.exit(1);
  },

  after({ stats }) {
    const { pass, fail, skip } = stats;

    const finished = fail > 0 ? ansi.bold.bgRed.white : ansi.bold.bgGreen.white;

    const relativePath = utils.getRelativePath(filename);
    const strFail = fail ? ansi.red(`${fail} failing, `) : '';
    const strSkip = skip ? ansi.cyan(`${skip} skipped`) : '';
    const strPass = `${pass} passing`;

    if (skip && parsedArgv.min === false) {
      skipped.forEach(({ title }) => {
        console.log(
          ansi.bold.bgCyan(' SKIP '),
          `${ansi.bold.cyan(title)}`,
          `\n${ansi.bold.bgWhite.cyan('  at  ')}`,
          ansi.bold.white(relativePath),
          '\n',
        );
      });
    }

    const log = fail ? console.error : console.log;

    log(
      finished(' FILE '),
      ansi.bold(relativePath),
      `\n${finished(' DONE ')}`,
      strFail + ansi.green(strPass) + (skip ? `, ${strSkip}` : ''),
      '\n',
    );

    proc.exit(fail ? 1 : 0);
  },

  pass(meta, test) {
    if (test.skip) {
      skipped.push(test);
    }
  },

  fail(meta, test) {
    let { content } = meta;

    if (CACHE[filename]) {
      // Hit filesystem once per test file
      content = CACHE[filename];
    } else {
      content = fs.readFileSync(filename, 'utf-8');
      CACHE[filename] = content;
    }

    const { title, reason: err } = test;

    const { ok, sourceFrame, atLine } = getCodeInfo({
      parsedArgv,
      filename,
      content,
      err,
    });

    if (ok) {
      const { bold } = ansi.bold;
      const at = atLine.trim();
      const idx = at.indexOf('(');
      const place = at.slice(3, idx - 1);
      const file = at.slice(idx);

      console.error(
        bold.bgRed.white(' FAIL '),
        bold.white(title),
        `\n${bold.bgWhite.red('  at  ')}`,
        bold.red(place),
        ansi.dim(file),
        `\n\n${sourceFrame}\n`,
      );
    }
  },
});
