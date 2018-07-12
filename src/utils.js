'use strict';

const fs = require('fs');
const path = require('path');
const proc = require('process');
const color = require('color-support');
const babelCode = require('@babel/code-frame');
const argvParser = require('mri');
const reporters = require('./reporters');

function createMeta() {
  const tests = [];
  const stats = {
    count: 0,
    pass: 0,
    fail: 0,
    todo: 0,
    skip: 0,
  };

  return { tests, stats };
}

function getReporter(argv = {}) {
  if (typeof argv.reporter === 'string') {
    /* istanbul ignore next */
    const reporter =
      argv.reporter[0] === '.'
        ? path.join(proc.cwd(), argv.reporter)
        : argv.reporter;

    /* eslint-disable global-require, import/no-dynamic-require */
    return require(reporter);
  }

  return reporters.mini;
}

function getParsedArgv({ argv = [], env = {} }) {
  if (env.ASIA_ARGV) {
    return JSON.parse(env.ASIA_ARGV);
  }

  return argvParser(argv.slice(2), {
    alias: {
      r: 'require',
      R: 'reporter',
    },
    default: {
      reporter: null,
      min: true,
      cov: false,
      cjs: false,
      tap: false,
      serial: false,
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
  return Object.assign(
    reporters.noop(),
    getReporter(parsedArgv)({ ansi, parsedArgv, getCodeInfo, filename }),
  );
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

module.exports = {
  getReporter,
  getParsedArgv,
  getRelativePath,
  getCodeInfo,
  createReporter,
  createMeta,
};
