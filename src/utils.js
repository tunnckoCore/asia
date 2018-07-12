'use strict';

const fs = require('fs');
const path = require('path');
const proc = require('process');
const assert = require('assert');
const color = require('color-support');
const babelCode = require('@babel/code-frame');
const argvParser = require('mri');
const reporters = require('./reporters');

function isInstalled(name) {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(name);
  } catch (err) {
    return false;
  }
  return true;
}

function getReporter(argv = {}) {
  if (typeof argv.reporter === 'string') {
    /* eslint-disable global-require, import/no-dynamic-require */

    if (argv.reporter[0] === '.') {
      return require(path.join(proc.cwd(), argv.reporter));
    }

    if (Object.keys(reporters).includes(argv.reporter)) {
      const reporterPath = path.join(__dirname, 'reporters', argv.reporter);
      return require(reporterPath);
    }

    const prefix = 'asia-reporter-';

    if (isInstalled(prefix + argv.reporter)) {
      return require(prefix + argv.reporter);
    }

    if (isInstalled(argv.reporter)) {
      return require(argv.reporter);
    }

    console.warn('warn: reporter you are trying to load is not installed');
    console.warn('warn: we automatically switching to the "mini" reporter');
  }

  return reporters.mini;
}

function getParsedArgv({ argv = [], env = {} }) {
  if (env.ASIA_ARGV) {
    return JSON.parse(env.ASIA_ARGV);
  }

  return argvParser(argv.slice(2), {
    alias: {
      m: 'match',
      r: 'require',
      R: 'reporter',
    },
    default: {
      match: null,
      reporter: null,
      min: true,
      cjs: false,
      concurrency: Infinity,
      colors: color.level,
      showStack: false,
      gitignore: true,
      ignore: [
        '**/.nyc_output/**',
        '**/node_modules/**',
        '**/bower_components/**',
        '**/flow-typed/**',
        '**/fixtures/**',
        '**/helpers/**',
        '**/coverage/**',
        '**/.git',
      ],
      input: [
        'test.{js,mjs,jsx}',
        'test/**/*.{js,mjs,jsx}',
        'test/*.{js,mjs,jsx}',
        'tests/**/*.{js,mjs,jsx}',
        '**/__tests__/**/*.{js,mjs,jsx}',
        '**/*.test.{js,mjs,jsx}',
        '**/*.spec.{js,mjs,jsx}',
      ],
    },
  });
}

function createReporter({ parsedArgv = {}, ansi, filename } = {}) {
  return getReporter(parsedArgv)({ ansi, parsedArgv, getCodeInfo, filename });
}

function getRelativePath(fp) {
  const prefix = `.${path.sep}`;

  return prefix + path.relative(proc.cwd(), fp);
}

function getCodeInfo({ parsedArgv = {}, content, filename, err }) {
  let parts = err.stack.split('\n');

  if (!/^(.*Error:|AssertionError)/.test(parts[0])) {
    parts = parts.slice(1);
  }

  const firstLine = parts.shift();

  const atLine = parts.filter((ln) => ln.includes(filename)).shift();

  if (atLine) {
    const filepath = atLine.slice(atLine.indexOf(' (') + 2, -1);
    const [line, column] = filepath.slice(filename.length + 1).split(':');

    const loc = { start: { line: +line, column: +column } };
    /* istanbul ignore next */
    const source = content || fs.readFileSync(filename, 'utf-8');
    const opts = {
      highlightCode: parsedArgv.colors,
      message: firstLine,
    };

    const sourceFrame = babelCode.codeFrameColumns(source, loc, opts);

    return { ok: true, sourceFrame, atLine };
  }

  return { ok: false };
}

/* istanbul ignore next */
function nextTick(fn) {
  const promise = new Promise((resolve) => {
    proc.nextTick(() => {
      resolve(fn());
    });
  });

  return promise;
}

function createError(msg) {
  const err = new Error(msg);
  err.name = 'AsiaError';
  return err;
}

module.exports = {
  assert: Object.assign(assert, { nextTick }),
  getReporter,
  getParsedArgv,
  getRelativePath,
  getCodeInfo,
  createReporter,
  createError,
  isInstalled,
};
