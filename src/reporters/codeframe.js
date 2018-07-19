'use strict';

const path = require('path');
const proc = require('process');
const Emitter = require('events');

const globalStats = [];
const reporter = new Emitter();

function getRelativePath(fp) {
  const relativePath = path.relative(proc.cwd(), fp);
  const has = relativePath.includes('/') || relativePath.includes('\\');
  return has ? relativePath : `./${relativePath}`;
}

module.exports = function codeframeReporter({ ansi, utils, parsedArgv }) {
  reporter.name = 'codeframe';

  function onerror(meta, err) {
    const lines = err.stack.split('\n');

    const { ok, sourceFrame, atLine } = utils.getCodeInfo({
      parsedArgv,
      filename: meta.filename,
      content: meta.content,
      err,
    });

    if (ok) {
      const [, at, filepath] = /at (.+) \((.+)\)/.exec(atLine);

      console.log(
        `${ansi.red('error')}:`,
        ansi.bold(lines[0]),
        ansi.dim(`(${at})`),
        'at',
        `${ansi.green(getRelativePath(filepath))}:`,
      );
      console.log(sourceFrame);
    } else {
      console.log(`${ansi.red('error')}:`, ansi.bold(lines[0]));
      console.log(ansi.red(lines.slice(1).join('\n')));
    }
  }

  reporter.once('error', onerror);
  reporter.once('critical', onerror);

  reporter.on('after', ({ stats }) => {
    globalStats.push(stats);
  });

  reporter.on('finish', () => {
    const stats = globalStats.reduce(
      (acc, stat) => {
        acc.count += stat.count;
        acc.pass += stat.pass;
        acc.fail += stat.fail;
        acc.todo += stat.todo;
        acc.skip += stat.skip;

        return acc;
      },
      { count: 0, pass: 0, fail: 0, todo: 0, skip: 0 },
    );

    if (stats.fail) {
      console.log('');
      console.log(ansi.bold.red(`${stats.fail} error(s) found. :(`));
    } else {
      console.log('');
      console.log(ansi.bold.green(`No errors found. :)`));
    }
  });

  reporter.on('afterEach', (meta, test) => {
    const args = [
      ansi.bold(test.title),
      ansi.dim('(null)'),
      'at',
      ansi.green(getRelativePath(meta.filename)),
    ];

    if (test.skip && parsedArgv.min === false) {
      console.log(`${ansi.cyan('skip')}:`, ...args);
    } else if (test.todo && parsedArgv.min === false) {
      console.log(`${ansi.yellow('todo')}:`, ...args);
    } else if (test.isRejected) {
      const { ok, sourceFrame, atLine } = utils.getCodeInfo({
        parsedArgv,
        filename: meta.filename,
        content: meta.content,
        err: test.reason,
      });
      const [, at, filepath] = /at (.+) \((.+)\)/.exec(atLine);

      console.log(
        `${ansi.red('fail')}:`,
        ansi.bold(test.title),
        ansi.dim(`(${at})`),
        'at',
        `${ansi.green(getRelativePath(filepath))}:`,
      );

      if (ok) {
        console.log(sourceFrame);
      } else {
        console.log(ansi.red(test.reason.stack));
      }
    } else if (test.isFulfilled && parsedArgv.min === false) {
      console.log(`${ansi.green('pass')}:`, ...args);
    }
  });

  return reporter;
};
