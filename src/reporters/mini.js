'use strict';

const proc = require('process');
const Emitter = require('events');
const prettyMs = require('pretty-ms');

const CACHE = { time: {} };
const skipped = [];
const reporter = new Emitter();

module.exports = ({ ansi, parsedArgv, utils, filename /* , content */ }) => {
  reporter.name = 'mini';

  reporter.on('error', (err) => {
    const { ok, sourceFrame, atLine } = utils.getCodeInfo({
      parsedArgv,
      filename,
      err,
    });

    if (ok) {
      console.error(ansi.bold.bgRed('  CRITICAL  '), atLine);
      console.error(sourceFrame);
    } else {
      console.error(ansi.bold.bgRed('  CRITICAL  '));
      console.error(ansi.red(err.stack));
    }
    console.error('');

    proc.exit(1);
  });

  reporter.on('before', () => {
    CACHE.time.start = Date.now();
  });
  reporter.on('after', ({ stats }) => {
    CACHE.time.ms = Date.now() - CACHE.time.start;

    const { pass, fail, skip } = stats;

    const relative = utils.getRelativePath(filename);
    const finished = fail > 0 ? ansi.bold.bgRed.white : ansi.bold.bgGreen.white;

    const strFail = fail ? ansi.red(`${fail} failing, `) : '';
    const strSkip = skip ? ansi.cyan(`${skip} skipped`) : '';
    const strPass = `${pass} passing`;

    if (skip && parsedArgv.min === false) {
      skipped.forEach(({ title }) => {
        console.log(
          ansi.bold.bgCyan('  SKIP  '),
          `${ansi.bold.cyan(title)}`,
          `\n${ansi.bold.bgWhite.cyan('   at   ')}`,
          ansi.bold.white(relative),
          '\n',
        );
      });
    }

    const log = fail ? console.error : console.log;

    log(
      finished('  FILE  '),
      ansi.bold(relative),
      ansi.dim(`(${prettyMs(CACHE.time.ms)})`),
      `\n${finished('  DONE  ')}`,
      strFail + ansi.green(strPass) + (skip ? `, ${strSkip}` : ''),
      '\n',
    );

    proc.exit(fail ? 1 : 0);
  });

  // reporter.on('afterEach', async ({ fileshots, filesnap }, test) => {});

  reporter.on('skip', (meta, test) => {
    skipped.push(test);
  });

  reporter.on('fail', (meta, test) => {
    const { content } = meta;

    const { title, reason: err } = test;

    const { ok, sourceFrame, atLine } = utils.getCodeInfo({
      parsedArgv,
      filename,
      content,
      err,
    });

    const { bold } = ansi.bold;

    if (ok) {
      const at = atLine.trim();
      const idx = at.indexOf('(');
      const place = at.slice(3, idx - 1);
      const file = at.slice(idx);

      console.error(
        bold.bgRed.white('  FAIL  '),
        bold.white(title),
        `\n${bold.bgWhite.red('   at   ')}`,
        bold.red(place),
        ansi.dim(file),
        `\n\n${sourceFrame}\n`,
      );
    } else {
      console.error(
        bold.bgRed.white('  FAIL  '),
        bold.white(title),
        `\n${bold.bgWhite.red('   at   ')}`,
        bold.dim(filename),
        '\n',
        ansi.red(err.stack),
        '\n',
      );
    }
  });

  return reporter;
};
